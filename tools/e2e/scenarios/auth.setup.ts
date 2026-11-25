import { test as setup } from "@playwright/test";
import { loginThroughKeycloak } from "@/auth";
import { accountSlots, storageStatePath, testUser, type Role } from "@/env";
import { ensureTestUser } from "@/keycloak";

/**
 * Une paire de comptes MJ / joueur par worker (`accountSlots`) : chaque compte est provisionné
 * puis connecté une fois, et sa session SSO enregistrée dans `.auth/<role>-<slot>.json`.
 * Les tests sont indépendants : ils se répartissent sur les workers.
 */
for (const slot of accountSlots) {
  for (const role of ["gm", "player"] as Role[]) {
    setup(`enregistrer la session SSO (${testUser(role, slot).username})`, async ({ page }) => {
      await ensureTestUser(role, slot);
      await loginThroughKeycloak(page, role, slot);

      // FR-release-notes : la modale « Nouveautés » recouvre l'app à chaque nouvelle version.
      // On la coupe pour les comptes de test (même clé que l'option « ne plus afficher »).
      await page.waitForFunction(() => !!localStorage.getItem("chariot_user_id"));
      await page.evaluate(() => {
        const userId = localStorage.getItem("chariot_user_id");
        localStorage.setItem(`chariot_release_notes_muted_${userId}`, "true");
        localStorage.setItem("chariot_release_notes_muted", "true");
      });

      // L'état Redux persisté garde l'heure du dernier chargement de « Vos personnages », et l'app ne le recharge pas
      // dans les 3 s qui suivent (anti-boucle de `usePlayersWithoutGroup`), sans réessayer ensuite. Enregistrée
      // trop tôt, la session ferait démarrer le premier scénario du worker avec une liste vide figée : on laisse passer ce délai.
      await page.waitForTimeout(3_500);
      await page.context().storageState({ path: storageStatePath(role, slot) });
    });
  }
}
