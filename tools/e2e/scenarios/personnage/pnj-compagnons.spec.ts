import type { Locator } from "@playwright/test";
import type { ChariotApi, CreatedCampaign } from "@/api";
import { uniqueLabel } from "@/env";
import {
  characterLink,
  deleteCampaignWithGroups,
  deleteCharacters,
  deletePlayersWithoutGroupByPrefix,
  ensureSidebarOpen,
  escapeRegExp,
  expandGroup,
  groupContent,
  openCampaignSidebar,
  openCharacterActions,
  openCharacterFromSidebar,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * PNJ compagnons des PJ (liaison PNJ → PJ), dans l'espace joueur, et absence de toute liaison en espace MJ.
 * Couvre FR-npc-player-link (imbrication sous le PJ, onglet Compagnons, « Lié à {PJ} » en pied de fiche PNJ,
 * aucune liaison visible en espace MJ), FR-sidebar-npc-link (« Lier à un personnage », « Retirer de {PJ} »
 * avec confirmation, « Lier à un autre personnage » avec confirmation, toasts) et FR-player-companion-choice
 * (suppression et duplication d'un PJ qui a des compagnons).
 *
 * Chaque test prépare ses personnages par l'API et les supprime à la fin, même en échec.
 */

/** Liste imbriquée des compagnons d'un PJ dans « Vos personnages ». */
function companionsOf(nav: Locator, playerName: string): Locator {
  return nav.getByRole("list", { name: `Compagnons de ${playerName}` });
}

async function linkedPlayerId(api: ChariotApi, npcId: string): Promise<string | null> {
  return (await api.getCharacter(npcId)).linkedPlayerId ?? null;
}

/** Campagne propre au test, supprimée à la fin avec ses groupes (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne compagnons"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Compagnons — liaison depuis la sidebar", () => {
  test("le joueur lie un PNJ à un PJ : il s'imbrique sous le PJ", async ({ player }) => {
    const pcName = uniqueLabel("Rôdeur");
    const npcName = uniqueLabel("Loup");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(npcName);
    try {
      const nav = await openPlayerSpace(player.page);
      await expect(companionsOf(nav, pcName), "pas encore de compagnon").toHaveCount(0);

      await test.step("un PJ ne propose aucune action de liaison", async () => {
        const menu = await openCharacterActions(player.page, nav, pcName);
        await expect(menu.getByRole("menuitem", { name: "Lier à un personnage" })).toHaveCount(0);
        await player.page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      });

      await test.step("« Lier à un personnage » propose les PJ visibles ; choisir le PJ lie immédiatement", async () => {
        const menu = await openCharacterActions(player.page, nav, npcName);
        await menu.getByRole("menuitem", { name: "Lier à un personnage" }).click();
        const dialog = player.page.getByRole("dialog", { name: "Lier le PNJ" });
        await expect(dialog.getByText(`Choisissez un personnage joueur de Mes personnages pour ${npcName}.`)).toBeVisible();
        await dialog.getByRole("button", { name: `Lier ${npcName} à ${pcName}` }).click();
        await expect(player.page.getByText("PNJ lié avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
      });

      await test.step("le PNJ est imbriqué sous le PJ, plus à la racine ; liaison persistée", async () => {
        await expect.poll(() => linkedPlayerId(player.api, npc._id)).toBe(pc._id);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(companionsOf(nav, pcName), npcName)).toBeVisible();
        await expect(characterLink(nav, npcName), "jamais à la racine et imbriqué à la fois").toHaveCount(1);
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("onglet Compagnons du PJ et « Lié à » en pied de fiche du PNJ", async ({ player }) => {
    const pcName = uniqueLabel("Druide");
    const npcName = uniqueLabel("Ours");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(npcName, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);
      await openCharacterFromSidebar(player.page, nav, pcName);
      await expect(player.page).toHaveURL(new RegExp(`/characters/${pc._id}`));

      await test.step("l'onglet Compagnons du PJ liste le PNJ ; sa carte ouvre la fiche du PNJ", async () => {
        await player.page.getByRole("tab", { name: "Compagnons" }).click();
        const panel = player.page.getByRole("tabpanel");
        await expect(panel.getByRole("heading", { name: npcName })).toBeVisible();
        await panel.getByRole("link", { name: new RegExp(escapeRegExp(npcName)) }).first().click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${npc._id}`));
      });

      await test.step("la fiche du PNJ n'a pas d'onglet Compagnons ; « Lié à {PJ} » ramène au PJ", async () => {
        await expect(player.page.getByRole("tab", { name: "Général" })).toBeVisible();
        await expect(player.page.getByRole("tab", { name: "Compagnons" })).toHaveCount(0);
        await player.page.getByRole("link", { name: `Lié à ${pcName}` }).click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${pc._id}`));
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("le joueur retire un compagnon après confirmation", async ({ player }) => {
    const pcName = uniqueLabel("Mage");
    const npcName = uniqueLabel("Chouette");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(npcName, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);
      const confirm = player.page.getByRole("dialog", { name: "Retirer le PNJ" });

      await test.step("« Retirer de {PJ} » ouvre la confirmation ; Échap ne change rien", async () => {
        const menu = await openCharacterActions(player.page, companionsOf(nav, pcName), npcName);
        await menu.getByRole("menuitem", { name: /^Retirer de / }).click();
        await expect(
          confirm.getByText(`Voulez-vous retirer ${npcName} des compagnons de ${pcName} ? Le PNJ restera dans vos personnages.`),
        ).toBeVisible();
        await player.page.keyboard.press("Escape");
        await expect(confirm).toBeHidden();
        expect(await linkedPlayerId(player.api, npc._id)).toBe(pc._id);
      });

      await test.step("« Retirer » délie : toast nommant le PNJ, le PNJ revient à la racine", async () => {
        await ensureSidebarOpen(player.page);
        const menu = await openCharacterActions(player.page, companionsOf(nav, pcName), npcName);
        await menu.getByRole("menuitem", { name: /^Retirer de / }).click();
        await confirm.getByRole("button", { name: "Retirer" }).click();
        await expect(player.page.getByText(/retiré avec succès\./)).toBeVisible();
        await expect(confirm).toBeHidden();
        await expect.poll(() => linkedPlayerId(player.api, npc._id)).toBeNull();
        await ensureSidebarOpen(player.page);
        await expect(companionsOf(nav, pcName)).toHaveCount(0);
        await expect(characterLink(nav, npcName)).toBeVisible();
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("le joueur lie un compagnon à un autre PJ après confirmation", async ({ player }) => {
    const fromName = uniqueLabel("Ancien maître");
    const toName = uniqueLabel("Nouveau maître");
    const npcName = uniqueLabel("Faucon");
    const from = await player.api.createPlayer(fromName);
    const to = await player.api.createPlayer(toName);
    const npc = await player.api.createNpc(npcName, { linkedPlayerId: from._id });
    try {
      const nav = await openPlayerSpace(player.page);
      const picker = player.page.getByRole("dialog", { name: "Lier le PNJ" });

      await test.step("« Lier à un autre personnage » exclut le PJ actuel", async () => {
        const menu = await openCharacterActions(player.page, companionsOf(nav, fromName), npcName);
        await menu.getByRole("menuitem", { name: "Lier à un autre personnage" }).click();
        await expect(picker.getByRole("button", { name: `Lier ${npcName} à ${toName}` })).toBeVisible();
        await expect(picker.getByRole("button", { name: `Lier ${npcName} à ${fromName}` })).toHaveCount(0);
      });

      await test.step("choisir l'autre PJ demande confirmation, puis réaffecte", async () => {
        await picker.getByRole("button", { name: `Lier ${npcName} à ${toName}` }).click();
        const confirm = player.page.getByRole("dialog", { name: "Changer de personnage lié" });
        await expect(confirm.getByText(`Ce PNJ est déjà lié. Voulez-vous le lier à ${toName} à la place ?`)).toBeVisible();
        expect(await linkedPlayerId(player.api, npc._id), "rien avant confirmation").toBe(from._id);
        await confirm.getByRole("button", { name: "Lier", exact: true }).click();
        await expect(player.page.getByText("PNJ lié avec succès.")).toBeVisible();
        await expect.poll(() => linkedPlayerId(player.api, npc._id)).toBe(to._id);
      });

      await test.step("le PNJ n'est imbriqué que sous le nouveau PJ", async () => {
        await ensureSidebarOpen(player.page);
        await expect(characterLink(companionsOf(nav, toName), npcName)).toBeVisible();
        await expect(companionsOf(nav, fromName)).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, from._id, to._id]);
    }
  });
});

test.describe("Compagnons — suppression et duplication du PJ", () => {
  test("supprimer un PJ : garder ses compagnons, ou les supprimer avec lui", async ({ player }) => {
    const keepName = uniqueLabel("PJ gardien");
    const keptNpcName = uniqueLabel("Chien gardé");
    const purgeName = uniqueLabel("PJ purgé");
    const keeper = await player.api.createPlayer(keepName);
    const kept = await player.api.createNpc(keptNpcName, { linkedPlayerId: keeper._id });
    const purged = await player.api.createPlayer(purgeName);
    const purgedNpcs = [
      await player.api.createNpc(uniqueLabel("Chat purgé"), { linkedPlayerId: purged._id }),
      await player.api.createNpc(uniqueLabel("Rat purgé"), { linkedPlayerId: purged._id }),
    ];
    try {
      const nav = await openPlayerSpace(player.page);
      const choice = player.page.getByRole("dialog", { name: "Supprimer ce personnage" });

      await test.step("« Supprimer le personnage » conserve le compagnon, délié, à la racine", async () => {
        const menu = await openCharacterActions(player.page, nav, keepName);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        await expect(choice.getByText(keptNpcName)).toBeVisible();
        await choice.getByRole("button", { name: "Supprimer le personnage et conserver les compagnons liés" }).click();
        await expect(player.page.getByText(/supprimé avec succès\./)).toBeVisible();
        await expect(choice).toBeHidden();
        await expect.poll(() => linkedPlayerId(player.api, kept._id)).toBeNull();
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, keepName)).toHaveCount(0);
        await expect(characterLink(nav, keptNpcName)).toBeVisible();
      });

      await test.step("« Supprimer tout (2) » supprime le PJ et ses deux compagnons", async () => {
        const menu = await openCharacterActions(player.page, nav, purgeName);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        const deleteAll = choice.getByRole("button", { name: "Supprimer le personnage et 2 compagnons liés" });
        await expect(deleteAll, "libellé visible").toHaveText("Supprimer tout (2)");
        await deleteAll.click();
        await expect(choice).toBeHidden();
        await expect
          .poll(async () => (await player.api.listPlayersWithoutGroup()).map((p) => p._id))
          .not.toContain(purged._id);
        await expect.poll(async () => (await player.api.npcsLinkedTo([purged._id])).length).toBe(0);
        await ensureSidebarOpen(player.page);
        for (const npc of purgedNpcs) await expect(characterLink(nav, npc.firstname)).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(player.api, [kept._id, keeper._id, ...purgedNpcs.map((n) => n._id), purged._id]);
    }
  });

  test("dupliquer un PJ avec compagnon : choix explicite, copie des compagnons liée à la copie", async ({ player }) => {
    const pcName = uniqueLabel("Chevalier");
    const npcName = uniqueLabel("Destrier");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(npcName, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);
      const dialog = player.page.getByRole("dialog", { name: "Dupliquer le personnage" });
      const playerOnly = dialog.getByRole("radio", { name: "Dupliquer le personnage seulement, sans modifier les compagnons" });
      const copy = dialog.getByRole("radio", { name: "Dupliquer le personnage et copier ses compagnons vers le nouveau personnage" });
      const move = dialog.getByRole("radio", { name: "Dupliquer le personnage et déplacer les compagnons vers le nouveau personnage" });

      await test.step("le dialogue liste le compagnon et propose 3 choix, « seulement le PJ » par défaut", async () => {
        const menu = await openCharacterActions(player.page, nav, pcName);
        await menu.getByRole("menuitem", { name: "Dupliquer" }).click();
        await expect(dialog.getByText(npcName)).toBeVisible();
        await expect(playerOnly).toBeChecked();
        await expect(copy).not.toBeChecked();
        await expect(move).toBeEnabled();
      });

      await test.step("à partir de 2 copies, « déplacer les compagnons » est indisponible", async () => {
        await dialog.getByLabel("Nombre de copies").fill("2");
        await expect(move).toBeDisabled();
        await expect(dialog.getByText("Indisponible lorsque plusieurs copies du personnage sont créées.")).toBeVisible();
        await dialog.getByLabel("Nombre de copies").fill("1");
        await expect(move).toBeEnabled();
      });

      await test.step("copier les compagnons : la copie du PJ a sa propre copie du compagnon", async () => {
        await copy.check();
        await dialog.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(player.page.getByText("Personnage dupliqué avec succès.")).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect
          .poll(async () => (await player.api.listPlayersWithoutGroup()).map((p) => p.firstname))
          .toContain(`${pcName} 2`);
        const pcCopy = (await player.api.listPlayersWithoutGroup()).find((p) => p.firstname === `${pcName} 2`)!;
        await expect.poll(async () => (await player.api.npcsLinkedTo([pcCopy._id])).length).toBe(1);
        expect((await player.api.npcsLinkedTo([pc._id])).map((c) => c._id), "l'original garde son compagnon").toEqual([
          npc._id,
        ]);
        await ensureSidebarOpen(player.page);
        await expect(companionsOf(nav, `${pcName} 2`)).toBeVisible();
      });
    } finally {
      const players = await player.api.listPlayersWithoutGroup().catch(() => []);
      const ids = players.filter((p) => p.firstname.startsWith(pcName)).map((p) => p._id);
      const companions = await player.api.npcsLinkedTo(ids).catch(() => []);
      await deleteCharacters(player.api, companions.map((c) => c._id));
      await deletePlayersWithoutGroupByPrefix(player.api, pcName);
    }
  });
});

test.describe("Compagnons — espace MJ", () => {
  test("en espace MJ, un PNJ lié reste une ligne de groupe ordinaire, sans aucune liaison", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const pcName = uniqueLabel("PJ du MJ");
    const npcName = uniqueLabel("Compagnon du MJ");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const pc = await gm.api.createPlayer(pcName, { groups: [group._id] });
    const npc = await gm.api.createNpc(npcName, { groups: [group._id], linkedPlayerId: pc._id });
    try {
      const nav = await openCampaignSidebar(gm.page, campaign);
      await expandGroup(nav, groupLabel);
      const members = await groupContent(nav, groupLabel);

      await test.step("PJ et PNJ sont deux lignes du groupe, sans imbrication", async () => {
        await expect(characterLink(members, pcName)).toBeVisible();
        await expect(characterLink(members, npcName)).toBeVisible();
        await expect(nav.getByRole("list", { name: `Compagnons de ${pcName}` })).toHaveCount(0);
      });

      await test.step("le menu du PNJ ne propose aucune action de liaison", async () => {
        const menu = await openCharacterActions(gm.page, members, npcName);
        await expect(menu.getByRole("menuitem", { name: "Modifier" })).toBeVisible();
        for (const action of ["Lier à un personnage", "Lier à un autre personnage"]) {
          await expect(menu.getByRole("menuitem", { name: action })).toHaveCount(0);
        }
        await expect(menu.getByRole("menuitem", { name: /^Retirer de / })).toHaveCount(0);
        await gm.page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      });

      await test.step("ni onglet Compagnons sur la fiche du PJ, ni « Lié à » sur celle du PNJ", async () => {
        await openCharacterFromSidebar(gm.page, members, pcName);
        await expect(gm.page.getByRole("tab", { name: "Général" })).toBeVisible();
        await expect(gm.page.getByRole("tab", { name: "Compagnons" })).toHaveCount(0);
        await ensureSidebarOpen(gm.page);
        await expandGroup(nav, groupLabel);
        await openCharacterFromSidebar(gm.page, await groupContent(nav, groupLabel), npcName);
        await expect(gm.page).toHaveURL(new RegExp(`/characters/${npc._id}`));
        await expect(gm.page.getByRole("tab", { name: "Général" })).toBeVisible();
        await expect(gm.page.getByRole("link", { name: /^Lié à / })).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(gm.api, [npc._id, pc._id]);
    }
  });
});
