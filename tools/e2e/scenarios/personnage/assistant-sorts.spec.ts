import type { Locator, Page } from "@playwright/test";
import {
  builderCard,
  buildHillDwarfWizardUntilSpells,
  continueToPlayerForm,
  counter,
  fillBuilderFirstname,
  goNext,
  nextButton,
  PAGE,
  requireBuilderRuleset,
  simulateCodexDown,
  submitPlayerForm,
  waitForBuilderStart,
} from "@/builder";
import { env, uniqueLabel } from "@/env";
import { deletePlayersWithoutGroupByPrefix, gotoSettled } from "@/flows";
import { expect, test } from "@/fixtures";

/**
 * Assistant de création de PJ, lot B : les sorts (`spellSelect`), sur un Nain des collines Magicien niveau 1
 * (3 sorts mineurs, 6 sorts de niveau 1 au grimoire).
 * Couvre FR-ruleset-character-builder — Web builder UI (Spells, lot B) : recherche Codex préfiltrée sur la classe et le
 * niveau, saisie manuelle, compteurs, doublon, sort hors niveau signalé, retrait, Codex indisponible ;
 * et FR-codex-search-filters (recherche de sorts de l'onglet Magie, réutilisée).
 *
 * Prérequis : le ruleset du seed est publié (`npm run ruleset:import` dans adventure) ; sinon les scénarios sont sautés.
 * La recherche Codex demande une librairie communautaire disponible avec des sorts mineurs de magicien.
 * Ces scénarios ne tournent que sur `desktop-chrome` (`FULL_MATRIX_ONLY`, `@/tags`).
 */

const BUILDER_URL = new RegExp(`/${env.locale}/characters/new/builder`);

const cantripsCard = (page: Page) => builderCard(page, "Sorts mineurs");
const spellsCard = (page: Page) => builderCard(page, "Sorts");

