import type { ChariotApi, CreatedCampaign } from "@/api";
import { uniqueLabel } from "@/env";
import {
  characterLink,
  deleteCampaignWithGroups,
  deleteCharacters,
  deletePlayersWithoutGroupByPrefix,
  ensureSidebarOpen,
  expandGroup,
  groupContent,
  openCampaignSidebar,
  openCharacterActions,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * Duplication et déplacement des personnages joueurs (PJ) depuis la sidebar.
 * Couvre FR-character-duplicate (nom proposé « <nom> 2 », nombre de copies, nom vide refusé, Échap, « Créer »
 * et « Créer dans un autre groupe » réservé à l'espace MJ) et FR-sidebar-context-actions (« Déplacer » : groupe courant
 * exclu, groupes archivés signalés, persistance par l'API `groups`).
 *
 * Chaque test prépare ses données par l'API et les supprime à la fin, même en échec.
 */

/** Identifiants des personnages d'un groupe, côté API. */
async function memberIds(api: ChariotApi, groupId: string): Promise<string[]> {
  return (await api.groupCharacters(groupId)).map((c) => c._id);
}

/** Prénoms des PJ sans groupe, côté API. */
async function playersWithoutGroupNames(api: ChariotApi): Promise<string[]> {
  return (await api.listPlayersWithoutGroup()).map((p) => p.firstname);
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes et leurs PJ à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PJ"));
    await use(campaign);
    const groups = [
      ...(await gm.api.listGroups(campaign._id, "active").catch(() => [])),
      ...(await gm.api.listGroups(campaign._id, "archived").catch(() => [])),
    ];
    for (const group of groups) {
      const members = await gm.api.groupCharacters(group._id).catch(() => []);
      await deleteCharacters(gm.api, members.map((c) => c._id));
    }
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Duplication de PJ — espace joueur", () => {
  test("le joueur duplique un PJ sans groupe", async ({ player }) => {
    const name = uniqueLabel("Original");
    const character = await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);
      const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });

      await test.step("Dupliquer propose « <nom> 2 », sans « Créer dans un autre groupe »", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await expect(dialog.getByLabel("Nom du personnage")).toHaveValue(`${name} 2`);
        await expect(dialog.getByLabel("Nombre de copies")).toHaveValue("1");
        await expect(dialog.getByRole("button", { name: "Créer dans un autre groupe" })).toHaveCount(0);
      });

      await test.step("Créer : toast, fiche de la copie affichée", async () => {
        await dialog.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect(player.page).toHaveURL(/\/characters\/[a-f0-9]{24}/);
        expect(player.page.url()).not.toContain(character._id);
      });

      await test.step("la copie est sans groupe, l'original est inchangé", async () => {
        const copyId = new URL(player.page.url()).pathname.split("/characters/")[1].split("/")[0];
        const copy = await player.api.getCharacter(copyId);
        expect(copy.firstname).toBe(`${name} 2`);
        expect(copy.groups).toEqual([]);
        expect((await player.api.getCharacter(character._id)).firstname).toBe(name);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toBeVisible();
        await expect(characterLink(nav, `${name} 2`)).toBeVisible();
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le nom de la copie a le focus à l'ouverture et Entrée crée la copie", async ({ player }) => {
    const name = uniqueLabel("Clavier");
    await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);
      const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });
      const menu = await openCharacterActions(player.page, nav, name);
      await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
      const field = dialog.getByLabel("Nom du personnage");
      await expect(field).toHaveValue(`${name} 2`);

      await test.step("le champ du nom est focalisé à l'ouverture (FR-character-duplicate, accessibilité)", async () => {
        await expect(field).toBeFocused();
      });

      await test.step("Entrée déclenche « Créer »", async () => {
        await player.page.keyboard.press("Enter");
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect.poll(() => playersWithoutGroupNames(player.api)).toContain(`${name} 2`);
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, name);
    }
  });

  test("le joueur crée plusieurs copies numérotées ; un nom vide ou Échap ne crée rien", async ({ player }) => {
    const name = uniqueLabel("Série");
    await player.api.createPlayer(name);
    try {
      const nav = await openPlayerSpace(player.page);
      const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });
      const field = dialog.getByLabel("Nom du personnage");
      const create = dialog.getByRole("button", { name: "Créer", exact: true });

      await test.step("nom vide : « Créer » désactivé ; Échap ferme sans créer", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await field.fill("");
        await expect(create).toBeDisabled();
        await player.page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        expect((await playersWithoutGroupNames(player.api)).filter((n) => n.startsWith(name))).toEqual([name]);
      });

      await test.step("2 copies à partir de « <nom> 2 » : « <nom> 2 » et « <nom> 3 »", async () => {
        await ensureSidebarOpen(player.page);
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await expect(field).toHaveValue(`${name} 2`);
        await dialog.getByLabel("Nombre de copies").fill("2");
        await create.click();
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect
          .poll(async () => (await playersWithoutGroupNames(player.api)).filter((n) => n.startsWith(name)).sort())
          .toEqual([name, `${name} 2`, `${name} 3`]);
      });

      await test.step("une nouvelle duplication de l'original propose le suffixe libre suivant", async () => {
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, `${name} 3`)).toBeVisible();
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await expect(field).toHaveValue(`${name} 4`);
        await player.page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
      });
    } finally {
      await deletePlayersWithoutGroupByPrefix(player.api, name);
    }
  });
});

