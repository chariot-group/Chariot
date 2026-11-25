import type { Locator, Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, NpcSeed } from "@/api";
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
  launchSessionFromSidebar,
  openJoinCharacterOption,
  openCampaignSidebar,
  openCharacterActions,
  openCharacterFromSidebar,
  openGroupActions,
  openPlayerSpace,
  refreshCachedUser,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * Repos des PNJ et PNJ en session.
 * Couvre FR-character-long-rest (repos long d'un PNJ du MJ hors session et en session, aucun repos pour un PNJ
 * vu en espace joueur, « Repos long du groupe » sur PJ + PNJ), FR-session-gm-guest-character (« Rejoindre la session »
 * / « Quitter la session » sur un PNJ de groupe, entrée « Invité MJ » dans « Joueurs (session) »),
 * FR-session-player-companion-combatants (compagnon du joueur visible du MJ dans le lobby et sous le joueur),
 * FR-session-join-companion-visibility (nombre de compagnons dans le choix du personnage) et
 * FR-session-lobby-wheel-deposit (dépôt des wheels, lancement). Pré-requis session : skill `sessions-websocket`.
 */

/** PNJ blessé : 3 PV sur 25 et 5 PV temporaires. */
const WOUNDED_NPC: NpcSeed = { stats: { maxHitPoints: 25, currentHitPoints: 3, tempHitPoints: 5 } };

async function npcHitPoints(api: ChariotApi, characterId: string) {
  const { stats } = await api.getCharacter(characterId);
  return { current: stats?.currentHitPoints, temp: stats?.tempHitPoints };
}

/** Carte « Statistiques » de la fiche (région nommée par son titre). */
function statisticsCard(page: Page): Locator {
  return page.getByRole("region", { name: "Statistiques" });
}

