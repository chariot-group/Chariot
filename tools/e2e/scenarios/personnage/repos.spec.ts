import type { Locator, Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, PlayerSeed } from "@/api";
import { env, uniqueLabel } from "@/env";
import {
  deleteCampaignWithGroups,
  closeDialogIfOpen,
  deleteCharacters,
  expandGroup,
  groupContent,
  openCampaignSidebar,
  openCharacterFromSidebar,
  openGroupActions,
  openPlayerSpace,
  launchSessionFromSidebar,
  openJoinCharacterOption,
  refreshCachedUser,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * Repos des personnages joueurs (PJ), hors session et en session.
 * Couvre FR-character-long-rest (repos long sur la fiche en espace MJ hors session, aucun repos hors session
 * en espace joueur, « Repos long du groupe » et son décompte, seule action de groupe active en session),
 * FR-character-statistics-card (repos court en session : ligne « Points de vie récupérés : +N »),
 * FR-sidebar-context-actions (exception de session) et, pour le scénario en session,
 * FR-session-lobby-wheel-deposit (dépôt des wheels, « Lancer la session ») et FR-session-websocket-lifecycle.
 */

/** PJ blessé : Guerrier niveau 3 (d10), 1 dé de vie restant sur 3, 5 PV sur 30 et 4 PV temporaires. */
const WOUNDED_FIGHTER: PlayerSeed = {
  class: [{ name: "Fighter", level: 3, hitDice: 10, hitDiceRemaining: 1 }],
  stats: { maxHitPoints: 30, currentHitPoints: 5, tempHitPoints: 4 },
};

async function hitPoints(api: ChariotApi, characterId: string) {
  const { stats, class: classes } = await api.getCharacter(characterId);
  return {
    current: stats?.currentHitPoints,
    temp: stats?.tempHitPoints,
    hitDiceRemaining: classes?.[0]?.hitDiceRemaining,
  };
}

/** Carte « Statistiques » de la fiche (région nommée par son titre). */
function statisticsCard(page: Page): Locator {
  return page.getByRole("region", { name: "Statistiques" });
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne repos"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Repos des PJ hors session", () => {
  test("le MJ applique un repos long sur la fiche d'un PJ de son groupe", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("Blessé");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const character = await gm.api.createPlayer(name, { ...WOUNDED_FIGHTER, groups: [group._id] });
    try {
      const nav = await openCampaignSidebar(gm.page, campaign);
      await expandGroup(nav, groupLabel);
      await openCharacterFromSidebar(gm.page, await groupContent(nav, groupLabel), name);
      await expect(gm.page).toHaveURL(new RegExp(`/characters/${character._id}`));
      const stats = statisticsCard(gm.page);

      await test.step("hors session : repos long seul, le repos court est signalé « en session »", async () => {
        await expect(stats.getByText("Le repos court n'est disponible qu'en session.")).toBeVisible();
        await expect(stats.getByRole("button", { name: "Repos court" })).toHaveCount(0);
      });

      const dialog = gm.page.getByRole("dialog", { name: "Confirmer le repos long ?" });
      await test.step("la confirmation liste uniquement les effets utiles ; Annuler ne change rien", async () => {
        await stats.getByRole("button", { name: "Repos long" }).click();
        await expect(dialog.getByText("Les points de vie actuels remontent au maximum.")).toBeVisible();
        await expect(dialog.getByText("Les points de vie temporaires repassent à zéro.")).toBeVisible();
        await expect(dialog.getByText(/Les dés de vie restants pour chaque classe remontent au maximum/)).toBeVisible();
        await expect(dialog.getByText("Le niveau d’épuisement diminue de 1."), "épuisement déjà à 0").toHaveCount(0);
        await dialog.getByRole("button", { name: "Annuler" }).click();
        await expect(dialog).toBeHidden();
        expect(await hitPoints(gm.api, character._id)).toEqual({ current: 5, temp: 4, hitDiceRemaining: 1 });
      });

      await test.step("Confirmer : PV au maximum, PV temporaires à 0, dés de vie restaurés", async () => {
        await stats.getByRole("button", { name: "Repos long" }).click();
        await dialog.getByRole("button", { name: "Confirmer" }).click();
        await expect(gm.page.getByText("Repos long effectué.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect.poll(() => hitPoints(gm.api, character._id)).toEqual({ current: 30, temp: 0, hitDiceRemaining: 3 });
      });
    } finally {
      await deleteCharacters(gm.api, [character._id]);
    }
  });

  test("en espace joueur, aucun repos n'est proposé hors session", async ({ player }) => {
    const name = uniqueLabel("Sans repos");
    const character = await player.api.createPlayer(name, WOUNDED_FIGHTER);
    try {
      const nav = await openPlayerSpace(player.page);
      await openCharacterFromSidebar(player.page, nav, name);
      await expect(player.page).toHaveURL(new RegExp(`/characters/${character._id}`));
      const stats = statisticsCard(player.page);

      await expect(stats.getByText("Les repos ne sont disponibles qu'en session.")).toBeVisible();
      await expect(stats.getByRole("button", { name: "Repos long" })).toHaveCount(0);
      await expect(stats.getByRole("button", { name: "Repos court" })).toHaveCount(0);
      expect(await hitPoints(player.api, character._id)).toEqual({ current: 5, temp: 4, hitDiceRemaining: 1 });
    } finally {
      await deleteCharacters(player.api, [character._id]);
    }
  });

  test("le MJ fait le repos long de tout un groupe", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Compagnie");
    const emptyLabel = uniqueLabel("Vide");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    await seedActiveGroup(gm.api, campaign._id, emptyLabel);
    const members = [
      await gm.api.createPlayer(uniqueLabel("Lame"), { ...WOUNDED_FIGHTER, groups: [group._id] }),
      await gm.api.createPlayer(uniqueLabel("Bouclier"), { ...WOUNDED_FIGHTER, groups: [group._id] }),
    ];
    try {
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).length).toBe(2);
      const nav = await openCampaignSidebar(gm.page, campaign);

      await test.step("groupe sans personnage : « Repos long du groupe » désactivé", async () => {
        const menu = await openGroupActions(gm.page, nav, emptyLabel);
        await expect(menu.getByRole("menuitem", { name: "Repos long du groupe" })).toBeDisabled();
        await gm.page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      });

      const confirm = gm.page.getByRole("dialog", { name: `Repos long : ${groupLabel}` });
      await test.step("la confirmation annonce 2 PJ et aucun PNJ ; Échap annule", async () => {
        const menu = await openGroupActions(gm.page, nav, groupLabel);
        await menu.getByRole("menuitem", { name: "Repos long du groupe" }).click();
        await expect(confirm.getByText(/2 PJ et aucun PNJ/)).toBeVisible();
        await gm.page.keyboard.press("Escape");
        await expect(confirm).toBeHidden();
        expect((await hitPoints(gm.api, members[0]._id)).current).toBe(5);
      });

      await test.step("« Faire le repos long » repose les 2 PJ", async () => {
        const menu = await openGroupActions(gm.page, nav, groupLabel);
        await menu.getByRole("menuitem", { name: "Repos long du groupe" }).click();
        await confirm.getByRole("button", { name: "Faire le repos long" }).click();
        await expect(gm.page.getByText("2 personnages reposés", { exact: true })).toBeVisible();
        await expect(confirm).toBeHidden();
        for (const member of members) {
          await expect.poll(() => hitPoints(gm.api, member._id)).toEqual({ current: 30, temp: 0, hitDiceRemaining: 3 });
        }
      });
    } finally {
      await deleteCharacters(gm.api, members.map((m) => m._id));
    }
  });
});

