import { readFile } from "node:fs/promises";
import { expect, test as base, type Locator, type Page, type Request, type Response } from "@playwright/test";
import { loginWithCredentials, muteReleaseNotes } from "@/auth";
import { env, testUser } from "@/env";
import {
  acceptsPassword,
  createTemporaryAccount,
  deleteKeycloakAccount,
  hasKeycloakAdmin,
  type TemporaryAccount,
} from "@/keycloak";

/**
 * Page profil d'un compte connecté.
 * - FR-user-profile-keycloak : lecture et modification (prénom, nom, email) synchronisées avec Keycloak.
 * - FR-profile-gdpr : export JSON du profil (relu depuis l'API, sans identifiant interne), demande de toutes
 *   les données et suppression de compte par e-mail (`mailto:`), pas de suppression réelle.
 * - FR-user-password-change : changement de mot de passe (vérifié côté Keycloak), erreurs serveur et validation.
 * - FR-profile-language-preference, FR-measurement-units, FR-release-notes : section Préférences
 *   (langue, unités, double affichage des unités, nouveautés).
 *
 * Chaque test a son propre compte jetable (créé puis supprimé via l'API admin Keycloak) :
 * modifier le profil ne touche pas les comptes partagés `e2e-gm` / `e2e-player`.
 */
const test = base.extend<{ account: TemporaryAccount; muteNotes: boolean }>({
  /** `false` : la modale « Nouveautés » garde son comportement réel (scénarios FR-release-notes). */
  muteNotes: [true, { option: true }],
  // `auto` : chaque test est connecté, même s'il ne lit pas `account`.
  account: [
    async ({ page, context, muteNotes }, use) => {
      const account = await createTemporaryAccount("profil");
      try {
        if (muteNotes) await muteReleaseNotes(context);
        await loginWithCredentials(page, account.username, account.password);
        await use(account);
      } finally {
        await deleteKeycloakAccount(account.username);
      }
    },
    { auto: true },
  ],
});

test.skip(!hasKeycloakAdmin(), "KEYCLOAK_ADMIN_* requis pour créer les comptes jetables");

/**
 * Ouvre la page profil et attend la fin de son rafraîchissement d'ouverture.
 * La page affiche d'abord l'utilisateur persisté, puis relance toujours un `GET /user/me`
 * (refresh on open), parfois plusieurs secondes plus tard sous charge. Le client API dédoublonne
 * les GET en vol : un export lancé pendant ce rafraîchissement le réutiliserait au lieu d'en émettre un.
 *
 * Chaque chargement refait aussi l'aller-retour SSO (redirection Keycloak puis échange du code, qui recharge
 * la page). Sous WebKit, sur un environnement hébergé, l'utilisateur persisté s'affiche avant cette redirection :
 * on attend donc le `GET /user/me` qui suit l'échange du code, pas le premier venu.
 */
async function openProfile(page: Page): Promise<void> {
  let codeExchanged = false;
  let refreshedAfterSso = false;
  const onResponse = (response: Response) => {
    if (isTokenExchange(response.request())) codeExchanged = true;
    else if (codeExchanged && isCurrentUserFetch(response.request())) refreshedAfterSso = true;
  };
  page.on("response", onResponse);
  try {
    await page.goto(`/${env.locale}/profile`);
    await expect
      .poll(() => refreshedAfterSso, { message: "profil rafraîchi après l'échange du code SSO", timeout: 30_000 })
      .toBe(true);
    await expect(page.getByLabel("Username")).toBeVisible();
  } finally {
    page.off("response", onResponse);
  }
}

/** Échange du code d'autorisation contre un token (fin de l'aller-retour SSO d'un chargement de page). */
function isTokenExchange(request: Request): boolean {
  return request.method() === "POST" && /\/protocol\/openid-connect\/token$/.test(new URL(request.url()).pathname);
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

    // Seul l'appel de l'export échoue : l'interception n'est armée qu'au clic. Sur un environnement hébergé,
    // le profil peut se recharger une seconde fois après `openProfile` (second rafraîchissement du token) :
    // intercepter ce rechargement-là laisserait passer l'export, qui réussirait.
    let armed = false;
    let releaseResponse!: () => void;
    const responseHeld = new Promise<void>((resolve) => (releaseResponse = resolve));
    await page.route(
      (url) => /\/user\/me\/?$/.test(url.pathname),
      async (route) => {
        if (!armed || route.request().method() !== "GET") return route.fallback();
        await responseHeld;
        await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"e2e"}' });
      },
    );
    let downloads = 0;
    page.on("download", () => (downloads += 1));

    armed = true;
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