test.describe("Duplication et déplacement de PJ — groupes de campagne (MJ)", () => {
  test("le MJ déplace un PJ vers un autre groupe, archivé compris dans la liste", async ({ gm, campaign }) => {
    const fromLabel = uniqueLabel("Départ");
    const toLabel = uniqueLabel("Arrivée");
    const archivedLabel = uniqueLabel("Archivé");
    const name = uniqueLabel("Voyageur");
    const from = await seedActiveGroup(gm.api, campaign._id, fromLabel);
    const to = await seedActiveGroup(gm.api, campaign._id, toLabel);
    const archived = await seedActiveGroup(gm.api, campaign._id, archivedLabel);
    await gm.api.archiveGroups(campaign._id, [archived._id]);
    const character = await gm.api.createPlayer(name, { groups: [from._id] });

    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandGroup(nav, fromLabel);
    const dialog = gm.page.getByRole("dialog", { name: "Déplacer le personnage" });

    await test.step("Déplacer liste les autres groupes, sans le groupe courant, l'archivé signalé", async () => {
      const menu = await openCharacterActions(gm.page, await groupContent(nav, fromLabel), name);
      await menu.getByRole("menuitem", { name: "Déplacer" }).click();
      await expect(dialog.getByText(`Choisissez le groupe de destination pour ${name}.`)).toBeVisible();
      await dialog.getByRole("combobox").click();
      const options = dialog.getByRole("listbox");
      await expect(options.getByRole("option", { name: toLabel })).toBeVisible();
      await expect(options.getByRole("option", { name: archivedLabel }), "badge « Archivé »").toContainText("Archivé");
      await expect(options.getByRole("option", { name: fromLabel })).toHaveCount(0);
    });

    await test.step("choisir le groupe d'arrivée et confirmer", async () => {
      await dialog.getByRole("listbox").getByRole("option", { name: toLabel }).click();
      await dialog.getByRole("button", { name: "Déplacer", exact: true }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("le PJ a changé de groupe, côté API et dans la sidebar", async () => {
      await expect.poll(async () => (await gm.api.getCharacter(character._id)).groups).toEqual([to._id]);
      await expect.poll(() => memberIds(gm.api, from._id)).not.toContain(character._id);
      await expect.poll(() => memberIds(gm.api, to._id)).toContain(character._id);
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, toLabel);
      await expect(characterLink(await groupContent(nav, toLabel), name)).toBeVisible();
      await expect(characterLink(await groupContent(nav, fromLabel), name)).toHaveCount(0);
    });
  });

  test("le MJ duplique un PJ dans son groupe puis une copie vers un autre groupe", async ({ gm, campaign }) => {
    const homeLabel = uniqueLabel("Maison");
    const otherLabel = uniqueLabel("Ailleurs");
    const name = uniqueLabel("Jumeau");
    const home = await seedActiveGroup(gm.api, campaign._id, homeLabel);
    const other = await seedActiveGroup(gm.api, campaign._id, otherLabel);
    const character = await gm.api.createPlayer(name, { groups: [home._id] });

    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandGroup(nav, homeLabel);
    const duplicate = gm.page.getByRole("dialog", { name: "Dupliquer le personnage" });

    await test.step("Créer : la copie « <nom> 2 » rejoint le même groupe et sa fiche s'ouvre", async () => {
      const menu = await openCharacterActions(gm.page, await groupContent(nav, homeLabel), name);
      await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
      await expect(duplicate.getByLabel("Nom du personnage")).toHaveValue(`${name} 2`);
      await duplicate.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(gm.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
      await expect(duplicate).toBeHidden();
      await expect(gm.page).toHaveURL(new RegExp(`/groups/${home._id}/characters/[a-f0-9]{24}`));
      await expect
        .poll(async () => (await gm.api.groupCharacters(home._id)).map((c) => c.firstname).sort())
        .toEqual([name, `${name} 2`].sort());
    });

    const move = gm.page.getByRole("dialog", { name: "Déplacer le personnage" });
    await test.step("« Créer dans un autre groupe » crée « <nom> 3 » puis ouvre Déplacer sur la copie", async () => {
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, homeLabel);
      const menu = await openCharacterActions(gm.page, await groupContent(nav, homeLabel), name);
      await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
      await expect(duplicate.getByLabel("Nom du personnage")).toHaveValue(`${name} 3`);
      await duplicate.getByRole("button", { name: "Créer dans un autre groupe" }).click();
      await expect(gm.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
      await expect(move.getByText(`Choisissez le groupe de destination pour ${name} 3.`)).toBeVisible();
    });

    await test.step("déplacer la copie : l'original reste dans son groupe", async () => {
      await move.getByRole("combobox").click();
      await move.getByRole("listbox").getByRole("option", { name: otherLabel }).click();
      await move.getByRole("button", { name: "Déplacer", exact: true }).click();
      await expect(move).toBeHidden();
      await expect
        .poll(async () => (await gm.api.groupCharacters(other._id)).map((c) => c.firstname))
        .toEqual([`${name} 3`]);
      await expect
        .poll(async () => (await gm.api.groupCharacters(home._id)).map((c) => c.firstname).sort())
        .toEqual([name, `${name} 2`].sort());
      expect((await gm.api.getCharacter(character._id)).groups).toEqual([home._id]);
    });
  });
});
