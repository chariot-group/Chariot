import { expect, type Page } from "@playwright/test";
import type { ChariotApi } from "@/api";
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

/** Lance une session depuis la sidebar MJ et renvoie son code OTP (lu sur la réponse API). */
export async function launchSessionFromSidebar(page: Page): Promise<string> {
  const created = page.waitForResponse(
    (res) => res.request().method() === "POST" && /\/session\/sessions\/?$/.test(new URL(res.url()).pathname),
  );
  await page.getByRole("button", { name: "Lancer une session" }).click();
  const response = await created;
  expect(response.ok(), "création de session").toBeTruthy();
  const body = (await response.json()) as { data: { code: string } };
  return body.data.code;
}

/** Nettoie les campagnes créées par un scénario (repérées par leur libellé unique). */
export async function deleteCampaignsByLabel(api: ChariotApi, label: string): Promise<void> {
  const campaigns = await api.listCampaigns();
  for (const campaign of campaigns.filter((c) => c.label === label)) {
    await api.deleteCampaign(campaign._id);
  }
}
