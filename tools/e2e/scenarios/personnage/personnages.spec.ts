import type { Locator, Page } from "@playwright/test";
import type { CreatedCampaign } from "@/api";
import { env, uniqueLabel } from "@/env";
import {
  characterLink,
  deleteCampaignWithGroups,
  deleteCharacters,
  deletePlayersWithoutGroupByPrefix,
  ensureSidebarOpen,
  expandGroup,
  groupContent,
  groupHeader,
  openCampaignSidebar,
  openCharacterActions,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * CRUD des personnages joueurs (PJ), dans l'espace joueur (« Vos personnages ») et dans un groupe de campagne (espace MJ).
 * Couvre FR-player-space-codex-character-creation (dialogue « Créer un personnage », PJ manuel, `groups: []`),
 * FR-characters-without-group, FR-sidebar-context-actions (Modifier → édition de la fiche, Supprimer avec confirmation,
 * Échap / Entrée, clic droit sur ordinateur et bouton `⋮` sous 1024 px) et FR-player-companion-choice
 * (toast « {nom} supprimé avec succès. »).
 *
 * Chaque test prépare ses personnages par l'API et les supprime à la fin, même en échec.
 */

/** Identifiant du personnage affiché, lu dans l'URL de sa fiche (`…/characters/<id>`). */
async function characterIdFromUrl(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/characters\/[a-f0-9]{24}(?:[?#].*)?$/);
  return new URL(page.url()).pathname.split("/characters/")[1].split("/")[0];
}

/**
 * Remplit le formulaire de création d'un PJ (onglet Général : prénom et classe, seuls champs requis) et le valide.
 * Renvoie l'identifiant du PJ créé.
 */
async function submitNewPlayerForm(page: Page, firstname: string): Promise<string> {
  await page.getByLabel("Prénom").fill(firstname);
  await page.getByLabel("Nom de la classe").click();
  await page.getByRole("option", { name: "Guerrier" }).click();
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(page.getByText("Personnage créé avec succès")).toBeVisible();
  return characterIdFromUrl(page);
}

/**
 * Ouvre « Créer un personnage » puis choisit « Personnage joueur » (création manuelle), jusqu'au formulaire `formUrl`.
 * Juste après la connexion, FR-post-auth-navigation peut encore rediriger et annuler la navigation vers le formulaire :
 * on relance alors le choix.
 */
async function chooseManualPlayer(page: Page, trigger: Locator, formUrl: RegExp): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Créer un personnage" });
  await expect(async () => {
    if (!(await dialog.isVisible())) await trigger.click();
    await expect(dialog.getByRole("button", { name: "Créer un PNJ manuellement" })).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole("button", { name: "Créer un personnage joueur manuellement" }).click();
    await expect(page).toHaveURL(formUrl, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(dialog).toBeHidden();
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PJ"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Personnages joueurs — espace joueur", () => {
  test("le joueur crée un PJ depuis « Vos personnages »", async ({ player }) => {
    const name = uniqueLabel("Nouveau PJ");
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("« Créer un personnage » propose PJ, PNJ ou librairie, puis ouvre le formulaire PJ", async () => {
        await chooseManualPlayer(
          player.page,
          nav.getByRole("button", { name: "Créer un personnage" }),
          new RegExp(`/${env.locale}/characters/new/players`),
        );
      });

      const id = await test.step("remplir et valider le formulaire", () => submitNewPlayerForm(player.page, name));

      await test.step("le PJ est sans groupe et apparaît dans « Vos personnages »", async () => {
        expect((await player.api.getCharacter(id)).groups).toEqual([]);
        await expect.poll(async () => (await player.api.listPlayersWithoutGroup()).map((p) => p._id)).toContain(id);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toBeVisible();
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le prénom et la classe sont requis à la création", async ({ player }) => {
    const name = uniqueLabel("PJ incomplet");
    try {
      await player.page.goto(`/${env.locale}/characters/new/players`);
      const firstname = player.page.getByLabel("Prénom");
      await expect(firstname).toBeVisible();

      await test.step("formulaire vide : rien n'est créé, le prénom est signalé invalide", async () => {
        await player.page.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(firstname).toHaveAttribute("aria-invalid", "true");
        await expect(player.page).toHaveURL(/\/characters\/new\/players/);
      });

      await test.step("Annuler quitte le formulaire sans créer de PJ", async () => {
        await firstname.fill(name);
        await player.page.getByRole("button", { name: "Annuler", exact: true }).click();
        await expect(player.page).not.toHaveURL(/\/characters\/new\/players/);
        const names = (await player.api.listPlayersWithoutGroup()).map((p) => p.firstname);
        expect(names).not.toContain(name);
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le joueur renomme un PJ via « Modifier »", async ({ player }) => {
    const name = uniqueLabel("Avant");
    const renamed = uniqueLabel("Après");
    const character = await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("Modifier ouvre la fiche en édition, préremplie", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Modifier" }).click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${character._id}`));
        await expect(player.page.getByLabel("Prénom")).toHaveValue(name);
      });

      await test.step("Sauvegarder enregistre le nouveau prénom", async () => {
        await player.page.getByLabel("Prénom").fill(renamed);
        await player.page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
        await expect(player.page.getByText("Personnage mis à jour avec succès")).toBeVisible();
        await expect(player.page.getByRole("button", { name: "Modifier le personnage" })).toBeVisible();
      });

      await test.step("le nouveau nom remplace l'ancien dans la sidebar et côté API", async () => {
        await expect.poll(async () => (await player.api.getCharacter(character._id)).firstname).toBe(renamed);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, renamed)).toBeVisible();
        await expect(characterLink(nav, name)).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(player.api, [character._id]);
    }
  });

  test("le joueur supprime un PJ après confirmation", async ({ player }) => {
    const name = uniqueLabel("Supprimable");
    const character = await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);
      const confirm = player.page.getByRole("dialog", { name: "Supprimer le personnage" });

      await test.step("Échap annule : le PJ est conservé", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        await expect(confirm.getByText("Cette action est irréversible.", { exact: false })).toBeVisible();
        await player.page.keyboard.press("Escape");
        await expect(confirm).toBeHidden();
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toBeVisible();
      });

      await test.step("Supprimer confirme : toast nommant le PJ, disparition de la sidebar et de l'API", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        await confirm.getByRole("button", { name: "Supprimer" }).click();
        // Le nom est tronqué à 32 caractères dans le toast (FR-player-companion-choice).
        await expect(player.page.getByText(/supprimé avec succès\./)).toBeVisible();
        await expect(confirm).toBeHidden();
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toHaveCount(0);
        await expect
          .poll(async () => (await player.api.listPlayersWithoutGroup()).map((p) => p._id))
          .not.toContain(character._id);
      });
    } finally {
      await deleteCharacters(player.api, [character._id]);
    }
  });
});

test.describe("Personnages joueurs — groupe de campagne (MJ)", () => {
  test("le MJ crée un PJ dans un groupe", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("PJ du groupe");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const nav = await openCampaignSidebar(gm.page, campaign);

    await test.step("« Créer un personnage » du groupe ouvre le formulaire PJ du groupe", async () => {
      await chooseManualPlayer(
        gm.page,
        nav.getByRole("button", { name: "Créer un personnage" }),
        new RegExp(`/groups/${group._id}/characters/new/players`),
      );
    });

    const id = await test.step("remplir et valider le formulaire", () => submitNewPlayerForm(gm.page, name));

    await test.step("le PJ appartient au groupe, dans la sidebar et côté API", async () => {
      await expect(gm.page).toHaveURL(new RegExp(`/groups/${group._id}/characters/${id}`));
      expect((await gm.api.getCharacter(id)).groups).toEqual([group._id]);
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).map((c) => c._id)).toContain(id);
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, groupLabel);
      await expect(characterLink(await groupContent(nav, groupLabel), name)).toBeVisible();
    });
  });

  test("le MJ supprime un PJ du groupe en confirmant avec Entrée", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("PJ supprimé");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const character = await gm.api.createPlayer(name, { groups: [group._id] });
    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandGroup(nav, groupLabel);
    const members = await groupContent(nav, groupLabel);

    await test.step("Supprimer puis Entrée", async () => {
      const menu = await openCharacterActions(gm.page, members, name);
      await expect(menu.getByRole("menuitem", { name: "Déplacer" }), "seul groupe : rien vers où déplacer").toHaveCount(0);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      const confirm = gm.page.getByRole("dialog", { name: "Supprimer le personnage" });
      await expect(confirm).toBeVisible();
      await gm.page.keyboard.press("Enter");
      await expect(gm.page.getByText(/supprimé avec succès\./)).toBeVisible();
      await expect(confirm).toBeHidden();
    });

    await test.step("le groupe est vide, dans la sidebar et côté API", async () => {
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).map((c) => c._id)).not.toContain(character._id);
      await ensureSidebarOpen(gm.page);
      await expect(groupHeader(nav, groupLabel)).toBeVisible();
      await expandGroup(nav, groupLabel);
      await expect(characterLink(await groupContent(nav, groupLabel), name)).toHaveCount(0);
    });
  });
});