/** Applique le repos long depuis la carte « Statistiques » de la fiche affichée et attend sa confirmation. */
async function confirmLongRest(page: Page): Promise<void> {
  await statisticsCard(page).getByRole("button", { name: "Repos long" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirmer le repos long ?" });
  await expect(dialog.getByText("Les points de vie actuels remontent au maximum.")).toBeVisible();
  await expect(dialog.getByText("Les points de vie temporaires repassent à zéro.")).toBeVisible();
  // Effets propres aux PJ, jamais listés pour un PNJ.
  await expect(dialog.getByText("Le niveau d’épuisement diminue de 1.")).toHaveCount(0);
  await expect(dialog.getByText(/Les dés de vie restants/)).toHaveCount(0);
  await dialog.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Repos long effectué.")).toBeVisible();
  await expect(dialog).toBeHidden();
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PNJ repos"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Repos des PNJ hors session", () => {
  test("le MJ applique un repos long sur la fiche d'un PNJ de son groupe", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Groupe");
    const name = uniqueLabel("PNJ blessé");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const npc = await gm.api.createNpc(name, { ...WOUNDED_NPC, groups: [group._id] });
    try {
      const nav = await openCampaignSidebar(gm.page, campaign);
      await expandGroup(nav, groupLabel);
      await openCharacterFromSidebar(gm.page, await groupContent(nav, groupLabel), name);
      await expect(gm.page).toHaveURL(new RegExp(`/characters/${npc._id}`));

      await test.step("hors session : repos long seul, jamais de repos court sur un PNJ", async () => {
        await expect(statisticsCard(gm.page).getByRole("button", { name: "Repos court" })).toHaveCount(0);
      });

      await test.step("confirmer : PV au maximum, PV temporaires à 0", async () => {
        await confirmLongRest(gm.page);
        await expect.poll(() => npcHitPoints(gm.api, npc._id)).toEqual({ current: 25, temp: 0 });
      });
    } finally {
      await deleteCharacters(gm.api, [npc._id]);
    }
  });

  test("un PNJ vu en espace joueur n'a aucun repos", async ({ player }) => {
    const name = uniqueLabel("PNJ sans repos");
    const npc = await player.api.createNpc(name, WOUNDED_NPC);
    try {
      const nav = await openPlayerSpace(player.page);
      await openCharacterFromSidebar(player.page, nav, name);
      await expect(player.page).toHaveURL(new RegExp(`/characters/${npc._id}`));
      const stats = statisticsCard(player.page);
      await expect(stats).toBeVisible();
      await expect(stats.getByRole("button", { name: "Repos long" })).toHaveCount(0);
      await expect(stats.getByRole("button", { name: "Repos court" })).toHaveCount(0);
      expect(await npcHitPoints(player.api, npc._id)).toEqual({ current: 3, temp: 5 });
    } finally {
      await deleteCharacters(player.api, [npc._id]);
    }
  });

  test("le MJ fait le repos long d'un groupe de PJ et de PNJ", async ({ gm, campaign }) => {
    const groupLabel = uniqueLabel("Escorte");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const pc = await gm.api.createPlayer(uniqueLabel("Capitaine"), {
      groups: [group._id],
      stats: { maxHitPoints: 20, currentHitPoints: 4, tempHitPoints: 0 },
    });
    const npc = await gm.api.createNpc(uniqueLabel("Mercenaire"), { ...WOUNDED_NPC, groups: [group._id] });
    try {
      await expect.poll(async () => (await gm.api.groupCharacters(group._id)).length).toBe(2);
      const nav = await openCampaignSidebar(gm.page, campaign);
      const confirm = gm.page.getByRole("dialog", { name: `Repos long : ${groupLabel}` });

      const menu = await openGroupActions(gm.page, nav, groupLabel);
      await menu.getByRole("menuitem", { name: "Repos long du groupe" }).click();
      await expect(confirm.getByText(/1 PJ et 1 PNJ/)).toBeVisible();
      await confirm.getByRole("button", { name: "Faire le repos long" }).click();
      await expect(gm.page.getByText("2 personnages reposés", { exact: true })).toBeVisible();
      await expect(confirm).toBeHidden();
      await expect.poll(() => npcHitPoints(gm.api, npc._id)).toEqual({ current: 25, temp: 0 });
      await expect.poll(async () => (await gm.api.getCharacter(pc._id)).stats?.currentHitPoints).toBe(20);
    } finally {
      await deleteCharacters(gm.api, [npc._id, pc._id]);
    }
  });
});

test.describe("PNJ en session", () => {
  /**
   * Lancer une session débite une wheel par participant (FR-session-lobby-wheel-deposit) : les comptes de test
   * sont crédités au besoin (`ensureWheels` : route interne avec `INTERNAL_SERVICE_SECRET`, sinon commande gratuite
   * avec `KEYCLOAK_ADMIN_*`) ; sans l'un ni l'autre et sans solde, le test est ignoré.
   */
  test("compagnon du joueur et PNJ invité du MJ en session lancée, repos long du MJ", async ({ gm, player, campaign }) => {
    const [gmBalance, playerBalance] = await Promise.all([gm.api.ensureWheels(1), player.api.ensureWheels(1)]);
    test.skip(gmBalance < 1 || playerBalance < 1, `wheels insuffisantes (MJ ${gmBalance}, joueur ${playerBalance}) pour lancer une session`);

    const groupLabel = uniqueLabel("Table");
    const guestName = uniqueLabel("Aubergiste");
    const pcName = uniqueLabel("Ranger");
    const companionName = uniqueLabel("Loup gris");
    const group = await seedActiveGroup(gm.api, campaign._id, groupLabel);
    const guest = await gm.api.createNpc(guestName, { ...WOUNDED_NPC, groups: [group._id] });
    const pc = await player.api.createPlayer(pcName);
    const companion = await player.api.createNpc(companionName, { linkedPlayerId: pc._id });
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

      await test.step("Joueur : le choix du personnage annonce « 1 compagnon », le compagnon n'est pas choisissable", async () => {
        const option = await openJoinCharacterOption(player.page, pc._id, code!, pcName);
        const join = player.page.getByRole("dialog", { name: "Rejoindre une session" });
        await expect(option).toContainText(/1 compagnon|\+1/);
        await expect(player.page.getByRole("option", { name: new RegExp(escapeRegExp(companionName)) })).toHaveCount(0);
        await option.click();
        await join.getByRole("button", { name: "Rejoindre la session" }).click();
        await expect(join).toBeHidden();
      });

      await test.step("MJ : le lobby montre le PJ du joueur", async () => {
        await expect(gm.page.getByRole("dialog").getByText(pcName)).toBeVisible();
      });

      await test.step("chacun dépose une wheel (le compagnon ne compte pas), le MJ lance la session", async () => {
        await expect(gm.page.getByRole("progressbar", { name: /sur 2$/ })).toBeVisible();
        await player.page.getByRole("dialog").getByRole("button", { name: "Déposer une wheel" }).click();
        await gm.page.getByRole("dialog").getByRole("button", { name: "Déposer une wheel" }).click();
        await gm.page.getByRole("button", { name: "Lancer la session (toutes les wheels ont été déposées)" }).click();
        await expect(gm.page.getByText("La session a été lancée !")).toBeVisible();
        await expect(player.page.getByText("La session a été lancée !")).toBeVisible();
      });

      await test.step("MJ : session lancée, le lobby affiche le nom du compagnon sous le PJ du joueur", async () => {
        // Les compagnons ne sont chargés qu'une fois la session lancée (SessionPlayerCompanionSyncClient).
        // Le lobby peut se refermer seul après le lancement : on le rouvre depuis le logo de l'en-tête.
        const lobby = gm.page.getByRole("dialog");
        await expect(async () => {
          if ((await lobby.count()) === 0) await gm.page.getByRole("button", { name: /^Ouvrir le lobby de session/ }).click();
          await expect(lobby.getByText(companionName)).toBeVisible({ timeout: 3_000 });
        }).toPass({ timeout: 30_000 });
      });

      const nav = await test.step("MJ : le compagnon est imbriqué sous le joueur dans « Joueurs (session) »", async () => {
        await closeDialogIfOpen(gm.page);
        const sidebar = await openCampaignSidebar(gm.page, campaign);
        const players = gm.page.locator("#session-players-content");
        const toggle = gm.page.getByRole("button", { name: "Joueurs (session)" });
        if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
        await expect(characterLink(players.getByRole("list", { name: `Compagnons de ${pcName}` }), companionName)).toBeVisible();
        return sidebar;
      });

      await test.step("MJ : « Rejoindre la session » fait d'un PNJ du groupe un invité MJ, « Quitter la session » le retire", async () => {
        await expandGroup(nav, groupLabel);
        const members = await groupContent(nav, groupLabel);
        let menu = await openCharacterActions(gm.page, members, guestName);
        await expect(menu.getByRole("menuitem", { name: "Modifier" }), "actions courantes masquées en session").toHaveCount(0);
        await menu.getByRole("menuitem", { name: "Rejoindre la session" }).click();
        const guestEntry = gm.page.locator("#session-players-content").getByRole("link", { name: `${guestName} – Invité MJ` });
        await expect(guestEntry).toBeVisible();

        await ensureSidebarOpen(gm.page);
        menu = await openCharacterActions(gm.page, await groupContent(nav, groupLabel), guestName);
        await menu.getByRole("menuitem", { name: "Quitter la session" }).click();
        await expect(guestEntry).toHaveCount(0);
      });

      await test.step("MJ : repos long d'un PNJ de groupe en session, sans repos court", async () => {
        await ensureSidebarOpen(gm.page);
        await expandGroup(nav, groupLabel);
        await openCharacterFromSidebar(gm.page, await groupContent(nav, groupLabel), guestName);
        await expect(gm.page).toHaveURL(new RegExp(`/characters/${guest._id}`));
        await expect(statisticsCard(gm.page).getByRole("button", { name: "Repos court" })).toHaveCount(0);
        await confirmLongRest(gm.page);
        await expect.poll(() => npcHitPoints(gm.api, guest._id)).toEqual({ current: 25, temp: 0 });
      });

      await test.step("Joueur : en session, la fiche de son compagnon (espace joueur) n'a aucun repos", async () => {
        await closeDialogIfOpen(player.page);
        await player.page.goto(`/${env.locale}/characters/${companion._id}`);
        const stats = statisticsCard(player.page);
        await expect(stats).toBeVisible();
        await expect(stats.getByRole("button", { name: "Repos long" })).toHaveCount(0);
        await expect(stats.getByRole("button", { name: "Repos court" })).toHaveCount(0);
      });
    } finally {
      if (code) {
        await player.api.leaveSession(code).catch(() => undefined);
        await gm.api.leaveSession(code).catch(() => undefined);
      }
      await deleteCharacters(player.api, [companion._id, pc._id]);
      await deleteCharacters(gm.api, [guest._id]);
    }
  });
});
