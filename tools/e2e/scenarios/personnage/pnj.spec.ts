import type { Locator, Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign } from "@/api";
import { env, uniqueLabel } from "@/env";
import {
  characterLink,
  closeDialogIfOpen,
  deleteCampaignWithGroups,
  deleteCharacters,
  ensureSidebarOpen,
  escapeRegExp,
  expandGroup,
  groupContent,
  openCampaignSidebar,
  openCharacterActions,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * CRUD des PNJ, dans l'espace joueur (« Vos personnages ») et dans un groupe de campagne (espace MJ).
 * Couvre FR-player-space-codex-character-creation (dialogue « Créer un personnage », PNJ manuel, `groups: []`),
 * FR-npc-player-link (PNJ non lié à la racine de « Vos personnages », badge PNJ dans le nom accessible)
 * et FR-sidebar-context-actions (Modifier → édition de la fiche, Supprimer avec confirmation, Échap / Entrée,
 * clic droit sur ordinateur et bouton `⋮` sous 1024 px).
 *
 * Chaque test prépare ses personnages par l'API et les supprime à la fin, même en échec.
 */

/** Identifiant du personnage affiché, lu dans l'URL de sa fiche (`…/characters/<id>`). */
async function characterIdFromUrl(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/characters\/[a-f0-9]{24}(?:[?#].*)?$/);
  return new URL(page.url()).pathname.split("/characters/")[1].split("/")[0];
}

/**
 * Ouvre « Créer un personnage » puis choisit « PNJ » (création manuelle), jusqu'au formulaire `formUrl`.
 * Juste après la connexion, FR-post-auth-navigation peut encore rediriger : on relance alors le choix.
 */
async function chooseManualNpc(page: Page, trigger: Locator, formUrl: RegExp): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Créer un personnage" });
  await expect(async () => {
    if (!(await dialog.isVisible())) await trigger.click();
    await expect(dialog.getByRole("button", { name: "Créer un personnage joueur manuellement" })).toBeVisible({
      timeout: 5_000,
    });
    await dialog.getByRole("button", { name: "Créer un PNJ manuellement" }).click();
    await expect(page).toHaveURL(formUrl, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await expect(dialog).toBeHidden();
}

/** Remplit le prénom (seul champ requis d'un PNJ) et valide le formulaire. Renvoie l'identifiant du PNJ créé. */
async function submitNewNpcForm(page: Page, firstname: string): Promise<string> {
  await page.getByLabel("Prénom").fill(firstname);
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(page.getByText("Personnage créé avec succès")).toBeVisible();
  return characterIdFromUrl(page);
}

async function npcIdsWithoutGroup(api: ChariotApi): Promise<string[]> {
  return (await api.listNpcsWithoutGroup()).map((c) => c._id);
}

/** Supprime les PNJ sans groupe dont le prénom commence par `prefix` (créés par l'UI pendant le scénario). */
async function deleteNpcsWithoutGroupByPrefix(api: ChariotApi, prefix: string): Promise<void> {
  const npcs = await api.listNpcsWithoutGroup().catch(() => []);
  await deleteCharacters(
    api,
    npcs.filter((c) => c.firstname.startsWith(prefix)).map((c) => c._id),
  );
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PNJ"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("PNJ — espace joueur", () => {
  test("le joueur crée un PNJ depuis « Vos personnages »", async ({ player }) => {
    const name = uniqueLabel("Nouveau PNJ");
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("« Créer un personnage » → PNJ ouvre le formulaire PNJ", async () => {
        await chooseManualNpc(
          player.page,
          nav.getByRole("button", { name: "Créer un personnage" }),
          new RegExp(`/${env.locale}/characters/new/npcs`),
        );
      });

      const id = await test.step("remplir et valider le formulaire", () => submitNewNpcForm(player.page, name));

      await test.step("le PNJ est sans groupe, non lié, à la racine de « Vos personnages » avec le badge PNJ", async () => {
        const npc = await player.api.getCharacter(id);
        expect(npc.groups).toEqual([]);
        expect(npc.linkedPlayerId ?? null).toBeNull();
        await expect.poll(() => npcIdsWithoutGroup(player.api)).toContain(id);
        await ensureSidebarOpen(player.page);
        await expect(nav.getByRole("link", { name: new RegExp(`^${escapeRegExp(name)} \\(PNJ\\)`) })).toBeVisible();
      });

      await test.step("une fiche PNJ n'a pas d'onglet Compagnons ni de « Lié à »", async () => {
        await closeDialogIfOpen(player.page); // tiroir de la sidebar sur mobile
        await expect(player.page.getByRole("tab", { name: "Général" })).toBeVisible();
        await expect(player.page.getByRole("tab", { name: "Compagnons" })).toHaveCount(0);
        await expect(player.page.getByRole("button", { name: /^Lié à / })).toHaveCount(0);
      });
    } finally {
      await deleteNpcsWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le prénom du PNJ est requis à la création", async ({ player }) => {
    const name = uniqueLabel("PNJ incomplet");
    try {
      await player.page.goto(`/${env.locale}/characters/new/npcs`);
      const firstname = player.page.getByLabel("Prénom");
      await expect(firstname).toBeVisible();

      await player.page.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(firstname).toHaveAttribute("aria-invalid", "true");
      await expect(player.page).toHaveURL(/\/characters\/new\/npcs/);
      expect((await player.api.listNpcsWithoutGroup()).map((c) => c.firstname)).not.toContain(name);
    } finally {
      await deleteNpcsWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le joueur renomme un PNJ via « Modifier »", async ({ player }) => {
    const name = uniqueLabel("PNJ avant");
    const renamed = uniqueLabel("PNJ après");
    const npc = await player.api.createNpc(name);
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("Modifier ouvre la fiche en édition, préremplie", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Modifier" }).click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${npc._id}`));
        await expect(player.page.getByLabel("Prénom")).toHaveValue(name);
      });

      await test.step("Sauvegarder enregistre le nouveau prénom", async () => {
        await player.page.getByLabel("Prénom").fill(renamed);
        await player.page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
        await expect(player.page.getByText("Personnage mis à jour avec succès")).toBeVisible();
        await expect.poll(async () => (await player.api.getCharacter(npc._id)).firstname).toBe(renamed);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, renamed)).toBeVisible();
        await expect(characterLink(nav, name)).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(player.api, [npc._id]);
    }
  });

  test("le joueur supprime un PNJ après confirmation", async ({ player }) => {
    const name = uniqueLabel("PNJ supprimable");
    const npc = await player.api.createNpc(name);
    try {
      const nav = await openPlayerSpace(player.page);
      const confirm = player.page.getByRole("dialog", { name: "Supprimer le personnage" });

      await test.step("Échap annule : le PNJ est conservé", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        await expect(confirm.getByText("Cette action est irréversible.", { exact: false })).toBeVisible();
        await player.page.keyboard.press("Escape");
        await expect(confirm).toBeHidden();
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toBeVisible();
      });

      await test.step("Supprimer confirme : le PNJ disparaît de la sidebar et de l'API", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        // Un PNJ seul : simple confirmation, jamais le choix des compagnons (FR-player-companion-choice).
        await expect(player.page.getByRole("dialog", { name: "Supprimer ce personnage" })).toHaveCount(0);
        await confirm.getByRole("button", { name: "Supprimer" }).click();
        await expect(confirm).toBeHidden();
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toHaveCount(0);
        await expect.poll(() => npcIdsWithoutGroup(player.api)).not.toContain(npc._id);
      });
    } finally {
      await deleteCharacters(player.api, [npc._id]);
    }
  });
});

test.describe("PNJ — groupe de campagne (MJ)", () => {
  test("le MJ crée un PNJ dans un groupe", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("PNJ du groupe");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const nav = await openCampaignSidebar(gm.page, campaign);

    await test.step("« Créer un personnage » du groupe → PNJ ouvre le formulaire PNJ du groupe", async () => {
      await chooseManualNpc(
        gm.page,
        nav.getByRole("button", { name: "Créer un personnage" }),
        new RegExp(`/groups/${group._id}/characters/new/npcs`),
      );
    });

    const id = await test.step("remplir et valider le formulaire", () => submitNewNpcForm(gm.page, name));

    await test.step("le PNJ appartient au groupe, ligne ordinaire dans la sidebar MJ", async () => {
      await expect(gm.page).toHaveURL(new RegExp(`/groups/${group._id}/characters/${id}`));
      expect((await gm.api.getCharacter(id)).groups).toEqual([group._id]);
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).map((c) => c._id)).toContain(id);
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, groupLabel);
      await expect(characterLink(await groupContent(nav, groupLabel), name)).toBeVisible();
    });
  });

  test("le MJ supprime un PNJ du groupe en confirmant avec Entrée", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("PNJ supprimé");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const npc = await gm.api.createNpc(name, { groups: [group._id] });
    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandGroup(nav, groupLabel);

    await test.step("Supprimer puis Entrée", async () => {
      const menu = await openCharacterActions(gm.page, await groupContent(nav, groupLabel), name);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      const confirm = gm.page.getByRole("dialog", { name: "Supprimer le personnage" });
      await expect(confirm).toBeVisible();
      await gm.page.keyboard.press("Enter");
      await expect(confirm).toBeHidden();
    });

    await test.step("le PNJ a quitté le groupe, dans la sidebar et côté API", async () => {
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).map((c) => c._id)).not.toContain(npc._id);
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, groupLabel);
      await expect(characterLink(await groupContent(nav, groupLabel), name)).toHaveCount(0);
    });
  });
});
