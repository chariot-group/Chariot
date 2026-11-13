import { test as setup } from "@playwright/test";
import { loginThroughKeycloak } from "@/auth";
import { storageStatePath, type Role } from "@/env";
import { ensureTestUsers } from "@/keycloak";

setup("provisionner les comptes de test", async () => {
  await ensureTestUsers();
});

for (const role of ["gm", "player"] as Role[]) {
  setup(`enregistrer la session SSO (${role})`, async ({ page }) => {
    await loginThroughKeycloak(page, role);

    // FR-release-notes : la modale « Nouveautés » recouvre l'app à chaque nouvelle version.
    // On la coupe pour les comptes de test (même clé que l'option « ne plus afficher »).
    await page.waitForFunction(() => !!localStorage.getItem("chariot_user_id"));
    await page.evaluate(() => {
      const userId = localStorage.getItem("chariot_user_id");
      localStorage.setItem(`chariot_release_notes_muted_${userId}`, "true");
      localStorage.setItem("chariot_release_notes_muted", "true");
    });

    await page.context().storageState({ path: storageStatePath(role) });
  });
}
