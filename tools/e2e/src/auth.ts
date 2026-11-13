import type { Page } from "@playwright/test";
import { env, type Role } from "@/env";

/**
 * Connexion via le vrai formulaire Keycloak (thème Chariot).
 * L'app est en `login-required` : toute page protégée redirige vers le SSO.
 * On part de la racine locale (`/fr`) : c'est le seul point d'entrée où
 * FR-post-auth-navigation choisit la page d'atterrissage (cf. shouldRedirectAfterLogin).
 */
export async function loginThroughKeycloak(page: Page, role: Role): Promise<void> {
  await page.goto(`/${env.locale}`);
  await page.waitForURL((url) => url.href.startsWith(env.keycloakUrl), { timeout: 30_000 });

  await page.locator("#username").fill(env.users[role].username);
  await page.locator("#password").fill(env.password);
  await page.locator("#kc-login").click();

  await page.waitForURL((url) => url.href.startsWith(env.webUrl), { timeout: 30_000 });
}
