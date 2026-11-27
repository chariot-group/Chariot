import type { Page } from "@playwright/test";
import type { CreatedCampaign, RulesetSummary } from "@/api";
import {
  breadcrumb,
  breadcrumbLabels,
  breadcrumbStep,
  builderCard,
  builderPageTitle,
  buildHillDwarfFighter,
  chooseClass,
  chooseOption,
  chooseRace,
  continueToPlayerForm,
  FIGHTER_BREADCRUMB,
  goNext,
  nextButton,
  openBuilderFromDialog,
  PAGE,
  requireBuilderRuleset,
  showBreadcrumbSteps,
  submitPlayerForm,
  waitForBuilderStart,
} from "@/builder";
import { env, uniqueLabel } from "@/env";
import {
  deleteCampaignWithGroups,
  deleteCharacters,
  deletePlayersWithoutGroupByPrefix,
  gotoSettled,
  openCampaignSidebar,
  openCharacterFromSidebar,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";
import { SMOKE } from "@/tags";

/**
 * Assistant de création de PJ, lot A (tout sauf les sorts), sur le seed `dnd5e-2014`.
 * Couvre FR-ruleset-character-builder — Web builder UI (point d'entrée et routes, pages et fil d'Ariane, champs,
 * fin de l'assistant, accessibilité), FR-player-space-codex-character-creation (choix « Assistant de création » du
 * dialogue « Créer un personnage »), FR-characters-without-group (`groups: []` en espace joueur) et FR-game-system —
 * Ruleset reference (`rulesetId` du PJ créé, ruleset de la campagne).
 *
 * Prérequis : le ruleset du seed est publié (`npm run ruleset:import` dans adventure) ; sinon les scénarios sont sautés.
 * Hors `@smoke`, ils ne tournent que sur `desktop-chrome` (`FULL_MATRIX_ONLY`, `@/tags`) : un parcours complet compte
 * une dizaine de pages.
 */

const BUILDER_URL = new RegExp(`/${env.locale}/characters/new/builder`);
const PLAYER_FORM_FROM_BUILDER = /\/characters\/new\/players\?fromBuilder=1/;
/** Niveau visé, dans la carte « Classe et niveau » (« Niveau du personnage (obligatoire) »). */
const levelInput = (page: Page) => page.getByLabel(/^Niveau du personnage/);

type BuilderFixtures = {
  /** Ruleset `dnd5e-2014` publié ; le scénario est sauté s'il manque. */
  ruleset: RulesetSummary;
  campaign: CreatedCampaign;
};

const test = base.extend<BuilderFixtures>({
  ruleset: async ({ player }, use) => {
    await use(await requireBuilderRuleset(player.api));
  },
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne assistant"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Assistant de création — espace joueur", () => {
  test.beforeEach(async ({ player }) => {
    await requireBuilderRuleset(player.api);
  });

  test(
    "le joueur crée un Nain des collines Guerrier pas à pas depuis « Vos personnages »",
    { tag: SMOKE },
    async ({ player, ruleset }) => {
      const firstname = uniqueLabel("Thorin");
      try {
        const nav = await openPlayerSpace(player.page);

        await test.step("« Créer un personnage » propose l'assistant, qui démarre sur le ruleset publié", async () => {
          await openBuilderFromDialog(player.page, nav.getByRole("button", { name: "Créer un personnage" }), BUILDER_URL);
          await waitForBuilderStart(player.page);
          await expect(player.page.getByText("Règles : Donjons & Dragons 5e (2014)")).toBeVisible();
        });

        await test.step("les pages se suivent dans l'ordre du ruleset jusqu'au récapitulatif", async () => {
          await buildHillDwarfFighter(player.page, firstname);
          expect(await breadcrumbLabels(player.page)).toEqual(FIGHTER_BREADCRUMB);
          await expect(builderCard(player.page, PAGE.race)).toContainText("Nain des collines");
          await expect(builderCard(player.page, "Statistiques du personnage")).toBeVisible();
        });

        await test.step("« Continuer vers la fiche » ouvre le formulaire PJ prérempli", async () => {
          await continueToPlayerForm(player.page, new RegExp(`/${env.locale}${PLAYER_FORM_FROM_BUILDER.source}`));
          await expect(player.page.getByLabel("Prénom", { exact: true })).toHaveValue(firstname);
        });

        await test.step("le PJ créé porte la fiche projetée, sans groupe, avec le ruleset utilisé", async () => {
          const id = await submitPlayerForm(player.page);
          const character = await player.api.getCharacter(id);
          expect(character.groups).toEqual([]);
          expect(character.rulesetId).toBe(ruleset._id);
          expect(character.profile).toMatchObject({ race: "Nain", subrace: "Nain des collines" });
          expect(character.class).toEqual([expect.objectContaining({ name: "Fighter", level: 1, hitDice: 10 })]);
          // Constitution 14 + 2 (nain) ; 10 (dé de vie) + 3 (CON 16) + 1 (ténacité naine).
          expect(character.stats?.abilityScores).toMatchObject({ constitution: 16, wisdom: 13 });
          expect(character.stats?.maxHitPoints).toBe(14);
        });
      } finally {
        await deletePlayersWithoutGroupByPrefix(player.api, firstname);
      }
    },
  );

  test("« Suivant » reste désactivé tant qu'un choix obligatoire manque", { tag: SMOKE }, async ({ player }) => {
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
    await waitForBuilderStart(player.page);
    const raceCard = builderCard(player.page, "Race");

    await test.step("sans race : « Suivant » désactivé, erreur sur le champ", async () => {
      await expect(nextButton(player.page)).toBeDisabled();
      await expect(raceCard.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
      await expect(raceCard.getByText("Ce choix est obligatoire.")).toBeVisible();
    });

    await test.step("une race choisie suffit : un compte non atteint ne bloque pas", async () => {
      await chooseRace(player.page, "Nain");
      const subrace = builderCard(player.page, "Sous-race");
      await expect(subrace.getByText(/^Encore 1 à choisir/)).toBeVisible();
      await expect(nextButton(player.page)).toBeEnabled();
      await expect(raceCard.getByRole("radiogroup")).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  test("le fil d'Ariane et les choix s'annoncent aux technologies d'assistance", { tag: SMOKE }, async ({ player }) => {
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
    await waitForBuilderStart(player.page);

    await test.step("étape courante marquée, étapes non atteintes inaccessibles", async () => {
      const nav = await showBreadcrumbSteps(player.page);
      await expect(breadcrumbStep(nav, "Race")).toHaveAttribute("aria-current", "step");
      await expect(breadcrumbStep(nav, "Race")).toHaveAccessibleName(/\(en cours\)$/);
      await expect(breadcrumbStep(nav, "Classe")).toBeDisabled();
      await expect(breadcrumbStep(nav, "Classe")).toHaveAccessibleName(/\(à venir\)$/);
      await expect(builderCard(player.page, "Race").getByRole("radiogroup", { name: "Race (obligatoire)" })).toBeVisible();
    });

    await test.step("changer de page met le focus sur le titre de la nouvelle page", async () => {
      await chooseRace(player.page, "Nain", "Nain des collines");
      await goNext(player.page, PAGE.class);
      await expect(builderPageTitle(player.page, PAGE.class)).toBeFocused();
    });

    await test.step("une page visitée se rouvre depuis le fil d'Ariane, réponses conservées", async () => {
      const nav = await showBreadcrumbSteps(player.page);
      await expect(breadcrumbStep(nav, "Race")).toHaveAccessibleName(/\(terminée\)$/);
      await breadcrumbStep(nav, "Race").click();
      await expect(builderPageTitle(player.page, PAGE.race)).toBeFocused();
      await expect(builderCard(player.page, "Race").getByRole("radio", { name: "Nain", exact: true })).toBeChecked();
    });
  });

  test("changer une réponse réévalue les pages et la progression survit au rechargement", async ({ player }) => {
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
    await waitForBuilderStart(player.page);
    const status = player.page.getByRole("status");

    await test.step("changer de race retire la sous-race choisie, avec un avertissement", async () => {
      await chooseRace(player.page, "Nain", "Nain des collines");
      await chooseOption(builderCard(player.page, "Race"), "Elfe");
      await expect(status.filter({ hasText: "Un choix n'est plus valable et n'est plus appliqué." })).toHaveCount(1);
      const subrace = builderCard(player.page, "Sous-race");
      await expect(subrace.getByRole("radio", { name: "Nain des collines" })).toHaveCount(0);
      await expect(subrace.getByRole("radio", { name: "Haut-elfe", exact: true })).not.toBeChecked();
      await chooseOption(subrace, "Haut-elfe");
    });

    await test.step("passer du niveau 1 au niveau 3 ajoute deux pages de niveau", async () => {
      await goNext(player.page, PAGE.class);
      await chooseClass(player.page, "Guerrier");
      await levelInput(player.page).fill("3");
      await expect(status.filter({ hasText: "2 pages ajoutées" })).toHaveCount(1);
      expect(await breadcrumbLabels(player.page)).toEqual(
        expect.arrayContaining(["Niveau 2", "Niveau 3"]),
      );
    });

    await test.step("un rechargement reprend sur la même page avec les mêmes réponses", async () => {
      await player.page.reload();
      await expect(builderPageTitle(player.page, PAGE.class)).toBeVisible({ timeout: 30_000 });
      await expect(builderCard(player.page, "Classe").getByRole("radio", { name: "Guerrier", exact: true })).toBeChecked();
      await expect(levelInput(player.page)).toHaveValue("3");
      expect(await breadcrumbLabels(player.page)).toEqual(expect.arrayContaining(["Niveau 2", "Niveau 3"]));
    });

    await test.step("revenir au niveau 1 retire les deux pages", async () => {
      await levelInput(player.page).fill("1");
      await expect(status.filter({ hasText: "2 pages retirées" })).toHaveCount(1);
      expect(await breadcrumbLabels(player.page)).not.toContain("Niveau 2");
    });
  });

  test("ouvert depuis une fiche, « Annuler » du formulaire y ramène, même après un rechargement", async ({ player }) => {
    const name = uniqueLabel("Fiche d'origine");
    const firstname = uniqueLabel("Abandonné");
    const origin = await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);
      await openCharacterFromSidebar(player.page, nav, name);
      await expect(player.page).toHaveURL(new RegExp(`/characters/${origin._id}`));

      await test.step("l'assistant est ouvert depuis la fiche puis rechargé", async () => {
        await openBuilderFromDialog(player.page, nav.getByRole("button", { name: "Créer un personnage" }), BUILDER_URL);
        await waitForBuilderStart(player.page);
        await player.page.reload();
        await waitForBuilderStart(player.page);
      });

      await test.step("« Continuer » puis « Annuler » dans le formulaire revient à la fiche, sans créer de PJ", async () => {
        await buildHillDwarfFighter(player.page, firstname);
        await continueToPlayerForm(player.page, PLAYER_FORM_FROM_BUILDER);
        await player.page.getByRole("button", { name: "Annuler", exact: true }).click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${origin._id}(?:[?#].*)?$`));
        const names = (await player.api.listPlayersWithoutGroup()).map((p) => p.firstname);
        expect(names).not.toContain(firstname);
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, firstname);
      await deleteCharacters(player.api, [origin._id]);
    }
  });

  test("sans page d'origine, « Annuler » ramène à « Vos personnages »", async ({ player }) => {
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
    await waitForBuilderStart(player.page);
    await player.page.getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(player.page).toHaveURL(new RegExp(`/${env.locale}/characters(?:[?#].*)?$`));
  });

  test("une erreur de chargement des règles propose « Réessayer »", async ({ player }) => {
    let failures = 1;
    await player.page.route(
      (url) => /\/rulesets\/[^/]+\/catalog$/.test(url.pathname),
      async (route) => {
        if (failures-- > 0) return route.fulfill({ status: 500, json: { message: "e2e : catalogue indisponible" } });
        return route.continue();
      },
    );
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);

    await test.step("l'erreur est annoncée à la place des pages", async () => {
      const alert = player.page.getByRole("alert").filter({ hasText: "Impossible de charger les règles de création." });
      await expect(alert).toBeVisible({ timeout: 30_000 });
      await expect(breadcrumb(player.page)).toHaveCount(0);
      await alert.getByRole("button", { name: "Réessayer" }).click();
    });

    await test.step("« Réessayer » recharge les règles et ouvre la première page", async () => {
      await waitForBuilderStart(player.page);
    });
  });
});

test.describe("Assistant de création — sans ruleset publié", () => {
  test("l'état vide renvoie vers le formulaire PJ", async ({ player }) => {
    await player.page.route(
      (url) => url.pathname.endsWith("/rulesets"),
      (route) => route.fulfill({ json: { message: "e2e : aucun ruleset", data: [] } }),
    );
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);

    await expect(player.page.getByText("Aucune règle de création n'est publiée pour l'instant.")).toBeVisible({
      timeout: 30_000,
    });
    await player.page.getByRole("link", { name: "Ouvrir le formulaire" }).click();
    await expect(player.page).toHaveURL(new RegExp(`/${env.locale}/characters/new/players(?:#.*)?$`));
    await expect(player.page.getByLabel("Prénom", { exact: true })).toBeVisible();
  });
});

test.describe("Assistant de création — groupe de campagne (MJ)", () => {
  test("le MJ crée un PJ avec l'assistant dans un groupe, sur le ruleset de la campagne", async ({ gm, campaign, ruleset }) => {
    const groupLabel = uniqueLabel("Groupe");
    const firstname = uniqueLabel("PJ assistant");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const nav = await openCampaignSidebar(gm.page, campaign);

    await test.step("l'assistant du groupe démarre directement, sans choix de règles", async () => {
      await openBuilderFromDialog(
        gm.page,
        nav.getByRole("button", { name: "Créer un personnage" }),
        new RegExp(`/campaigns/${campaign._id}/groups/${group._id}/characters/new/builder`),
      );
      await expect(builderPageTitle(gm.page, PAGE.race)).toBeVisible({ timeout: 30_000 });
      await expect(gm.page.getByRole("heading", { name: "Choisis les règles de création" })).toHaveCount(0);
    });

    await test.step("le parcours aboutit au formulaire PJ du groupe", async () => {
      await buildHillDwarfFighter(gm.page, firstname);
      await continueToPlayerForm(
        gm.page,
        new RegExp(`/groups/${group._id}/characters/new/players\\?fromBuilder=1`),
      );
    });

    await test.step("le PJ créé appartient au groupe et garde le ruleset de la campagne", async () => {
      const id = await submitPlayerForm(gm.page);
      await expect(gm.page).toHaveURL(new RegExp(`/groups/${group._id}/characters/${id}`));
      const character = await gm.api.getCharacter(id);
      expect(character.groups).toEqual([group._id]);
      expect(character.rulesetId).toBe(ruleset._id);
    });
  });
});