test.describe("Repos des PJ en session", () => {
  /**
   * Lancer une session débite une wheel par participant (FR-session-lobby-wheel-deposit) :
   * chaque exécution consomme 1 wheel du MJ et 1 du joueur. Les comptes de test sont crédités au besoin
   * (`ensureWheels` : route interne avec `INTERNAL_SERVICE_SECRET`, sinon commande gratuite avec `KEYCLOAK_ADMIN_*`) ;
   * sans l'un ni l'autre et sans solde, le test est ignoré (pas en échec).
   */
  test("en session lancée, le joueur fait un repos court ; le MJ n'a plus que le repos long de groupe", async ({
    gm,
    player,
    campaign,
  }) => {
    const [gmBalance, playerBalance] = await Promise.all([gm.api.ensureWheels(1), player.api.ensureWheels(1)]);
    test.skip(gmBalance < 1 || playerBalance < 1, `wheels insuffisantes (MJ ${gmBalance}, joueur ${playerBalance}) pour lancer une session`);

    const groupLabel = uniqueLabel("Table");
    const gmName = uniqueLabel("Garde");
    const name = uniqueLabel("Aventurier");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const gmCharacter = await gm.api.createPlayer(gmName, { groups: [group._id] });
    const character = await player.api.createPlayer(name, {
      class: [{ name: "Fighter", level: 2, hitDice: 10, hitDiceRemaining: 1 }],
      stats: { maxHitPoints: 20, currentHitPoints: 5, tempHitPoints: 0 },
    });
    let code: string | undefined;

    try {
      await test.step("MJ et joueur : l'app relit le solde crédité", async () => {
        await Promise.all([refreshCachedUser(gm.page), refreshCachedUser(player.page)]);
      });

      await test.step("MJ : lancer une session depuis la sidebar de la campagne", async () => {
        await openCampaignSidebar(gm.page, campaign);
        code = await launchSessionFromSidebar(gm.page);
        await expect(gm.page.getByRole("dialog")).toBeVisible();
      });

      await test.step("Joueur : rejoindre avec son PJ", async () => {
        const option = await openJoinCharacterOption(player.page, character._id, code!, name);
        const join = player.page.getByRole("dialog", { name: "Rejoindre une session" });
        await option.click();
        await join.getByRole("button", { name: "Rejoindre la session" }).click();
        await expect(join).toBeHidden();
        await expect(gm.page.getByRole("dialog").getByText(name)).toBeVisible();
      });

      await test.step("chacun dépose une wheel, le MJ lance la session", async () => {
        await player.page.getByRole("dialog").getByRole("button", { name: "Déposer une wheel" }).click();
        await gm.page.getByRole("dialog").getByRole("button", { name: "Déposer une wheel" }).click();
        await expect(player.page.getByText(/en attente du maître du jeu pour lancer la session/)).toBeVisible();
        await gm.page.getByRole("button", { name: "Lancer la session (toutes les wheels ont été déposées)" }).click();
        await expect(gm.page.getByText("La session a été lancée !")).toBeVisible();
        await expect(player.page.getByText("La session a été lancée !")).toBeVisible();
      });

      await test.step("MJ : en session, le menu de groupe n'active que « Repos long du groupe »", async () => {
        await closeDialogIfOpen(gm.page);
        const nav = await openCampaignSidebar(gm.page, campaign);
        const menu = await openGroupActions(gm.page, nav, groupLabel);
        await expect(menu.getByRole("menuitem", { name: "Repos long du groupe" })).toBeEnabled();
        for (const action of ["Modifier", "Dupliquer", "Archiver", "Supprimer"]) {
          await expect(menu.getByRole("menuitem", { name: action })).toBeDisabled();
        }
        await gm.page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      });

      const dialog = player.page.getByRole("dialog", { name: "Confirmer le repos court ?" });
      await test.step("Joueur : repos court avec un dé de vie, la ligne de soin suit le jet", async () => {
        await closeDialogIfOpen(player.page);
        await player.page.goto(`/${env.locale}/characters/${character._id}`);
        await statisticsCard(player.page).getByRole("button", { name: "Repos court" }).click();
        await expect(dialog.getByText("Points de vie récupérés : +0")).toBeVisible();
        await dialog.getByRole("button", { name: "Ajouter un dé de vie" }).click();
        await dialog.getByLabel("Dé 1 (d10)").fill("6");
        await expect(dialog.getByText("Points de vie récupérés : +6")).toBeVisible();
        await dialog.getByRole("button", { name: "Confirmer" }).click();
        await expect(player.page.getByText("Repos court effectué.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect.poll(() => hitPoints(player.api, character._id)).toEqual({ current: 11, temp: 0, hitDiceRemaining: 0 });
      });

      await test.step("Joueur : après rechargement, la session reste lancée et la fiche garde les PV soignés", async () => {
        await player.page.reload();
        const stats = statisticsCard(player.page);
        await expect(stats.getByRole("button", { name: "Repos court" })).toBeVisible();
        await expect(stats.getByText("Les repos ne sont disponibles qu'en session.")).toHaveCount(0);
        await stats.getByRole("button", { name: "Repos court" }).click();
        // Plus aucun dé de vie à dépenser : pas de ligne de soin (FR-character-statistics-card).
        await expect(dialog.getByText(/Points de vie récupérés/)).toHaveCount(0);
        await dialog.getByRole("button", { name: "Annuler" }).click();
        await expect(dialog).toBeHidden();
      });
    } finally {
      if (code) {
        await player.api.leaveSession(code).catch(() => undefined);
        await gm.api.leaveSession(code).catch(() => undefined);
      }
      await deleteCharacters(player.api, [character._id]);
      await deleteCharacters(gm.api, [gmCharacter._id]);
    }
  });
});