/** Ajoute un sort par le dialogue « Ajouter un sort » de la carte `card` (niveau laissé par défaut si non donné). */
async function addManualSpell(page: Page, card: Locator, name: string, level?: number): Promise<void> {
  await card.getByRole("button", { name: "Ajouter à la main" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un sort" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nom du sort", { exact: true }).fill(name);
  if (level !== undefined) await dialog.getByLabel("Niveau", { exact: true }).fill(String(level));
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(dialog).toBeHidden();
}

/** Sort choisi dans une carte, repéré par son action « Retirer <nom> ». */
function removeButton(card: Locator, name: string): Locator {
  return card.getByRole("button", { name: `Retirer ${name}`, exact: true });
}

test.beforeEach(async ({ player }) => {
  await requireBuilderRuleset(player.api);
});

test("un Magicien niveau 1 choisit ses sorts mineurs dans le Codex et un sort à la main", async ({ player }) => {
  const firstname = uniqueLabel("Elminster");
  const manual = uniqueLabel("Sort manuel");
  try {
    await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
    await waitForBuilderStart(player.page);
    await buildHillDwarfWizardUntilSpells(player.page);

    await test.step("les compteurs partent de 0 / 3 et 0 / 6", async () => {
      await expect(counter(cantripsCard(player.page), 0, 3)).toBeVisible();
      await expect(counter(spellsCard(player.page), 0, 6)).toBeVisible();
    });

    await test.step("« Chercher dans le Codex » ouvre la recherche préfiltrée sur le magicien et les sorts mineurs", async () => {
      await cantripsCard(player.page).getByRole("button", { name: "Chercher dans le Codex" }).click();
      const dialog = player.page.getByRole("dialog", { name: "Rechercher un sort dans la librairie communautaire" });
      await expect(dialog).toBeVisible();
      // Résultats : bouton de sélection de chaque ligne, nommé par le sort et décrit par son niveau et ses classes.
      // Filtres repliés à l'ouverture : le préfiltre se lit sur les résultats (niveau 0, classe Magicien).
      const results = dialog.getByRole("button", { description: /Sorts de niveau 0/ });
      await expect(results.nth(2)).toBeVisible({ timeout: 30_000 });
      await expect(dialog.getByRole("button", { description: /Sorts de niveau [1-9]/ })).toHaveCount(0);
      for (const index of [0, 1, 2]) await expect(results.nth(index)).toHaveAccessibleDescription(/Magicien/);
      for (const index of [0, 1, 2]) {
        await results.nth(index).click();
        await dialog.getByRole("button", { name: "Sélectionner ce sort", exact: true }).click();
      }
      await dialog.getByRole("button", { name: "Ajouter la sélection (3)" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("les trois sorts sont ajoutés depuis le Codex : 3 / 3", async () => {
      const card = cantripsCard(player.page);
      await expect(counter(card, 3, 3)).toBeVisible();
      await expect(card.getByRole("button", { name: /^Retirer / })).toHaveCount(3);
      await expect(card.getByText("Codex", { exact: true })).toHaveCount(3);
    });

    await test.step("un sort ajouté à la main : 1 / 6, source « Manuel »", async () => {
      const card = spellsCard(player.page);
      await addManualSpell(player.page, card, manual);
      await expect(counter(card, 1, 6)).toBeVisible();
      await expect(removeButton(card, manual)).toBeVisible();
      await expect(card.getByText("Manuel", { exact: true })).toBeVisible();
    });

    await test.step("le PJ créé porte les quatre sorts dans son bloc de magicien", async () => {
      await goNext(player.page, PAGE.details);
      await fillBuilderFirstname(player.page, firstname);
      await goNext(player.page, PAGE.summary);
      await continueToPlayerForm(player.page, /\/characters\/new\/players\?fromBuilder=1/);
      const id = await submitPlayerForm(player.page);
      const { spellcasting = [] } = await player.api.getCharacter(id);
      const spells = spellcasting.flatMap((block) => block.spells ?? []);
      expect(spells).toHaveLength(4);
      expect(spells.filter((spell) => spell.level === 0)).toHaveLength(3);
      expect(spells).toContainEqual(expect.objectContaining({ name: manual, level: 1 }));
    });
  } finally {
    await deletePlayersWithoutGroupByPrefix(player.api, firstname);
  }
});

test("un sort n'est ajouté qu'une fois, un sort hors niveau est signalé, le retrait met le compteur à jour", async ({
  player,
}) => {
  const first = uniqueLabel("Projectile");
  const tooHigh = uniqueLabel("Sort de niveau 2");
  await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
  await waitForBuilderStart(player.page);
  await buildHillDwarfWizardUntilSpells(player.page);
  const card = spellsCard(player.page);

  await test.step("le même sort (nom et niveau) n'est ajouté qu'une fois", async () => {
    await addManualSpell(player.page, card, first);
    await addManualSpell(player.page, card, first);
    await expect(counter(card, 1, 6)).toBeVisible();
    await expect(removeButton(card, first)).toHaveCount(1);
  });

  await test.step("un sort de niveau 2 est gardé, avec un avertissement non bloquant", async () => {
    await addManualSpell(player.page, card, tooHigh, 2);
    await expect(counter(card, 2, 6)).toBeVisible();
    await expect(card.getByText("Ce sort sort des niveaux proposés pour ce choix.")).toBeVisible();
    await expect(nextButton(player.page)).toBeEnabled();
  });

  await test.step("retirer le sort met à jour le compteur et l'avertissement disparaît", async () => {
    await removeButton(card, tooHigh).click();
    await expect(counter(card, 1, 6)).toBeVisible();
    await expect(card.getByText("Ce sort sort des niveaux proposés pour ce choix.")).toHaveCount(0);
  });
});

test("Codex indisponible : la recherche est désactivée, la saisie manuelle reste possible et s'annule", async ({
  player,
}) => {
  await simulateCodexDown(player.page);
  await gotoSettled(player.page, `/${env.locale}/characters/new/builder`, BUILDER_URL);
  await waitForBuilderStart(player.page);
  await buildHillDwarfWizardUntilSpells(player.page);
  const card = cantripsCard(player.page);

  await test.step("« Chercher dans le Codex » est désactivé, avec le message en description", async () => {
    const search = card.getByRole("button", { name: "Chercher dans le Codex" });
    await expect(search).toHaveAttribute("aria-disabled", "true");
    await expect(search).toHaveAccessibleDescription(/La librairie communautaire est actuellement indisponible/);
    // `aria-disabled` (et non `disabled`) : le bouton reste focalisable pour lire son message ; Entrée n'ouvre rien.
    await search.focus();
    await player.page.keyboard.press("Enter");
    await expect(player.page.getByRole("dialog", { name: "Rechercher un sort dans la librairie communautaire" })).toHaveCount(0);
  });

  await test.step("annuler l'ajout manuel n'ajoute rien", async () => {
    await card.getByRole("button", { name: "Ajouter à la main" }).click();
    const dialog = player.page.getByRole("dialog", { name: "Ajouter un sort" });
    await dialog.getByLabel("Nom du sort", { exact: true }).fill(uniqueLabel("Annulé"));
    await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(counter(card, 0, 3)).toBeVisible();
    await expect(card.getByText("Aucun sort choisi.")).toBeVisible();
  });
});