/** Requête `PUT /users/me/password` envoyée par le formulaire de changement de mot de passe. */
function isPasswordChange(request: Request): boolean {
  return request.method() === "PUT" && /\/me\/password\/?$/.test(new URL(request.url()).pathname);
}

/** Nouveau mot de passe valide (≥ 8 caractères, mêmes classes de caractères que le mot de passe de test). */
const NEW_PASSWORD = "e2e-Nouveau-mdp-2!";

test.describe("Changement de mot de passe", () => {
  const passwordForm = (page: Page) => page.getByRole("form", { name: "Changer de mot de passe" });
  const submitButton = (page: Page) => page.getByRole("button", { name: "Modifier le mot de passe" });

  /** Remplit les trois champs ; `confirm` vaut le nouveau mot de passe par défaut. */
  async function fillPasswordForm(
    page: Page,
    values: { current: string; next: string; confirm?: string },
  ): Promise<Locator> {
    const form = passwordForm(page);
    await form.getByLabel("Mot de passe actuel", { exact: true }).fill(values.current);
    await form.getByLabel("Nouveau mot de passe", { exact: true }).fill(values.next);
    await form.getByLabel("Confirmer le nouveau mot de passe", { exact: true }).fill(values.confirm ?? values.next);
    return form;
  }

  /** Compte les `PUT /users/me/password` : aucun ne doit partir quand la saisie est refusée côté client. */
  function countPasswordChanges(page: Page): () => number {
    let count = 0;
    page.on("request", (request) => {
      if (isPasswordChange(request)) count += 1;
    });
    return () => count;
  }

  test("changer le mot de passe permet de se reconnecter avec le nouveau", async ({ page, account, browser }) => {
    await openProfile(page);

    await test.step("saisir et enregistrer le nouveau mot de passe", async () => {
      const form = await fillPasswordForm(page, { current: account.password, next: NEW_PASSWORD });
      const changed = page.waitForResponse((response) => isPasswordChange(response.request()));
      await submitButton(page).click();
      expect((await changed).ok(), "PUT /users/me/password réussi").toBe(true);

      await expect(page.getByText("Mot de passe modifié avec succès")).toBeVisible();
      for (const label of ["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le nouveau mot de passe"]) {
        await expect(form.getByLabel(label, { exact: true }), `${label} vidé`).toHaveValue("");
      }
    });

    await test.step("l'utilisateur reste connecté", async () => {
      await page.reload();
      await expect(page.getByLabel("Username")).toHaveText(account.username);
    });

    await test.step("aucun mot de passe dans le stockage du navigateur ni dans l'URL", async () => {
      const stored = await page.evaluate(() =>
        JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]),
      );
      for (const password of [account.password, NEW_PASSWORD]) {
        expect(stored, "mot de passe stocké côté client").not.toContain(password);
        expect(page.url()).not.toContain(encodeURIComponent(password));
      }
    });

    await test.step("Keycloak accepte le nouveau mot de passe et refuse l'ancien", async () => {
      expect(await acceptsPassword(account.username, NEW_PASSWORD), "nouveau mot de passe").toBe(true);
      expect(await acceptsPassword(account.username, account.password), "ancien mot de passe").toBe(false);
    });

    await test.step("se reconnecter via le formulaire SSO avec le nouveau mot de passe", async () => {
      const context = await browser.newContext();
      try {
        await muteReleaseNotes(context);
        const freshPage = await context.newPage();
        await loginWithCredentials(freshPage, account.username, NEW_PASSWORD);
        await openProfile(freshPage);
        await expect(freshPage.getByLabel("Username")).toHaveText(account.username);
      } finally {
        await context.close();
      }
    });
  });

  test("un mot de passe actuel incorrect est refusé sur le champ", async ({ page, account }) => {
    const changes = countPasswordChanges(page);
    await openProfile(page);

    const form = await fillPasswordForm(page, { current: "e2e-Pas-le-bon-1!", next: NEW_PASSWORD });
    await submitButton(page).click();

    const current = form.getByLabel("Mot de passe actuel", { exact: true });
    await expect(form.locator("#currentPassword-error")).toHaveText("Le mot de passe actuel est incorrect");
    await expect(current).toHaveAttribute("aria-invalid", "true");
    await expect(submitButton(page)).toBeEnabled();
    // Un 401 rejoué par l'intercepteur (rafraîchissement du token) compterait deux échecs en moins
    // d'une seconde : l'anti brute-force Keycloak (`quickLoginCheckMilliSeconds`) verrouillerait le compte.
    expect(changes(), "une seule vérification du mot de passe actuel").toBe(1);
    expect(await acceptsPassword(account.username, account.password), "mot de passe inchangé").toBe(true);
    await page.reload();
    await expect(page.getByLabel("Username")).toHaveText(account.username);
  });

  test("une saisie invalide affiche les erreurs et n'envoie rien", async ({ page, account }) => {
    const changes = countPasswordChanges(page);
    await openProfile(page);
    const form = passwordForm(page);
    const current = form.getByLabel("Mot de passe actuel", { exact: true });
    const next = form.getByLabel("Nouveau mot de passe", { exact: true });
    const confirm = form.getByLabel("Confirmer le nouveau mot de passe", { exact: true });

    await test.step("champs vides", async () => {
      await submitButton(page).click();
      for (const field of [current, next, confirm]) {
        await expect(field).toHaveAttribute("aria-invalid", "true");
      }
      await expect(form.locator("#currentPassword-error")).toBeVisible();
    });

    await test.step("nouveau mot de passe de moins de 8 caractères", async () => {
      await fillPasswordForm(page, { current: account.password, next: "Court1!" });
      await submitButton(page).click();
      await expect(next).toHaveAttribute("aria-invalid", "true");
      await expect(next).toHaveAttribute("aria-describedby", "newPassword-error");
      await expect(form.locator("#newPassword-error")).toContainText("8");
    });

    await test.step("confirmation différente", async () => {
      await fillPasswordForm(page, { current: account.password, next: NEW_PASSWORD, confirm: `${NEW_PASSWORD}x` });
      await submitButton(page).click();
      await expect(form.locator("#confirmNewPassword-error")).toHaveText("Les mots de passe ne correspondent pas");
      await expect(confirm).toHaveAttribute("aria-invalid", "true");
      await expect(next).toHaveAttribute("aria-invalid", "false");
    });

    expect(changes(), "aucune requête de changement de mot de passe").toBe(0);
    expect(await acceptsPassword(account.username, account.password), "mot de passe inchangé").toBe(true);
  });

  test("un nouveau mot de passe refusé par la politique est signalé sur le champ", async ({ page, account }) => {
    await openProfile(page);
    // Pas de politique de complexité dans le realm local : on simule la réponse 403 de l'API.
    let releaseResponse!: () => void;
    const responseHeld = new Promise<void>((resolve) => (releaseResponse = resolve));
    await page.route(
      (url) => /\/me\/password\/?$/.test(url.pathname),
      async (route) => {
        if (route.request().method() !== "PUT") return route.fallback();
        await responseHeld;
        await route.fulfill({
          status: 403,
          contentType: "application/problem+json",
          body: JSON.stringify({ status: 403, detail: "New password does not meet complexity requirements" }),
        });
      },
    );

    const form = await fillPasswordForm(page, { current: account.password, next: NEW_PASSWORD });
    const button = submitButton(page);
    await button.click();

    await test.step("le bouton signale l'envoi en cours", async () => {
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toBeDisabled();
    });

    await test.step("l'erreur de complexité est annoncée sur le nouveau mot de passe", async () => {
      releaseResponse();
      await expect(form.locator("#newPassword-error")).toHaveText(
        "Le nouveau mot de passe ne respecte pas les exigences de complexité",
      );
      await expect(form.getByLabel("Nouveau mot de passe", { exact: true })).toHaveAttribute("aria-invalid", "true");
      await expect(button).toHaveAttribute("aria-busy", "false");
      await expect(button).toBeEnabled();
    });

    expect(await acceptsPassword(account.username, account.password), "mot de passe inchangé").toBe(true);
  });

  test("les boutons afficher / masquer basculent la visibilité des nouveaux mots de passe", async ({
    page,
    account,
  }) => {
    await openProfile(page);
    await expect(page.getByLabel("Username")).toHaveText(account.username);
    const form = passwordForm(page);

    for (const field of [
      {
        label: "Nouveau mot de passe",
        show: "Afficher le nouveau mot de passe",
        hide: "Masquer le nouveau mot de passe",
      },
      {
        label: "Confirmer le nouveau mot de passe",
        show: "Afficher la confirmation du mot de passe",
        hide: "Masquer la confirmation du mot de passe",
      },
    ]) {
      await test.step(field.label, async () => {
        const input = form.getByLabel(field.label, { exact: true });
        await expect(input).toHaveAttribute("type", "password");

        await form.getByRole("button", { name: field.show }).click();
        const hide = form.getByRole("button", { name: field.hide });
        await expect(hide).toHaveAttribute("aria-pressed", "true");
        await expect(input).toHaveAttribute("type", "text");

        await hide.click();
        await expect(form.getByRole("button", { name: field.show })).toHaveAttribute("aria-pressed", "false");
        await expect(input).toHaveAttribute("type", "password");
      });
    }
  });
});

