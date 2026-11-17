import { expect, test, type Page } from "@playwright/test";
import { muteReleaseNotes, waitForPostLoginLanding } from "@/auth";
import { env, testUser } from "@/env";
import { deleteKeycloakAccount, hasKeycloakAdmin, temporaryAccountData, type TemporaryAccount } from "@/keycloak";

/**
 * Création de compte via la page d'inscription Keycloak (thème Chariot, `registrationAllowed`).
 * - FR-post-auth-navigation : un compte neuf, sans personnage, atterrit sur `/welcome`.
 * - FR-user-profile-keycloak : le profil affiche ensuite les informations saisies.
 * Contexte vierge (pas de storageState). Les champs Keycloak sont visés par `id` :
 * le thème n'a pas de `<label>`, seulement des placeholders traduits.
 */

async function openRegistrationPage(page: Page): Promise<void> {
  await page.goto(`/${env.locale}`);
  await page.waitForURL((url) => url.href.startsWith(env.keycloakUrl), { timeout: 30_000 });
  await page.locator("#kc-registration a").click();
  await expect(page.locator("#password-confirm")).toBeVisible();
}

async function fillRegistrationForm(page: Page, account: TemporaryAccount): Promise<void> {
  await page.locator("#username").fill(account.username);
  await page.locator("#firstName").fill(account.firstName);
  await page.locator("#lastName").fill(account.lastName);
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.locator("#password-confirm").fill(account.password);
  await page.locator("#kc-form-card input[type=submit]").click();
}

test.describe("Inscription", () => {
  test("un visiteur crée son compte et arrive sur l'accueil", async ({ page, context }) => {
    test.skip(!hasKeycloakAdmin(), "KEYCLOAK_ADMIN_* requis pour supprimer le compte créé");
    const account = temporaryAccountData("inscription");
    await muteReleaseNotes(context);

    try {
      await test.step("ouvrir la page d'inscription depuis le login", async () => {
        await openRegistrationPage(page);
      });

      await test.step("remplir et envoyer le formulaire", async () => {
        await fillRegistrationForm(page, account);
      });

      await test.step("arriver sur l'accueil (aucun personnage)", async () => {
        await waitForPostLoginLanding(page);
        await expect(page).toHaveURL(new RegExp(`/${env.locale}/welcome`));
      });

      await test.step("retrouver ses informations sur le profil", async () => {
        await page.goto(`/${env.locale}/profile`);
        await expect(page.getByLabel("Username")).toHaveText(account.username);
        await expect(page.getByLabel("Full name")).toHaveText(`${account.firstName} ${account.lastName}`);
        await expect(page.getByLabel("Email address")).toHaveText(account.email);
      });
    } finally {
      await deleteKeycloakAccount(account.username);
    }
  });

  test("un identifiant déjà pris reste sur Keycloak avec une erreur", async ({ page }) => {
    const account = { ...temporaryAccountData("doublon"), username: testUser("player", 0).username };

    await openRegistrationPage(page);
    await fillRegistrationForm(page, account);

    await expect(page).toHaveURL((url) => url.href.startsWith(env.keycloakUrl));
    await expect(page.locator("#input-error-username")).toBeVisible();
    await expect(page.locator("#username")).toHaveAttribute("aria-invalid", "true");
  });
});
