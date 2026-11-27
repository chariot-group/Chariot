import { expect, test } from "@playwright/test";
import { ChariotApi } from "@/api";
import { loginThroughKeycloak } from "@/auth";
import { accountSlot, env, testUser, uniqueLabel } from "@/env";

/**
 * FR-post-auth-navigation — priorité 1 : un joueur qui possède un personnage
 * sans groupe atterrit sur la fiche de ce personnage après connexion.
 * Contexte vierge (pas de storageState) : on passe par le vrai formulaire Keycloak.
 */
test.describe("Connexion", () => {
  test("un joueur avec un personnage sans groupe arrive sur sa fiche", async ({ page }, testInfo) => {
    const slot = accountSlot(testInfo.parallelIndex);
    const api = await ChariotApi.as("player", slot);
    const character = await api.createPlayer(uniqueLabel("Connexion"));

    try {
      await test.step("se connecter via Keycloak", async () => {
        await loginThroughKeycloak(page, "player", slot);
      });

      await test.step("être redirigé vers une fiche personnage", async () => {
        await expect(page).toHaveURL(new RegExp(`/${env.locale}/characters/[^/?]+`), { timeout: 30_000 });
      });
    } finally {
      await api.deleteCharacter(character._id);
    }
  });

  test("un identifiant invalide reste sur Keycloak avec une erreur", async ({ page }, testInfo) => {
    await page.goto(`/${env.locale}/welcome`);
    await page.waitForURL((url) => url.href.startsWith(env.keycloakUrl));

    await page.locator("#username").fill(testUser("player", accountSlot(testInfo.parallelIndex)).username);
    await page.locator("#password").fill("mauvais-mot-de-passe");
    await page.locator("#kc-login").click();

    await expect(page).toHaveURL((url) => url.href.startsWith(env.keycloakUrl));
    await expect(page.locator("#password")).toBeVisible();
  });
});
