import type { BrowserContext, Page } from "@playwright/test";
import { env, testUser, type Role } from "@/env";

/**
 * Connexion via le vrai formulaire Keycloak (thème Chariot).
 * L'app est en `login-required` : toute page protégée redirige vers le SSO.
 * On part de la racine locale (`/fr`) : c'est le seul point d'entrée où
 * FR-post-auth-navigation choisit la page d'atterrissage (cf. shouldRedirectAfterLogin).
 */
export async function loginThroughKeycloak(page: Page, role: Role, slot: number): Promise<void> {
  await loginWithCredentials(page, testUser(role, slot).username, env.password);
}

/** Même parcours que `loginThroughKeycloak`, pour un compte quelconque (ex. compte jetable). */
export async function loginWithCredentials(page: Page, username: string, password: string): Promise<void> {
  await page.goto(`/${env.locale}`);
  await page.waitForURL((url) => url.href.startsWith(env.keycloakUrl), { timeout: 30_000 });

  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();

  await waitForPostLoginLanding(page);
}

/**
 * Attend la page d'atterrissage choisie par FR-post-auth-navigation (fiche, campagne ou accueil).
 * Le retour du SSO (`/fr#state=…&code=…`) déclenche encore une navigation : un `page.goto`
 * lancé avant serait interrompu (constaté sur WebKit mobile).
 */
export async function waitForPostLoginLanding(page: Page): Promise<void> {
  await page.waitForURL(
    (url) => url.href.startsWith(env.webUrl) && /\/(characters|campaigns|welcome)(\/|$|\?)/.test(url.pathname),
    { timeout: 30_000 },
  );
}

/**
 * FR-release-notes : la modale « Nouveautés » recouvre l'app au premier passage d'un compte.
 * Pour un compte créé pendant le scénario, l'identifiant n'est connu qu'après connexion :
 * on coupe la modale dès que l'app enregistre `chariot_user_id` (même clé que « ne plus afficher »).
 */
export async function muteReleaseNotes(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const USER_ID_KEY = "chariot_user_id";
    const MUTED_KEY = "chariot_release_notes_muted";
    try {
      const storage = window.localStorage;
      const originalSetItem = Storage.prototype.setItem;
      const mute = (userId: string | null) => {
        originalSetItem.call(storage, MUTED_KEY, "true");
        if (userId) originalSetItem.call(storage, `${MUTED_KEY}_${userId}`, "true");
      };
      mute(storage.getItem(USER_ID_KEY));
      Storage.prototype.setItem = function (key: string, value: string) {
        originalSetItem.call(this, key, value);
        if (this === storage && key === USER_ID_KEY) mute(value);
      };
    } catch {
      // localStorage indisponible : la modale sera fermée par le scénario si besoin.
    }
  });
}