/** Requête `PUT /user/me` (préférences et profil partagent la même route). */
function isProfileUpdate(request: Request): boolean {
  return request.method() === "PUT" && /\/user\/me\/?$/.test(new URL(request.url()).pathname);
}

/** Fait échouer (500) les `PUT /user/me` ; les autres appels passent. */
async function failProfileUpdates(page: Page): Promise<void> {
  await page.route(
    (url) => /\/user\/me\/?$/.test(url.pathname),
    async (route) => {
      if (route.request().method() !== "PUT") return route.fallback();
      await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"e2e"}' });
    },
  );
}

/** Attend le `PUT /user/me` déclenché par `action` et renvoie le corps envoyé. */
async function savedPreference(page: Page, action: () => Promise<void>): Promise<Record<string, unknown>> {
  const saved = page.waitForResponse((response) => isProfileUpdate(response.request()));
  await action();
  const response = await saved;
  expect(response.ok(), "PUT /user/me réussi").toBe(true);
  return response.request().postDataJSON() as Record<string, unknown>;
}

test.describe("Préférences", () => {
  // L'`id` est porté par le titre `h2` ; la section le référence via `aria-labelledby`.
  const preferences = (page: Page) => page.locator('section[aria-labelledby="profile-section-preferences"]');
  const languageSelect = (page: Page, name = "Langue du site") => page.getByRole("combobox", { name });
  const unitSelect = (page: Page, name = "Unités de mesure préférées") => page.getByRole("combobox", { name });
  const bothUnits = (page: Page) => page.getByRole("checkbox", { name: "Afficher les deux unités" });

  test.describe("Langue", () => {
    test("changer la langue l'enregistre sur le compte et bascule le site", async ({ page, account, browser }) => {
      await openProfile(page);

      await test.step("choisir l'anglais", async () => {
        const body = await savedPreference(page, async () => {
          await languageSelect(page).click();
          await page.getByRole("option", { name: "🇬🇧 Anglais" }).click();
        });
        expect(body).toEqual({ preferredLocale: "en" });
      });

      await test.step("la même page s'affiche en anglais", async () => {
        await page.waitForURL((url) => url.pathname === "/en/profile");
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expect(languageSelect(page, "Site language")).toHaveText("🇬🇧 English");
        await expect(page.getByRole("button", { name: "View release notes" })).toBeVisible();
      });

      await test.step("la langue est conservée côté navigateur", async () => {
        expect(await page.evaluate(() => localStorage.getItem("user-preferred-locale"))).toBe("en");
        await page.reload();
        await expect(languageSelect(page, "Site language")).toHaveText("🇬🇧 English");
      });

      await test.step("une nouvelle connexion applique la langue du compte", async () => {
        const context = await browser.newContext();
        try {
          await muteReleaseNotes(context);
          const freshPage = await context.newPage();
          await loginWithCredentials(freshPage, account.username, account.password);
          await freshPage.waitForURL((url) => url.pathname.startsWith("/en/"));
          await freshPage.goto(`/${env.locale}/profile`);
          await freshPage.waitForURL((url) => url.pathname === "/en/profile");
          await expect(languageSelect(freshPage, "Site language")).toHaveText("🇬🇧 English");
        } finally {
          await context.close();
        }
      });
    });

    test("le sélecteur de langue s'utilise au clavier", async ({ page }) => {
      await openProfile(page);
      const select = languageSelect(page);
      await expect(select).toHaveText("🇫🇷 Français");
      await expect(preferences(page).getByText("Langue", { exact: true })).toBeVisible();

      await select.focus();
      await page.keyboard.press("Enter");
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole("option")).toHaveText(["🇫🇷 Français", "🇬🇧 Anglais", "🇪🇸 Espagnol"]);

      await page.keyboard.press("Escape");
      await expect(listbox).toBeHidden();
      await expect(select).toBeFocused();
      await expect(page).toHaveURL(/\/fr\/profile$/);
    });

    test("un échec de l'API affiche une erreur et garde la langue", async ({ page }) => {
      await openProfile(page);
      await failProfileUpdates(page);

      await languageSelect(page).click();
      await page.getByRole("option", { name: "🇬🇧 Anglais" }).click();

      await expect(page.getByText("Échec de la mise à jour du profil")).toBeVisible();
      await expect(page).toHaveURL(/\/fr\/profile$/);
      await expect(languageSelect(page)).toHaveText("🇫🇷 Français");
      await expect(languageSelect(page)).toBeEnabled();
      expect(await page.evaluate(() => localStorage.getItem("user-preferred-locale"))).not.toBe("en");
    });
  });

  test.describe("Unités de mesure", () => {
    test("choisir l'unité impériale l'enregistre", async ({ page }) => {
      await openProfile(page);
      const select = unitSelect(page);
      await expect(select).toHaveText("Mètres (m, kg)");

      const body = await savedPreference(page, async () => {
        await select.focus();
        await page.keyboard.press("Enter");
        await page.getByRole("option", { name: "Pieds / Pouces (ft, lbs)" }).click();
      });
      expect(body).toEqual({ preferredMeasurementUnit: "imperial" });
      await expect(select).toHaveText("Pieds / Pouces (ft, lbs)");

      await page.reload();
      await expect(unitSelect(page)).toHaveText("Pieds / Pouces (ft, lbs)");
    });

    test("choisir l'unité déjà active n'envoie rien", async ({ page }) => {
      const updates = countProfileUpdates(page);
      await openProfile(page);

      await unitSelect(page).click();
      await page.getByRole("option", { name: "Mètres (m, kg)" }).click();

      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(unitSelect(page)).toHaveText("Mètres (m, kg)");
      expect(updates(), "aucune requête de mise à jour").toBe(0);
    });

    test("un échec de l'API affiche une erreur et garde l'unité", async ({ page }) => {
      await openProfile(page);
      await failProfileUpdates(page);

      await unitSelect(page).click();
      await page.getByRole("option", { name: "Pieds / Pouces (ft, lbs)" }).click();

      await expect(page.getByText("Échec de la mise à jour du profil")).toBeVisible();
      await expect(unitSelect(page)).toHaveText("Mètres (m, kg)");
      await expect(unitSelect(page)).toBeEnabled();

      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.reload();
      await expect(unitSelect(page)).toHaveText("Mètres (m, kg)");
    });
  });

  test.describe("Afficher les deux unités", () => {
    test("cocher puis décocher l'option l'enregistre", async ({ page }) => {
      await openProfile(page);
      const checkbox = bothUnits(page);
      await expect(checkbox).not.toBeChecked();

      await test.step("cocher", async () => {
        const body = await savedPreference(page, () => checkbox.click());
        expect(body).toEqual({ showBothUnits: true });
        await expect(checkbox).toBeChecked();
        await page.reload();
        await expect(bothUnits(page)).toBeChecked();
      });

      await test.step("décocher", async () => {
        const body = await savedPreference(page, () => bothUnits(page).click());
        expect(body).toEqual({ showBothUnits: false });
        await page.reload();
        await expect(bothUnits(page)).not.toBeChecked();
      });
    });

    test("un échec de l'API affiche une erreur et laisse l'option décochée", async ({ page }) => {
      await openProfile(page);
      await failProfileUpdates(page);

      await bothUnits(page).click();

      await expect(page.getByText("Échec de la mise à jour du profil")).toBeVisible();
      await expect(bothUnits(page)).not.toBeChecked();
      await expect(bothUnits(page)).toBeEnabled();
    });
  });

  test.describe("Nouveautés", () => {
    const releaseNotesDialog = (page: Page) => page.getByRole("dialog", { name: "Nouveautés" });
    const muteCheckbox = (page: Page) =>
      page.getByRole("checkbox", { name: "Ne plus afficher automatiquement les nouveautés au démarrage" });

    /** Clé « version vue » du compte connecté (cf. `releaseNotesSeen.ts`). */
    async function seenVersion(page: Page): Promise<string | null> {
      return page.evaluate(() =>
        localStorage.getItem(`chariot_release_notes_seen_${localStorage.getItem("chariot_user_id")}`),
      );
    }

    test("le bouton ouvre les nouveautés sans marquer la version comme vue", async ({ page }) => {
      await openProfile(page);
      const before = await seenVersion(page);

      await page.getByRole("button", { name: "Voir les nouveautés" }).click();
      const dialog = releaseNotesDialog(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("listitem").first()).toBeVisible();

      await dialog.getByRole("button", { name: "Fermer" }).click();
      await expect(dialog).toBeHidden();
      expect(await seenVersion(page), "version vue inchangée").toBe(before);
    });

    test("la version de l'application, si elle est exposée, s'affiche au format Chariot vX.Y.Z", async ({ page }) => {
      await openProfile(page);
      const version = preferences(page).getByText(/^Chariot v/);
      // NEXT_PUBLIC_APP_VERSION peut être absent selon l'environnement : rien ne doit alors s'afficher.
      if ((await version.count()) > 0) {
        await expect(version).toHaveText(/^Chariot v\d+\.\d+\.\d+/);
      } else {
        await expect(preferences(page)).not.toContainText("Chariot v");
      }
    });

    test.describe("sans coupure automatique", () => {
      test.use({ muteNotes: false });

      test("« Ne plus afficher » coupe l'ouverture automatique des nouveautés", async ({ page }) => {
        const dialog = releaseNotesDialog(page);

        await test.step("à la première connexion, les nouveautés s'ouvrent", async () => {
          await expect(dialog).toBeVisible({ timeout: 15_000 });
          await dialog.getByRole("button", { name: "Fermer" }).click();
          await expect(dialog).toBeHidden();
        });

        await openProfile(page);
        await expect(muteCheckbox(page)).not.toBeChecked();

        await test.step("coché : une version non vue ne rouvre pas la modale", async () => {
          await muteCheckbox(page).click();
          await expect(muteCheckbox(page)).toBeChecked();
          await page.evaluate(() =>
            localStorage.removeItem(`chariot_release_notes_seen_${localStorage.getItem("chariot_user_id")}`),
          );
          await openProfile(page);
          await expect(muteCheckbox(page)).toBeChecked();
          // Même délai que l'étape suivante, où la modale s'ouvre bien.
          await page.waitForLoadState("networkidle");
          await expect(dialog).toBeHidden();
        });

        await test.step("décoché : la modale s'ouvre de nouveau", async () => {
          await muteCheckbox(page).click();
          await expect(muteCheckbox(page)).not.toBeChecked();
          await page.reload();
          await page.waitForLoadState("networkidle");
          await expect(dialog).toBeVisible();
        });
      });
    });
  });
});
