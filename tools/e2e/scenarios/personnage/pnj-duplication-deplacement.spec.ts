import type { ChariotApi, CreatedCampaign } from "@/api";
import { uniqueLabel } from "@/env";
import {
  characterLink,
  deleteCampaignWithGroups,
  deleteCharacters,
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
 * Duplication et déplacement des PNJ depuis la sidebar.
 * Couvre FR-character-duplicate (nom proposé « <nom> 2 », copie sans groupe en espace joueur, « Créer » et
 * « Créer dans un autre groupe » en espace MJ), FR-npc-player-link (la copie d'un PNJ lié reste liée au même PJ)
 * et FR-sidebar-context-actions (« Déplacer » : groupe courant exclu, groupe archivé signalé, persistance `groups`).
 *
 * Le focus du champ et Entrée à l'ouverture du dialogue sont couverts par duplication-deplacement.spec.ts
 * (même dialogue pour PJ et PNJ).
 */

async function memberNames(api: ChariotApi, groupId: string): Promise<string[]> {
  return (await api.groupCharacters(groupId)).map((c) => c.firstname).sort();
}

/** Campagne propre au test, supprimée à la fin avec ses groupes et leurs personnages (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PNJ"));
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

test.describe("Duplication de PNJ — espace joueur", () => {
  test("le joueur duplique un PNJ sans groupe", async ({ player }) => {
    const name = uniqueLabel("PNJ original");
    const npc = await player.api.createNpc(name);
    const created: string[] = [npc._id];
    try {
      const nav = await openPlayerSpace(player.page);
      const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });

      await test.step("Dupliquer propose « <nom> 2 », sans « Créer dans un autre groupe » ni choix de compagnons", async () => {
        const menu = await openCharacterActions(player.page, nav, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await expect(dialog.getByLabel("Nom du personnage")).toHaveValue(`${name} 2`);
        await expect(dialog.getByRole("button", { name: "Créer dans un autre groupe" })).toHaveCount(0);
        await expect(dialog.getByText("Que faire des compagnons ?")).toHaveCount(0);
      });

      await test.step("Créer : la copie est un PNJ sans groupe, l'original est inchangé", async () => {
        await dialog.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect(player.page).toHaveURL(/\/characters\/[a-f0-9]{24}/);
        const copyId = new URL(player.page.url()).pathname.split("/characters/")[1].split("/")[0];
        created.push(copyId);
        expect(copyId).not.toBe(npc._id);
        const copy = await player.api.getCharacter(copyId);
        expect(copy.firstname).toBe(`${name} 2`);
        expect(copy.groups).toEqual([]);
        expect((await player.api.getCharacter(npc._id)).firstname).toBe(name);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, `${name} 2`)).toBeVisible();
      });
    } finally {
      await deleteCharacters(player.api, created);
    }
  });

  test("la copie d'un PNJ lié reste compagnon du même PJ", async ({ player }) => {
    const playerName = uniqueLabel("Maître");
    const name = uniqueLabel("Familier");
    const pc = await player.api.createPlayer(playerName);
    const npc = await player.api.createNpc(name, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);
      const companions = nav.getByRole("list", { name: `Compagnons de ${playerName}` });
      await expect(characterLink(companions, name), "PNJ lié imbriqué sous son PJ").toBeVisible();

      await test.step("dupliquer le compagnon", async () => {
        const menu = await openCharacterActions(player.page, companions, name);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });
        await expect(dialog.getByLabel("Nom du personnage")).toHaveValue(`${name} 2`);
        await dialog.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
      });

      await test.step("la copie est liée au même PJ et imbriquée sous lui, pas à la racine", async () => {
        await expect
          .poll(async () => (await player.api.npcsLinkedTo([pc._id])).map((c) => c.firstname).sort())
          .toEqual([name, `${name} 2`].sort());
        await ensureSidebarOpen(player.page);
        await expect(characterLink(companions, `${name} 2`)).toBeVisible();
        await expect(characterLink(nav, `${name} 2`), "jamais aussi à la racine").toHaveCount(1);
      });
    } finally {
      const linked = await player.api.npcsLinkedTo([pc._id]).catch(() => []);
      await deleteCharacters(player.api, [...linked.map((c) => c._id), npc._id, pc._id]);
    }
  });
});

test.describe("Duplication et déplacement de PNJ — groupes de campagne (MJ)", () => {
  test("le MJ déplace un PNJ vers un autre groupe, archivé compris dans la liste", async ({ gm, campaign }) => {
    const fromLabel = uniqueLabel("Départ");
    const toLabel = uniqueLabel("Arrivée");
    const archivedLabel = uniqueLabel("Archivé");
    const name = uniqueLabel("PNJ voyageur");
    const from = await seedActiveGroup(gm.api, campaign._id, fromLabel);
    await seedActiveGroup(gm.api, campaign._id, toLabel);
    const archived = await seedActiveGroup(gm.api, campaign._id, archivedLabel);
    await gm.api.archiveGroups(campaign._id, [archived._id]);
    const npc = await gm.api.createNpc(name, { groups: [from._id] });

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

    await test.step("déplacer vers le groupe archivé", async () => {
      await dialog.getByRole("listbox").getByRole("option", { name: archivedLabel }).click();
      await dialog.getByRole("button", { name: "Déplacer", exact: true }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("le PNJ a changé de groupe, côté API et dans la sidebar", async () => {
      await expect.poll(async () => (await gm.api.getCharacter(npc._id)).groups).toEqual([archived._id]);
      await expect.poll(() => memberNames(gm.api, from._id)).toEqual([]);
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, fromLabel);
      await expect(characterLink(await groupContent(nav, fromLabel), name)).toHaveCount(0);
    });
  });

  test("le MJ duplique un PNJ dans son groupe puis une copie vers un autre groupe", async ({ gm, campaign }) => {
    const homeLabel = uniqueLabel("Maison");
    const otherLabel = uniqueLabel("Ailleurs");
    const name = uniqueLabel("PNJ jumeau");
    const home = await seedActiveGroup(gm.api, campaign._id, homeLabel);
    const other = await seedActiveGroup(gm.api, campaign._id, otherLabel);
    const npc = await gm.api.createNpc(name, { groups: [home._id] });

    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandGroup(nav, homeLabel);
    const duplicate = gm.page.getByRole("dialog", { name: "Dupliquer le personnage" });

    await test.step("Créer : la copie « <nom> 2 » rejoint le même groupe", async () => {
      const menu = await openCharacterActions(gm.page, await groupContent(nav, homeLabel), name);
      await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
      await expect(duplicate.getByLabel("Nom du personnage")).toHaveValue(`${name} 2`);
      await duplicate.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(gm.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
      await expect(duplicate).toBeHidden();
      // La fiche de la copie s'ouvre (et, sur mobile, le tiroir se referme) avant la suite.
      // La page de la campagne affiche déjà la fiche de l'original : on attend que l'URL la quitte.
      await expect(gm.page).not.toHaveURL(new RegExp(`/characters/${npc._id}`));
      await expect(gm.page).toHaveURL(new RegExp(`/groups/${home._id}/characters/[a-f0-9]{24}`));
      await expect.poll(() => memberNames(gm.api, home._id)).toEqual([name, `${name} 2`].sort());
    });

    const move = gm.page.getByRole("dialog", { name: "Déplacer le personnage" });
    await test.step("« Créer dans un autre groupe » crée « <nom> 3 » et le déplace", async () => {
      await ensureSidebarOpen(gm.page);
      await expandGroup(nav, homeLabel);
      const menu = await openCharacterActions(gm.page, await groupContent(nav, homeLabel), name);
      await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
      await expect(duplicate.getByLabel("Nom du personnage")).toHaveValue(`${name} 3`);
      await duplicate.getByRole("button", { name: "Créer dans un autre groupe" }).click();
      await expect(move.getByText(`Choisissez le groupe de destination pour ${name} 3.`)).toBeVisible();
      await move.getByRole("combobox").click();
      await move.getByRole("listbox").getByRole("option", { name: otherLabel }).click();
      await move.getByRole("button", { name: "Déplacer", exact: true }).click();
      await expect(move).toBeHidden();
    });

    await test.step("la copie est dans l'autre groupe, l'original reste chez lui", async () => {
      await expect.poll(() => memberNames(gm.api, other._id)).toEqual([`${name} 3`]);
      await expect.poll(() => memberNames(gm.api, home._id)).toEqual([name, `${name} 2`].sort());
      expect((await gm.api.getCharacter(npc._id)).groups).toEqual([home._id]);
    });
  });
});
