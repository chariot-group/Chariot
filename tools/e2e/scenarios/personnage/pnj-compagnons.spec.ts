import type { Locator, Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, CreatedCharacter } from "@/api";
import { env, uniqueLabel } from "@/env";
import {
  characterLink,
  closeDialogIfOpen,
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
 * (suppression et duplication d'un PJ qui a des compagnons), ainsi que le CRUD des compagnons : création d'un PNJ
 * déjà lié, liaison / retrait et recherche depuis l'onglet Compagnons, modification et suppression d'un compagnon
 * depuis sa ligne imbriquée.
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

/**
 * Ouvre la fiche du PJ (`pc`) depuis « Vos personnages » puis son onglet Compagnons, et renvoie le panneau de l'onglet.
 * Le clic sur le lien est relancé si une navigation en cours l'a annulé.
 */
async function openCompanionsTab(page: Page, nav: Locator, pc: CreatedCharacter): Promise<Locator> {
  await expect(async () => {
    await ensureSidebarOpen(page);
    await openCharacterFromSidebar(page, nav, pc.firstname);
    await expect(page).toHaveURL(new RegExp(`/characters/${pc._id}`), { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("tab", { name: "Compagnons" }).click();
  const panel = page.getByRole("tabpanel");
  // Avec au moins un compagnon, la barre d'outils commence par la recherche ; sinon, l'état vide.
  await expect(
    panel.getByRole("searchbox", { name: "Rechercher un compagnon" }).or(panel.getByText("Aucun compagnon pour l'instant")),
  ).toBeVisible();
  return panel;
}

/** Carte d'un compagnon dans l'onglet : toute la surface ouvre sa fiche (« Ouvrir la fiche de {nom} »). */
function companionCard(panel: Locator, npcName: string): Locator {
  return panel.getByRole("link", { name: `Ouvrir la fiche de ${npcName}` });
}

test.describe("Compagnons — CRUD", () => {
  test("le joueur crée un compagnon déjà lié depuis l'onglet Compagnons", async ({ player }) => {
    const pcName = uniqueLabel("Invocateur");
    const npcName = uniqueLabel("Élémentaire");
    const pc = await player.api.createPlayer(pcName);
    try {
      const nav = await openPlayerSpace(player.page);
      const panel = await openCompanionsTab(player.page, nav, pc);
      await expect(panel.getByText("Aucun compagnon pour l'instant")).toBeVisible();

      await test.step("« Créer un PNJ lié » ne propose que PNJ et librairie, puis ouvre le formulaire PNJ lié", async () => {
        const dialog = player.page.getByRole("dialog", { name: "Créer un personnage" });
        await expect(async () => {
          if (!(await dialog.isVisible())) await panel.getByRole("button", { name: "Créer un PNJ lié" }).click();
          await expect(dialog.getByRole("button", { name: "Créer un PNJ manuellement" })).toBeVisible({ timeout: 5_000 });
          await expect(dialog.getByRole("button", { name: "Créer un personnage joueur manuellement" })).toHaveCount(0);
          await dialog.getByRole("button", { name: "Créer un PNJ manuellement" }).click();
          await expect(player.page).toHaveURL(new RegExp(`/${env.locale}/characters/new/npcs.*linkedPlayerId=${pc._id}`), {
            timeout: 5_000,
          });
        }).toPass({ timeout: 30_000 });
      });

      await test.step("valider le formulaire : le PNJ est créé lié au PJ, imbriqué sous lui", async () => {
        await player.page.getByLabel("Prénom").fill(npcName);
        await player.page.getByRole("button", { name: "Créer", exact: true }).click();
        await expect(player.page.getByText("Personnage créé avec succès")).toBeVisible();
        await expect
          .poll(async () => (await player.api.npcsLinkedTo([pc._id])).map((c) => c.firstname))
          .toEqual([npcName]);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(companionsOf(nav, pcName), npcName)).toBeVisible();
      });

      await test.step("l'onglet Compagnons du PJ liste le nouveau compagnon", async () => {
        await closeDialogIfOpen(player.page);
        const tab = await openCompanionsTab(player.page, nav, pc);
        await expect(companionCard(tab, npcName)).toBeVisible();
      });
    } finally {
      const linked = await player.api.npcsLinkedTo([pc._id]).catch(() => []);
      await deleteCharacters(player.api, [...linked.map((c) => c._id), pc._id]);
    }
  });

  test("le joueur lie puis retire un compagnon depuis l'onglet Compagnons", async ({ player }) => {
    const pcName = uniqueLabel("Barde");
    const npcName = uniqueLabel("Corbeau");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(npcName);
    try {
      const nav = await openPlayerSpace(player.page);
      const panel = await openCompanionsTab(player.page, nav, pc);

      await test.step("« Lier un PNJ » liste les PNJ libres ; en choisir un le lie immédiatement", async () => {
        await panel.getByRole("button", { name: "Lier un PNJ" }).click();
        const picker = player.page.getByRole("dialog", { name: "Lier un PNJ" });
        await expect(picker.getByText("Choisissez un PNJ de l'espace joueur (non lié, hors groupe).")).toBeVisible();
        await picker.getByRole("button", { name: npcName, exact: true }).click();
        await expect(picker).toBeHidden();
        await expect.poll(() => linkedPlayerId(player.api, npc._id)).toBe(pc._id);
        await expect(companionCard(panel, npcName)).toBeVisible();
      });

      const confirm = player.page.getByRole("dialog", { name: "Retirer le PNJ" });
      await test.step("« Retirer » sur la carte demande confirmation ; Échap ne change rien", async () => {
        await panel.getByRole("button", { name: `Retirer ${npcName} des compagnons` }).click();
        await expect(confirm.getByText(`Voulez-vous retirer ${npcName} des compagnons de ${pcName} ?`, { exact: false })).toBeVisible();
        await player.page.keyboard.press("Escape");
        await expect(confirm).toBeHidden();
        expect(await linkedPlayerId(player.api, npc._id)).toBe(pc._id);
        await expect(companionCard(panel, npcName)).toBeVisible();
      });

      await test.step("confirmer : toast, la carte disparaît, le PNJ est délié", async () => {
        await panel.getByRole("button", { name: `Retirer ${npcName} des compagnons` }).click();
        await confirm.getByRole("button", { name: "Retirer" }).click();
        await expect(player.page.getByText(/retiré avec succès\./)).toBeVisible();
        await expect(confirm).toBeHidden();
        await expect.poll(() => linkedPlayerId(player.api, npc._id)).toBeNull();
        await expect(panel.getByText("Aucun compagnon pour l'instant")).toBeVisible();
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("le joueur renomme un compagnon depuis sa ligne imbriquée", async ({ player }) => {
    const pcName = uniqueLabel("Paladin");
    const name = uniqueLabel("Monture");
    const renamed = uniqueLabel("Monture renommée");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(name, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("Modifier ouvre la fiche du compagnon en édition", async () => {
        const menu = await openCharacterActions(player.page, companionsOf(nav, pcName), name);
        await menu.getByRole("menuitem", { name: "Modifier" }).click();
        await expect(player.page).toHaveURL(new RegExp(`/characters/${npc._id}`));
        await expect(player.page.getByLabel("Prénom")).toHaveValue(name);
      });

      await test.step("Sauvegarder : nouveau nom, toujours lié et imbriqué sous le PJ", async () => {
        await player.page.getByLabel("Prénom").fill(renamed);
        await player.page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
        await expect(player.page.getByText("Personnage mis à jour avec succès")).toBeVisible();
        await expect.poll(async () => (await player.api.getCharacter(npc._id)).firstname).toBe(renamed);
        expect(await linkedPlayerId(player.api, npc._id)).toBe(pc._id);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(companionsOf(nav, pcName), renamed)).toBeVisible();
        await expect(characterLink(nav, name)).toHaveCount(0);
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("le joueur supprime un compagnon depuis sa ligne imbriquée, le PJ reste", async ({ player }) => {
    const pcName = uniqueLabel("Sorcier");
    const name = uniqueLabel("Diablotin");
    const pc = await player.api.createPlayer(pcName);
    const npc = await player.api.createNpc(name, { linkedPlayerId: pc._id });
    try {
      const nav = await openPlayerSpace(player.page);

      await test.step("Supprimer : simple confirmation (pas de choix de compagnons)", async () => {
        const menu = await openCharacterActions(player.page, companionsOf(nav, pcName), name);
        await menu.getByRole("menuitem", { name: "Supprimer" }).click();
        const confirm = player.page.getByRole("dialog", { name: "Supprimer le personnage" });
        await expect(confirm).toBeVisible();
        await expect(player.page.getByRole("dialog", { name: "Supprimer ce personnage" })).toHaveCount(0);
        await confirm.getByRole("button", { name: "Supprimer" }).click();
        await expect(confirm).toBeHidden();
      });

      await test.step("le compagnon a disparu ; le PJ reste, sans compagnon", async () => {
        await expect.poll(async () => (await player.api.npcsLinkedTo([pc._id])).length).toBe(0);
        expect((await player.api.listPlayersWithoutGroup()).map((p) => p._id)).toContain(pc._id);
        await ensureSidebarOpen(player.page);
        await expect(characterLink(nav, name)).toHaveCount(0);
        await expect(companionsOf(nav, pcName)).toHaveCount(0);
        await expect(characterLink(nav, pcName)).toBeVisible();
        await closeDialogIfOpen(player.page);
        const panel = await openCompanionsTab(player.page, nav, pc);
        await expect(panel.getByText("Aucun compagnon pour l'instant")).toBeVisible();
      });
    } finally {
      await deleteCharacters(player.api, [npc._id, pc._id]);
    }
  });

  test("le joueur recherche un compagnon par nom ou surnom, sans accents ni casse", async ({ player }) => {
    const pcName = uniqueLabel("Ranger");
    const suffix = uniqueLabel("").split(" ").pop()!;
    const lightning = `Éclair ${suffix}`;
    const mist = `Brume ${suffix}`;
    const pc = await player.api.createPlayer(pcName);
    const npcs = [
      await player.api.createNpc(lightning, { linkedPlayerId: pc._id }),
      await player.api.createNpc(mist, { linkedPlayerId: pc._id, surname: "Ombre" }),
    ];
    try {
      const nav = await openPlayerSpace(player.page);
      const panel = await openCompanionsTab(player.page, nav, pc);
      const search = panel.getByRole("searchbox", { name: "Rechercher un compagnon" });
      await expect(companionCard(panel, lightning)).toBeVisible();
      await expect(companionCard(panel, mist)).toBeVisible();

      await test.step("nom sans accent ni casse : « eclair » trouve « Éclair »", async () => {
        await search.fill("eclair");
        await expect(companionCard(panel, lightning)).toBeVisible();
        await expect(companionCard(panel, mist)).toHaveCount(0);
      });

      await test.step("surnom en majuscules : « OMBRE » trouve « Brume »", async () => {
        await search.fill("OMBRE");
        await expect(companionCard(panel, mist)).toBeVisible();
        await expect(companionCard(panel, lightning)).toHaveCount(0);
      });

      await test.step("aucun résultat : message explicite, sans bouton", async () => {
        await search.fill("introuvable");
        await expect(panel.getByText("Aucun compagnon ne correspond à « introuvable ».")).toBeVisible();
        await expect(companionCard(panel, lightning)).toHaveCount(0);
        await expect(companionCard(panel, mist)).toHaveCount(0);
      });

      await test.step("Échap puis « Effacer la recherche » rétablissent la liste complète", async () => {
        await search.press("Escape");
        await expect(search).toHaveValue("");
        await expect(companionCard(panel, lightning)).toBeVisible();
        await expect(companionCard(panel, mist)).toBeVisible();
        await search.fill("brume");
        await panel.getByRole("button", { name: "Effacer la recherche" }).click();
        await expect(search).toHaveValue("");
        await expect(companionCard(panel, lightning)).toBeVisible();
      });
    } finally {
      await deleteCharacters(player.api, [...npcs.map((n) => n._id), pc._id]);
    }
  });
});
