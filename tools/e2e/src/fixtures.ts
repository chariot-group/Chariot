import { test as base, type Browser, type Page, type TestInfo } from "@playwright/test";
import { ChariotApi } from "@/api";
import { env, storageStatePath, type Role } from "@/env";

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

/**
 * Chaque acteur a son propre contexte navigateur isolé (cookies, localStorage, WebSocket).
 * Un même test peut donc faire jouer un MJ et un joueur en même temps, comme deux vrais clients.
 * La trace couvre tous les contextes ; la vidéo de chaque acteur est jointe au rapport.
 */
function actorFixture(role: Role) {
  return async (
    { browser }: { browser: Browser },
    use: (actor: Actor) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const videoDir = testInfo.outputPath(`video-${role}`);
    const context = await browser.newContext({
      baseURL: env.webUrl,
      locale: env.locale,
      storageState: storageStatePath(role),
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const api = await ChariotApi.as(role);

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
