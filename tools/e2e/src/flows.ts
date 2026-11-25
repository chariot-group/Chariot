import { expect, type Locator, type Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, CreatedGroup } from "@/api";
import { env } from "@/env";

/**
 * Parcours UI réutilisables entre scénarios.
 * Sélecteurs par rôle + nom accessible (libellés FR) : un sélecteur qui casse
 * signale souvent aussi une régression d'accessibilité.
 */

export async function createCampaignFromWelcome(page: Page, label: string): Promise<void> {
  await page.goto(`/${env.locale}/welcome`);
  await page.getByRole("button", { name: "Naviguer vers la création de campagne" }).click();

  const dialog = page.getByRole("dialog", { name: "Créer une nouvelle campagne" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nom de la campagne").fill(label);
  await dialog.getByRole("button", { name: "Sauvegarder" }).click();

  await expect(page.getByText(`Campagne ${label} créée avec succès !`)).toBeVisible();
  await expect(dialog).toBeHidden();
}

/**
 * Navigue vers `url` et attend d'y rester. Juste après la connexion, FR-post-auth-navigation peut encore rediriger
 * (ex. vers /welcome) et interrompre `page.goto` : on relance la navigation jusqu'à ce que l'URL `settled` tienne.
 */
export async function gotoSettled(page: Page, url: string, settled: RegExp): Promise<void> {
  await expect(async () => {
    await page.goto(url);
    await expect(page).toHaveURL(settled, { timeout: 2_000 });
    // Une redirection tardive reste possible juste après le chargement : l'URL doit encore tenir un instant après.
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(settled, { timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Sous 768 px (projet `mobile`), la sidebar est repliée dans un menu « Ouvrir le menu » :
 * l'ouvre si besoin pour que ses boutons soient accessibles. Sans effet sur ordinateur.
 */
export async function openSidebarIfMobile(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? Number.POSITIVE_INFINITY;
  if (width >= MOBILE_BREAKPOINT) return;
  // Pas d'attente sur « Fermer le menu » : le tiroir est modal et masque le reste de la page
  // (header compris) aux technologies d'assistance. L'appelant attend le bouton qu'il vise.
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
}

/**
 * Sur mobile, rouvre le tiroir de la sidebar s'il s'est refermé (après une navigation par exemple).
 * Attend que l'un des deux états soit stable : sidebar affichée ou bouton « Ouvrir le menu » disponible.
 */
export async function ensureSidebarOpen(page: Page): Promise<void> {
  const spaces = page.getByRole("group", { name: "Vos espaces" });
  const opener = page.getByRole("button", { name: "Ouvrir le menu" });
  await expect(spaces.or(opener).first()).toBeVisible();
  if (!(await spaces.isVisible())) await opener.click();
  await expect(spaces).toBeVisible();
}

/** Même seuil que `MOBILE_BREAKPOINT` du client web (`hooks/use-mobile.ts`). */
const MOBILE_BREAKPOINT = 768;

/**
 * Même seuil que `TABLET_BREAKPOINT` du client web : en dessous, les actions des lignes de la sidebar
 * passent par un bouton `⋮` au lieu du clic droit (FR-sidebar-context-actions).
 */
const TABLET_BREAKPOINT = 1024;

function isBelowTablet(page: Page): boolean {
  return (page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) < TABLET_BREAKPOINT;
}

/** Bouton « Espace maître du jeu » : bascule d'espace et sélecteur de campagne (`aria-pressed` en espace MJ). */
export function gmSpaceButton(page: Page): Locator {
  return page.getByRole("button", { name: "Espace maître du jeu" });
}

/** Ouvre le menu « Espace maître du jeu » (liste des campagnes, « Créer une campagne »). */
export async function openSpaceMenu(page: Page): Promise<Locator> {
  await gmSpaceButton(page).click();
  const menu = page.getByRole("menu", { name: "Espace maître du jeu" });
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * Ferme le menu « Espace maître du jeu ». Il reste ouvert après le choix ou la suppression d'une campagne
 * (modal : il masque le reste de la page aux technologies d'assistance), parfois sans contenu visible
 * pendant la navigation qui suit. On se fie donc à l'état de son déclencheur (`aria-expanded`), lu hors arbre
 * d'accessibilité puisque le menu modal le masque. Sous Firefox / WebKit, un Échap envoyé pendant
 * la navigation peut être perdu : on réessaie.
 */
export async function closeSpaceMenu(page: Page): Promise<void> {
  const openTrigger = page.locator(`button[aria-haspopup="menu"][aria-expanded="true"][aria-label="Espace maître du jeu"]`);
  await expect(async () => {
    if ((await openTrigger.count()) > 0) await page.keyboard.press("Escape");
    await expect(openTrigger).toHaveCount(0, { timeout: 1_000 });
  }).toPass();
}

/**
 * Ouvre l'espace MJ d'une campagne et renvoie la navigation MJ de la sidebar (ouverte sur mobile).
 * L'espace affiché est mémorisé par compte : s'il était resté en Joueur, on passe par le sélecteur
 * « Espace maître du jeu », qui liste les campagnes.
 */
export async function openCampaignSidebar(page: Page, campaign: CreatedCampaign): Promise<Locator> {
  await gotoSettled(page, `/${env.locale}/campaigns/${campaign._id}`, new RegExp(`/campaigns/${campaign._id}`));
  await openSidebarIfMobile(page);
  const nav = page.getByRole("navigation", { name: "Navigation maître du jeu" });
  const gmSpace = gmSpaceButton(page);
  await expect(nav.or(gmSpace).first()).toBeVisible();
  if ((await gmSpace.getAttribute("aria-pressed")) !== "true") {
    const menu = await openSpaceMenu(page);
    await campaignButton(menu, campaign.label).click();
    await closeSpaceMenu(page);
    await expect(gmSpace).toHaveAttribute("aria-pressed", "true");
  }
  await expect(nav.getByRole("heading", { name: campaign.label })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Créer un groupe" })).toBeVisible();
  return nav;
}

/** Bouton de sélection d'une campagne dans le menu « Espace maître du jeu », par son libellé exact. */
export function campaignButton(spaceMenu: Locator, label: string): Locator {
  return spaceMenu.getByRole("button", { name: label, exact: true });
}

/**
 * Ouvre le menu d'actions d'une campagne depuis le menu « Espace maître du jeu » (déjà ouvert) :
 * clic droit sur ordinateur, bouton « Actions sur la campagne » de sa ligne sous 1024 px.
 */
export async function openCampaignActions(page: Page, spaceMenu: Locator, label: string): Promise<Locator> {
  if (isBelowTablet(page)) {
    await sidebarRow(page, spaceMenu, label, "Actions sur la campagne")
      .getByRole("button", { name: "Actions sur la campagne" })
      .click();
  } else {
    await campaignButton(spaceMenu, label).click({ button: "right" });
  }
  const menu = page.getByRole("menu", { name: "Actions sur la campagne" });
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * Ligne d'une liste de la sidebar : plus petit bloc qui contient le bouton (ou, pour un personnage, le lien) `label`
 * et son bouton d'actions `⋮` (ordre DOM : le plus profond en dernier). `has` est relatif à chaque bloc,
 * d'où des locators construits depuis `page`.
 */
function sidebarRow(
  page: Page,
  scope: Locator,
  label: string,
  actionsName: string,
  role: "button" | "link" = "button",
): Locator {
  const target = role === "link" ? characterLink(page, label) : page.getByRole(role, { name: label, exact: true });
  return scope
    .locator("div")
    .filter({ has: target })
    .filter({ has: page.getByRole("button", { name: actionsName }) })
    .last();
}

/**
 * En-tête (déclencheur repliable) d'un groupe de la sidebar MJ, par son libellé exact. Replié alors qu'il contient
 * la fiche affichée, son nom accessible est suivi de « Personnage affiché : <nom> » (FR-sidebar-group-collapsed-active-indicator).
 */
export function groupHeader(nav: Locator, label: string): Locator {
  return nav.getByRole("button", { name: new RegExp(`^${escapeRegExp(label)}( ?Personnage affiché : .*)?$`) });
}

/**
 * Ouvre le menu d'actions d'un groupe : clic droit sur ordinateur, bouton « Actions sur le groupe »
 * de sa ligne sous 1024 px. Renvoie le menu ouvert (mêmes entrées dans les deux cas).
 */
export async function openGroupActions(page: Page, nav: Locator, label: string): Promise<Locator> {
  if (isBelowTablet(page)) {
    await sidebarRow(page, nav, label, "Actions sur le groupe")
      .getByRole("button", { name: "Actions sur le groupe" })
      .click();
  } else {
    await groupHeader(nav, label).click({ button: "right" });
  }
  const menu = page.getByRole("menu", { name: "Actions sur le groupe" });
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * Ouvre le menu « Actions sur les archives » (en-tête « Vos archives ») : clic droit sur ordinateur,
 * bouton `⋮` sous 1024 px. Le menu n'existe que s'il reste au moins un groupe archivé.
 */
export async function openArchivesActions(page: Page, nav: Locator): Promise<Locator> {
  if (isBelowTablet(page)) {
    await nav.getByRole("button", { name: "Actions sur les archives" }).click();
  } else {
    await nav.getByRole("button", { name: "Vos archives" }).click({ button: "right" });
  }
  const menu = page.getByRole("menu", { name: "Actions sur les archives" });
  await expect(menu).toBeVisible();
  return menu;
}

/** Déplie la section « Vos archives » si elle est repliée (état persisté entre les pages). */
export async function expandArchives(nav: Locator): Promise<void> {
  const trigger = nav.getByRole("button", { name: "Vos archives" });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

/** Contenu de la section « Vos archives », retrouvé par l'`aria-controls` de son déclencheur. */
export async function archivesSection(nav: Locator): Promise<Locator> {
  const controls = await nav.getByRole("button", { name: "Vos archives" }).getAttribute("aria-controls");
  expect(controls, "« Vos archives » référence son contenu (aria-controls)").toBeTruthy();
  return nav.locator(`[id="${controls}"]`);
}

/**
 * Ouvre l'espace joueur et renvoie sa navigation (« Navigation joueur », liste « Vos personnages »).
 * L'espace affiché est mémorisé par compte : s'il était resté en MJ, on clique « Espace joueur ».
 */
export async function openPlayerSpace(page: Page): Promise<Locator> {
  await gotoSettled(page, `/${env.locale}/characters`, /\/characters/);
  await openSidebarIfMobile(page);
  const nav = page.getByRole("navigation", { name: "Navigation joueur" });
  const playerSpace = page.getByRole("button", { name: "Espace joueur" });
  await expect(nav.or(playerSpace).first()).toBeVisible();
  if ((await playerSpace.getAttribute("aria-pressed")) !== "true") {
    await playerSpace.click();
    await expect(playerSpace).toHaveAttribute("aria-pressed", "true");
  }
  await ensureSidebarOpen(page);
  await expect(nav.getByRole("heading", { name: "Vos personnages" })).toBeVisible();
  return nav;
}

/**
 * Lien d'un personnage de la sidebar (espace joueur ou groupe MJ), par son nom affiché exact.
 * Dans l'espace joueur, un PNJ est suivi de « (PNJ) » ; le lien de la fiche affichée, de « (sélectionné) ».
 */
export function characterLink(scope: Locator | Page, name: string): Locator {
  return scope.getByRole("link", { name: new RegExp(`^${escapeRegExp(name)}( \\(PNJ\\))?( \\(sélectionné\\))?$`) });
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ouvre le menu « Actions sur le personnage » d'une ligne de la sidebar : clic droit sur ordinateur,
 * bouton `⋮` de la ligne sous 1024 px (FR-sidebar-context-actions). Mêmes entrées dans les deux cas.
 */
export async function openCharacterActions(page: Page, scope: Locator, name: string): Promise<Locator> {
  const menu = page.getByRole("menu", { name: "Actions sur le personnage" });
  if (isBelowTablet(page)) {
    const overflow = sidebarRow(page, scope, name, "Actions sur le personnage", "link").getByRole("button", {
      name: "Actions sur le personnage",
    });
    // Sur mobile, une navigation en cours (ex. vers une copie juste créée) peut refermer le tiroir de la sidebar
    // pendant qu'on le rouvre : le bouton `⋮` bouge sous le clic. On rouvre le tiroir et on réessaie.
    await expect(async () => {
      if ((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) < MOBILE_BREAKPOINT) await ensureSidebarOpen(page);
      await overflow.click({ timeout: 3_000 });
      await expect(menu).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
  } else {
    // Un clic droit envoyé avant que la ligne soit interactive (hydratation, rechargement de la liste) est perdu.
    await expect(async () => {
      await characterLink(scope, name).click({ button: "right", timeout: 3_000 });
      await expect(menu).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
  }
  return menu;
}

/**
 * Ouvre la fiche d'un personnage depuis son lien de la sidebar. Sur mobile, « Vos personnages » laisse le tiroir
 * de la sidebar ouvert après la navigation (les groupes MJ le referment) : on le ferme pour atteindre la fiche.
 */
export async function openCharacterFromSidebar(page: Page, scope: Locator, name: string): Promise<void> {
  await characterLink(scope, name).click();
  // Tiroir mobile : dialogue modal « Sidebar » (absent sur ordinateur). Un Échap envoyé pendant la navigation
  // peut être perdu : on réessaie jusqu'à sa fermeture.
  const drawer = page.getByRole("dialog", { name: "Sidebar" });
  await expect(async () => {
    if ((await drawer.count()) > 0) await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0, { timeout: 1_000 });
  }).toPass();
}

/** Déplie un groupe de la sidebar MJ s'il est replié (état persisté entre les pages). */
export async function expandGroup(nav: Locator, label: string): Promise<void> {
  const header = groupHeader(nav, label);
  if ((await header.getAttribute("aria-expanded")) !== "true") await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "true");
}

/**
 * Rafraîchit le profil mis en cache par l'app (solde de wheels compris) : il est persisté par compte et n'est pas
 * relu tant qu'il existe. La page profil le recharge à l'ouverture, comme après un achat.
 */
export async function refreshCachedUser(page: Page): Promise<void> {
  const refreshed = page.waitForResponse(
    // 304 compris : le navigateur peut revalider la réponse depuis son cache HTTP.
    (res) => res.request().method() === "GET" && /\/user\/me\/?$/.test(new URL(res.url()).pathname) && res.status() < 400,
    { timeout: 30_000 },
  );
  await gotoSettled(page, `/${env.locale}/profile`, /\/profile/);
  await refreshed;
}

/** Ferme le lobby (ou tout dialogue modal resté ouvert) avant de piloter la page derrière. */
export async function closeDialogIfOpen(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    if ((await dialog.count()) > 0) await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0, { timeout: 1_000 });
  }).toPass();
}

/**
 * Ouvre le lien d'invitation `code` depuis la fiche du PJ et renvoie l'option de ce PJ dans le choix du personnage,
 * liste ouverte. La liste se remplit après l'ouverture du dialogue : on la rouvre jusqu'à voir l'option.
 */
export async function openJoinCharacterOption(page: Page, characterId: string, code: string, name: string): Promise<Locator> {
  await page.goto(`/${env.locale}/characters/${characterId}?join=${code}`);
  const join = page.getByRole("dialog", { name: "Rejoindre une session" });
  const option = page.getByRole("option", { name: new RegExp(escapeRegExp(name)) });
  await expect(async () => {
    if (!(await option.isVisible())) {
      await page.keyboard.press("Escape");
      await join.getByRole("combobox").click();
    }
    await expect(option).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return option;
}

/** Lance une session depuis la sidebar MJ et renvoie son code OTP (lu sur la réponse API). */
export async function launchSessionFromSidebar(page: Page): Promise<string> {
  const created = page.waitForResponse(
    (res) => res.request().method() === "POST" && /\/session\/sessions\/?$/.test(new URL(res.url()).pathname),
  );
  await ensureSidebarOpen(page);
  await page.getByRole("button", { name: "Lancer une session" }).click();
  const response = await created;
  expect(response.ok(), "création de session").toBeTruthy();
  const body = (await response.json()) as { data: { code: string } };
  return body.data.code;
}

/**
 * Crée un groupe actif par l'API et attend qu'il soit rattaché à la campagne : adventure ajoute l'identifiant
 * à `campaign.groups.active` après avoir répondu au POST.
 */
export async function seedActiveGroup(api: ChariotApi, campaignId: string, label: string): Promise<CreatedGroup> {
  const group = await api.createGroup(campaignId, label);
  await expect
    .poll(async () => (await api.listGroups(campaignId, "active")).map((g) => g._id), { message: `${label} actif` })
    .toContain(group._id);
  return group;
}

/** Contenu (liste des personnages) d'un groupe de la sidebar MJ, retrouvé par l'`aria-controls` de son en-tête. */
export async function groupContent(nav: Locator, label: string): Promise<Locator> {
  const controls = await groupHeader(nav, label).getAttribute("aria-controls");
  expect(controls, `« ${label} » référence son contenu (aria-controls)`).toBeTruthy();
  return nav.locator(`[id="${controls}"]`);
}

/** Supprime des personnages sans échouer sur ceux déjà supprimés par le scénario. */
export async function deleteCharacters(api: ChariotApi, ids: Iterable<string>): Promise<void> {
  for (const id of ids) await api.deleteCharacter(id).catch(() => undefined);
}

/** Supprime les PJ sans groupe dont le prénom commence par `prefix` (personnages créés par l'UI pendant le scénario). */
export async function deletePlayersWithoutGroupByPrefix(api: ChariotApi, prefix: string): Promise<void> {
  const players = await api.listPlayersWithoutGroup().catch(() => []);
  await deleteCharacters(
    api,
    players.filter((p) => p.firstname.startsWith(prefix)).map((p) => p._id),
  );
}

/** Supprime les groupes (actifs et archivés) puis la campagne : la suppression de campagne ne supprime pas ses groupes. */
export async function deleteCampaignWithGroups(api: ChariotApi, campaignId: string): Promise<void> {
  const groups = [
    ...(await api.listGroups(campaignId, "active").catch(() => [])),
    ...(await api.listGroups(campaignId, "archived").catch(() => [])),
  ];
  for (const group of groups) await api.deleteGroup(group._id).catch(() => undefined);
  await api.deleteCampaign(campaignId);
}

/** Nettoie les campagnes créées par un scénario (repérées par leur libellé unique). */
export async function deleteCampaignsByLabel(api: ChariotApi, label: string): Promise<void> {
  const campaigns = await api.listCampaigns();
  for (const campaign of campaigns.filter((c) => c.label === label)) {
    await api.deleteCampaign(campaign._id);
  }
}

/**
 * Lien rapide de la sidebar par son titre exact (FR-sidebar-quick-links) : le nom accessible annonce
 * l'ouverture dans un nouvel onglet. La section est hors des navigations « joueur » / « maître du jeu ».
 */
export function quickLink(scope: Locator | Page, label: string): Locator {
  return scope.getByRole("link", { name: `${label} (s'ouvre dans un nouvel onglet)`, exact: true });
}

/** Liste des liens propres à l'espace courant (« Liens de cette campagne » ou « Liens de l'espace joueur »). */
export function ownQuickLinks(page: Page, space: "campaign" | "player"): Locator {
  return page.getByRole("list", { name: space === "campaign" ? "Liens de cette campagne" : "Liens de l'espace joueur" });
}

/** Liste des liens communs (partagés avec d'autres espaces). */
export function sharedQuickLinks(page: Page): Locator {
  return page.getByRole("list", { name: /^Liens communs/ });
}

/** Déplie la section « Liens rapides » si elle est repliée (état persisté par espace dans le localStorage). */
export async function expandQuickLinks(page: Page): Promise<void> {
  const collapse = page.getByRole("button", { name: "Replier les liens rapides" });
  const expand = page.getByRole("button", { name: "Déplier les liens rapides" });
  await expect(collapse.or(expand).first()).toBeVisible();
  if (await expand.isVisible()) await expand.click();
  await expect(collapse).toBeVisible();
}

/**
 * Ouvre le menu « Actions sur le lien <titre> » : clic droit sur ordinateur, bouton `⋮` de la ligne
 * sous 1024 px (FR-sidebar-context-actions). Mêmes entrées dans les deux cas (Modifier, Supprimer).
 */
export async function openQuickLinkActions(page: Page, label: string): Promise<Locator> {
  const name = `Actions sur le lien ${label}`;
  const menu = page.getByRole("menu", { name });
  // Un clic envoyé avant que la ligne soit interactive (hydratation, rechargement de la liste) est perdu.
  await expect(async () => {
    if (isBelowTablet(page)) {
      if ((page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) < MOBILE_BREAKPOINT) await ensureSidebarOpen(page);
      await page.getByRole("button", { name, exact: true }).click({ timeout: 3_000 });
    } else {
      await quickLink(page, label).click({ button: "right", timeout: 3_000 });
    }
    await expect(menu).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return menu;
}

/** Supprime les liens rapides du compte dont le titre commence par `prefix` (nettoyage des scénarios). */
export async function deleteQuickLinksByPrefix(api: ChariotApi, prefix: string): Promise<void> {
  const links = await api.listQuickLinks().catch(() => []);
  for (const link of links.filter((l) => l.label.startsWith(prefix))) {
    await api.deleteQuickLink(link._id).catch(() => undefined);
  }
}
