import { readFile } from "node:fs/promises";
import { expect, test as base, type Locator, type Page, type Request } from "@playwright/test";
import { loginWithCredentials, muteReleaseNotes } from "@/auth";
import { env, testUser } from "@/env";
import { createTemporaryAccount, deleteKeycloakAccount, hasKeycloakAdmin, type TemporaryAccount } from "@/keycloak";

/**
 * Page profil d'un compte connecté.
 * - FR-user-profile-keycloak : lecture et modification (prénom, nom, email) synchronisées avec Keycloak.
 * - FR-profile-gdpr : export JSON du profil (relu depuis l'API, sans identifiant interne), demande de toutes
 *   les données et suppression de compte par e-mail (`mailto:`), pas de suppression réelle.
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

/**
 * Ouvre la page profil et attend la fin de son rafraîchissement d'ouverture.
 * La page affiche d'abord l'utilisateur persisté, puis relance toujours un `GET /user/me`
 * (refresh on open), parfois plusieurs secondes plus tard sous charge. Le client API dédoublonne
 * les GET en vol : un export lancé pendant ce rafraîchissement le réutiliserait au lieu d'en émettre un.
 */
async function openProfile(page: Page): Promise<void> {
  const refreshedOnOpen = page.waitForResponse((response) => isCurrentUserFetch(response.request()));
  await page.goto(`/${env.locale}/profile`);
  await expect(page.getByLabel("Username")).toBeVisible();
  await refreshedOnOpen;
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

/**
 * Intercepte les clics programmatiques sur les liens `mailto:` (aucun client mail ne s'ouvre)
 * et renvoie une fonction qui lit les liens capturés, décodés.
 */
async function captureMailtos(page: Page): Promise<() => Promise<string[]>> {
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
  return async () => {
    const hrefs = await page.evaluate(() => (window as unknown as { __mailtoHrefs: string[] }).__mailtoHrefs);
    return hrefs.map((href) => decodeURIComponent(href));
  };
}

/** Identifiant Keycloak du compte connecté, tel que l'app le connaît (ne doit jamais sortir de l'app). */
async function readKeycloakId(page: Page): Promise<string> {
  const keycloakId = await page.evaluate(() => localStorage.getItem("chariot_user_id"));
  expect(keycloakId, "identifiant interne connu de l'app").toBeTruthy();
  return keycloakId!;
}

/** Identifiants d'authentification internes interdits dans les fichiers et e-mails (FR-profile-gdpr). */
const INTERNAL_AUTH_KEYS = ["keycloakId", "createdBy", "userId"];

/** Chemins (`a.b[0].c`) de toutes les clés internes trouvées, à n'importe quelle profondeur. */
function findInternalAuthKeys(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => findInternalAuthKeys(item, `${path}[${index}]`));
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(INTERNAL_AUTH_KEYS.includes(key) ? [`${path}.${key}`] : []),
    ...findInternalAuthKeys(child, `${path}.${key}`),
  ]);
}

/** Requête `GET /user/me` (rafraîchissement d'ouverture du profil ou export). */
function isCurrentUserFetch(request: Request): boolean {
  return request.method() === "GET" && /\/user\/me\/?$/.test(new URL(request.url()).pathname);
}

/** Date du jour (UTC) au format du nom de fichier d'export, `AAAA-MM-JJ`. */
const utcDay = (date: Date) => date.toISOString().slice(0, 10);

