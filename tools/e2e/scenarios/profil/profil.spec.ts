import { expect, test as base, type Locator, type Page } from "@playwright/test";
import { loginWithCredentials, muteReleaseNotes } from "@/auth";
import { env, testUser } from "@/env";
import { createTemporaryAccount, deleteKeycloakAccount, hasKeycloakAdmin, type TemporaryAccount } from "@/keycloak";

/**
 * Page profil d'un compte connecté.
 * - FR-user-profile-keycloak : lecture et modification (prénom, nom, email) synchronisées avec Keycloak.
 * - FR-profile-gdpr : la suppression de compte est une demande par e-mail (`mailto:`), pas une suppression réelle.
 *
 * Chaque test a son propre compte jetable (créé puis supprimé via l'API admin Keycloak) :
 * modifier le profil ne touche pas les comptes partagés `e2e-gm` / `e2e-player`.
 */
const test = base.extend<{ account: TemporaryAccount }>({
  account: async ({ page, context }, use) => {
    const account = await createTemporaryAccount("profil");
    try {
      await muteReleaseNotes(context);
      await loginWithCredentials(page, account.username, account.password);
      await use(account);
    } finally {
      await deleteKeycloakAccount(account.username);
    }
  },
});

test.skip(!hasKeycloakAdmin(), "KEYCLOAK_ADMIN_* requis pour créer les comptes jetables");

async function openProfile(page: Page): Promise<void> {
  await page.goto(`/${env.locale}/profile`);
  await expect(page.getByLabel("Username")).toBeVisible();
}

async function startEditing(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Mettre à jour le profil" }).click();
  const form = page.getByRole("form", { name: "Formulaire de modification du profil" });
  await expect(form).toBeVisible();
  return form;
}

async function expectReadProfile(page: Page, identity: { firstName: string; lastName: string; email: string }) {
  await expect(page.getByLabel("Full name")).toHaveText(`${identity.firstName} ${identity.lastName}`);
  await expect(page.getByLabel("Email address")).toHaveText(identity.email);
}

/** Compte les `PUT /user/me` envoyés par la page : aucun ne doit partir quand la saisie est refusée. */
function countProfileUpdates(page: Page): () => number {
  let count = 0;
  page.on("request", (request) => {
    if (request.method() === "PUT" && /\/user\/me\/?$/.test(new URL(request.url()).pathname)) count += 1;
  });
  return () => count;
}

test.describe("Profil", () => {
  test("le profil affiche les informations du compte", async ({ page, account }) => {
    await openProfile(page);

    await expect(page.getByLabel("Username")).toHaveText(account.username);
    await expectReadProfile(page, account);
  });

  test("modifier prénom, nom et email les enregistre", async ({ page, account }) => {
    const updated = {
      firstName: "Prénommodifié",
      lastName: "Nommodifié",
      email: account.email.replace("@", "+modifie@"),
    };
    await openProfile(page);

    await test.step("saisir les nouvelles valeurs et enregistrer", async () => {
      const form = await startEditing(page);
      await form.getByLabel("Prénom", { exact: true }).fill(updated.firstName);
      await form.getByLabel("Nom", { exact: true }).fill(updated.lastName);
      await form.getByLabel("Email", { exact: true }).fill(updated.email);
      await form.getByRole("button", { name: "Mettre à jour le profil" }).click();

      await expect(page.getByText("Profil mis à jour avec succès")).toBeVisible();
      await expect(form).toBeHidden();
      await expectReadProfile(page, updated);
    });

    await test.step("retrouver les valeurs après rechargement", async () => {
      await page.reload();
      await expectReadProfile(page, updated);
      await expect(page.getByLabel("Username")).toHaveText(account.username);
    });
  });

  test("annuler la modification restaure les valeurs", async ({ page, account }) => {
    const updates = countProfileUpdates(page);
    await openProfile(page);

    const form = await startEditing(page);
    await form.getByLabel("Prénom", { exact: true }).fill("Jamaisenregistré");
    await form.getByRole("button", { name: "Annuler" }).click();

    await expect(form).toBeHidden();
    await expectReadProfile(page, account);
    expect(updates(), "aucune requête de mise à jour").toBe(0);
  });

  test("une saisie invalide affiche les erreurs et n'enregistre rien", async ({ page, account }) => {
    const updates = countProfileUpdates(page);
    await openProfile(page);

    const form = await startEditing(page);
    const firstName = form.getByLabel("Prénom", { exact: true });
    const email = form.getByLabel("Email", { exact: true });
    await firstName.fill("A");
    // Accepté par la validation native `type=email`, refusé par le schéma Zod (pas de domaine).
    await email.fill("e2e@invalide");
    await form.getByRole("button", { name: "Mettre à jour le profil" }).click();

    await expect(firstName).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator("#firstName-error")).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator("#email-error")).toHaveText("Email invalide");
    expect(updates(), "aucune requête de mise à jour").toBe(0);

    await page.reload();
    await expectReadProfile(page, account);
  });

  test("un email déjà utilisé par un autre compte est refusé", async ({ page, account }) => {
    // Email d'un compte joueur partagé, créé par auth.setup.ts (lu seulement, jamais modifié).
    const takenEmail = testUser("player", 0).email;
    await openProfile(page);

    const form = await startEditing(page);
    const email = form.getByLabel("Email", { exact: true });
    await email.fill(takenEmail);
    await form.getByRole("button", { name: "Mettre à jour le profil" }).click();

    await expect(form.getByText("Cette adresse email est déjà utilisée par un autre compte")).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");

    await page.reload();
    await expectReadProfile(page, account);
  });
});

test.describe("Suppression de compte", () => {
  test("la demande de suppression passe par une confirmation puis un e-mail", async ({ page, account }) => {
    // Le clic programmatique sur le lien `mailto:` est intercepté : aucun client mail ne s'ouvre.
    await page.addInitScript(() => {
      const captured: string[] = [];
      (window as unknown as { __mailtoHrefs: string[] }).__mailtoHrefs = captured;
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.href.startsWith("mailto:")) {
          captured.push(this.href);
          return;
        }
        originalClick.call(this);
      };
    });
    const capturedMailtos = () => page.evaluate(() => (window as unknown as { __mailtoHrefs: string[] }).__mailtoHrefs);

    await openProfile(page);
    const trigger = page.getByRole("button", { name: "Demander la suppression de mon compte" });
    const dialog = page.getByRole("dialog", { name: "Confirmer la suppression" });

    await test.step("annuler ferme la fenêtre sans rien envoyer", async () => {
      await trigger.click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("Cette opération est irréversible.");
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();
      expect(await capturedMailtos()).toEqual([]);
    });

    await test.step("confirmer ouvre un e-mail de demande au contact vie privée", async () => {
      await trigger.click();
      await dialog.getByRole("button", { name: "Confirmer la demande" }).click();
      await expect(dialog).toBeHidden();

      const mailtos = await capturedMailtos();
      expect(mailtos).toHaveLength(1);
      const mailto = decodeURIComponent(mailtos[0]);
      expect(mailto).toMatch(/^mailto:[^?\s]+@[^?\s]+\?subject=/);
      expect(mailto).toContain(account.email);

      const keycloakId = await page.evaluate(() => localStorage.getItem("chariot_user_id"));
      expect(keycloakId, "identifiant interne connu de l'app").toBeTruthy();
      expect(mailto, "aucun identifiant interne dans l'e-mail").not.toContain(keycloakId!);
    });

    await test.step("le compte reste utilisable", async () => {
      await page.reload();
      await expect(page.getByLabel("Username")).toHaveText(account.username);
    });
  });
});
