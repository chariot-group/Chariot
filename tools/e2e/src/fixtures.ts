import { readFileSync } from "node:fs";
import {
  test as base,
  type Browser,
  type BrowserContextOptions,
  type Page,
  type PlaywrightTestOptions,
  type TestInfo,
  type ViewportSize,
} from "@playwright/test";
import { ChariotApi } from "@/api";
import { accountSlot, env, storageStatePath, type Role } from "@/env";

type Actor = {
  /** Page navigateur déjà authentifiée (session SSO restaurée depuis `.auth/<role>.json`). */
  page: Page;
  /** Client API authentifié comme ce même compte, pour préparer / nettoyer les données. */
  api: ChariotApi;
};

type Fixtures = {
  gm: Actor;
  player: Actor;
};

const ROLE_LABEL: Record<Role, string> = { gm: "MJ", player: "Joueur" };

const DEFAULT_VIEWPORT: ViewportSize = { width: 1280, height: 720 };

/** Réglages d'appareil du projet Playwright en cours (`desktop-chrome`, `mobile-safari`…). */
type DeviceOptions = Pick<
  PlaywrightTestOptions,
  "viewport" | "isMobile" | "hasTouch" | "userAgent" | "deviceScaleFactor"
>;

type StorageState = Exclude<BrowserContextOptions["storageState"], string | undefined>;

/**
 * Keycloak pose ses cookies SSO en `Secure; SameSite=None`. Chromium et Firefox les renvoient
 * sur `http://localhost`, WebKit non : la session est perdue et chaque page retombe sur le login.
 * En HTTP uniquement, on les rend non-`Secure` (et `Lax`, `None` exigeant `Secure`) pour WebKit.
 * Sur un environnement HTTPS, la session enregistrée est utilisée telle quelle.
 */
function storageStateFor(role: Role, slot: number, browserName: string): string | StorageState {
  const file = storageStatePath(role, slot);
  if (browserName !== "webkit" || !env.keycloakUrl.startsWith("http:")) return file;

  const state = JSON.parse(readFileSync(file, "utf8")) as StorageState;
  return {
    ...state,
    cookies: state.cookies.map((cookie) =>
      cookie.secure
        ? { ...cookie, secure: false, sameSite: cookie.sameSite === "None" ? ("Lax" as const) : cookie.sameSite }
        : cookie,
    ),
  };
}

/**
 * Chaque acteur a son propre contexte navigateur isolé (cookies, localStorage, WebSocket),
 * connecté avec le compte du worker courant (`accountSlot`) : aucun autre test ne l'utilise en même temps.
 * Un même test peut donc faire jouer un MJ et un joueur en même temps, comme deux vrais clients.
 * Le contexte reprend l'appareil du projet (écran, tactile, user-agent) : sans cela,
 * un contexte créé à la main resterait en 1280×720 même sur mobile.
 * La trace couvre tous les contextes. Vidéo de chaque acteur jointe au rapport avec `E2E_ARTIFACTS=all`
 * (l'encodage vidéo ralentit nettement les tests, surtout sous WebKit).
 */
function actorFixture(role: Role) {
  return async (
    {
      browser,
      browserName,
      viewport,
      isMobile,
      hasTouch,
      userAgent,
      deviceScaleFactor,
    }: { browser: Browser; browserName: string } & DeviceOptions,
    use: (actor: Actor) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const slot = accountSlot(testInfo.parallelIndex);
    const screen = viewport ?? DEFAULT_VIEWPORT;
    const recordVideo =
      env.artifacts === "all" ? { dir: testInfo.outputPath(`video-${role}`), size: screen } : undefined;
    const context = await browser.newContext({
      baseURL: env.webUrl,
      locale: env.locale,
      storageState: storageStateFor(role, slot, browserName),
      recordVideo,
      viewport: screen,
      isMobile,
      hasTouch,
      userAgent,
      deviceScaleFactor,
    });
    const page = await context.newPage();
    const api = await ChariotApi.as(role, slot);

    await use({ page, api });

    const video = page.video();
    await context.close();
    if (video) {
      await testInfo.attach(`vidéo ${ROLE_LABEL[role]}`, { path: await video.path(), contentType: "video/webm" });
    }
  };
}

export const test = base.extend<Fixtures>({
  gm: actorFixture("gm"),
  player: actorFixture("player"),
});

export { expect } from "@playwright/test";
