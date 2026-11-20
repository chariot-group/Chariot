import { expect, type Locator, type Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign } from "@/api";
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

/**
 * Ouvre l'espace MJ d'une campagne et renvoie la navigation MJ de la sidebar (ouverte sur mobile).
 * L'espace affiché est mémorisé par compte : s'il était resté en Joueur, on passe par le sélecteur
 * « Espace maître du jeu », qui liste les campagnes.
 */
export async function openCampaignSidebar(page: Page, campaign: CreatedCampaign): Promise<Locator> {
  await page.goto(`/${env.locale}/campaigns/${campaign._id}`);
  await openSidebarIfMobile(page);
  const nav = page.getByRole("navigation", { name: "Navigation maître du jeu" });
  const gmSpace = page.getByRole("button", { name: "Espace maître du jeu" });
  await expect(nav.or(gmSpace).first()).toBeVisible();
  if ((await gmSpace.getAttribute("aria-pressed")) !== "true") {
    await gmSpace.click();
    const spaceMenu = page.getByRole("menu", { name: "Espace maître du jeu" });
    await spaceMenu.getByRole("button", { name: campaign.label, exact: true }).click();
    // Le menu (modal) reste ouvert après le choix et masque le reste de la page aux technologies d'assistance.
    // Sous Firefox / WebKit, un Échap envoyé pendant la navigation vers la campagne peut être perdu : on réessaie.
    await expect(async () => {
      if (await spaceMenu.isVisible()) await page.keyboard.press("Escape");
      await expect(spaceMenu).toBeHidden({ timeout: 1_000 });
    }).toPass();
    await expect(gmSpace).toHaveAttribute("aria-pressed", "true");
  }
  await expect(nav.getByRole("heading", { name: campaign.label })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Créer un groupe" })).toBeVisible();
  return nav;
}

/** En-tête (déclencheur repliable) d'un groupe de la sidebar MJ, par son libellé exact. */
export function groupHeader(nav: Locator, label: string): Locator {
  return nav.getByRole("button", { name: label, exact: true });
}

/**
 * Ouvre le menu d'actions d'un groupe : clic droit sur ordinateur, bouton « Actions sur le groupe »
 * de sa ligne sous 1024 px. Renvoie le menu ouvert (mêmes entrées dans les deux cas).
 */
export async function openGroupActions(page: Page, nav: Locator, label: string): Promise<Locator> {
  if (isBelowTablet(page)) {
    // Ligne du groupe = plus petit bloc qui contient l'en-tête et un bouton d'actions (ordre DOM : le plus profond en dernier).
    const row = nav
      .locator("div")
      // `has` est relatif à chaque bloc : locator construit depuis `page`, pas depuis `nav`.
      .filter({ has: page.getByRole("button", { name: label, exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Actions sur le groupe" }) })
      .last();
    await row.getByRole("button", { name: "Actions sur le groupe" }).click();
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

/** Lance une session depuis la sidebar MJ et renvoie son code OTP (lu sur la réponse API). */
export async function launchSessionFromSidebar(page: Page): Promise<string> {
  const created = page.waitForResponse(
    (res) => res.request().method() === "POST" && /\/session\/sessions\/?$/.test(new URL(res.url()).pathname),
  );
  await openSidebarIfMobile(page);
  await page.getByRole("button", { name: "Lancer une session" }).click();
  const response = await created;
  expect(response.ok(), "création de session").toBeTruthy();
  const body = (await response.json()) as { data: { code: string } };
  return body.data.code;
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