test.describe("Données personnelles", () => {
  const exportButton = (page: Page) =>
    page.getByRole("button", { name: "Télécharger une copie de mes données de profil" });

  test("l'export télécharge un JSON du profil, à jour et sans identifiant interne", async ({ page, account }) => {
    await openProfile(page);
    const keycloakId = await readKeycloakId(page);

    const startedAt = new Date();
    const freshFetch = page.waitForRequest(isCurrentUserFetch);
    const downloadEvent = page.waitForEvent("download");
    await exportButton(page).click();

    await test.step("les données sont relues depuis l'API, pas depuis le cache", async () => {
      await freshFetch;
    });

    const download = await downloadEvent;
    const fileName = download.suggestedFilename();
    const file = JSON.parse(await readFile(await download.path(), "utf8")) as {
      exportedAt: string;
      profile: Record<string, unknown>;
    };

    await test.step("le fichier est nommé chariot-profile-AAAA-MM-JJ.json", async () => {
      // Deux dates acceptées si le test passe minuit (UTC).
      const days = new Set([utcDay(startedAt), utcDay(new Date())]);
      expect([...days].map((day) => `chariot-profile-${day}.json`)).toContain(fileName);
    });

    await test.step("le fichier contient le profil du compte", async () => {
      expect(new Date(file.exportedAt).toISOString()).toBe(file.exportedAt);
      expect(file.profile).toMatchObject({
        username: account.username,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
      });
      await expect(page.getByText("Vos données de profil ont été téléchargées.")).toBeVisible();
    });

    await test.step("aucun identifiant interne, à aucun niveau", async () => {
      expect(findInternalAuthKeys(file), "clés internes présentes").toEqual([]);
      expect(JSON.stringify(file), "identifiant Keycloak présent").not.toContain(keycloakId);
    });
  });

  test("un échec de l'API affiche une erreur et ne télécharge rien", async ({ page, account }) => {
    await openProfile(page);
    await expect(page.getByLabel("Username")).toHaveText(account.username);
    const button = exportButton(page);
    await expect(button).toBeEnabled();

    // Après le rafraîchissement d'ouverture (cf. `openProfile`) : seul l'appel de l'export échoue.
    let releaseResponse!: () => void;
    const responseHeld = new Promise<void>((resolve) => (releaseResponse = resolve));
    await page.route(
      (url) => /\/user\/me\/?$/.test(url.pathname),
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await responseHeld;
        await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"e2e"}' });
      },
    );
    let downloads = 0;
    page.on("download", () => (downloads += 1));

    await button.click();

    await test.step("le bouton signale l'export en cours", async () => {
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toBeDisabled();
      await expect(button).toHaveText("Export en cours…");
    });

    await test.step("l'erreur est annoncée et le bouton redevient utilisable", async () => {
      releaseResponse();
      await expect(page.getByText("Impossible d'exporter vos données de profil. Veuillez réessayer.")).toBeVisible();
      await expect(button).toHaveAttribute("aria-busy", "false");
      await expect(button).toBeEnabled();
      await expect(button).toHaveText("Télécharger");
      expect(downloads, "aucun fichier téléchargé").toBe(0);
    });
  });

  test("la demande de toutes les données ouvre un e-mail au contact vie privée", async ({ page, account }) => {
    const capturedMailtos = await captureMailtos(page);
    await openProfile(page);
    const keycloakId = await readKeycloakId(page);

    await page
      .getByRole("button", { name: "Demander par e-mail l'accès à l'ensemble de mes données personnelles" })
      .click();

    await expect.poll(capturedMailtos).toHaveLength(1);
    const [mailto] = await capturedMailtos();
    expect(mailto).toMatch(/^mailto:[^?\s]+@[^?\s]+\?subject=/);
    expect(mailto).toContain(account.email);
    expect(mailto).toContain(account.username);
    expect(mailto, "aucun identifiant interne dans l'e-mail").not.toContain(keycloakId);
  });
});

test.describe("Suppression de compte", () => {
  test("la demande de suppression passe par une confirmation puis un e-mail", async ({ page, account }) => {
    const capturedMailtos = await captureMailtos(page);

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
      const [mailto] = mailtos;
      expect(mailto).toMatch(/^mailto:[^?\s]+@[^?\s]+\?subject=/);
      expect(mailto).toContain(account.email);
      expect(mailto, "aucun identifiant interne dans l'e-mail").not.toContain(await readKeycloakId(page));
    });

    await test.step("le compte reste utilisable", async () => {
      await page.reload();
      await expect(page.getByLabel("Username")).toHaveText(account.username);
    });
  });
});
