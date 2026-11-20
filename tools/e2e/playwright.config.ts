import { defineConfig, devices } from "@playwright/test";
import { env, workerCount } from "@/env";
import { FULL_MATRIX_PROJECT, SHOP_FULL_MATRIX_ONLY, WEBHOOK_ONLY } from "@/tags";

const isCI = !!process.env.CI;

/**
 * Mesures sur réseau lent (FR-web-first-load-performance), uniquement à la demande :
 * `make e2e-perf` (E2E_PERF=1). Exclues de `make e2e`.
 */
const perfProjects =
  process.env.E2E_PERF === "1"
    ? [
        {
          name: "perf",
          testDir: "./perf",
          testMatch: /.*\.perf\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            trace: "off" as const,
            video: "off" as const,
            screenshot: "off" as const,
          },
        },
      ]
    : [];

/**
 * Appareils × navigateurs couverts par les scénarios (nom du projet = `<appareil>-<navigateur>`).
 * « safari » = WebKit, le moteur de Safari (macOS et iOS) ; « chrome » = Chromium.
 * Sous 768 px, la sidebar passe dans un menu (`openSidebarIfMobile`).
 */
const SCENARIO_TARGETS = [
  { name: "desktop-chrome", device: "Desktop Chrome" },
  { name: "desktop-firefox", device: "Desktop Firefox" },
  { name: "desktop-safari", device: "Desktop Safari" },
  { name: "mobile-chrome", device: "Pixel 7" },
  { name: "mobile-safari", device: "iPhone 14" },
] as const;

/**
 * Scénarios boutique non planifiés (absents de la liste et du rapport, plutôt que « skipped ») :
 * - hors `desktop-chrome`, seuls les tests `@smoke` tournent ;
 * - sans `E2E_STRIPE_WEBHOOK=1`, les tests `@webhook` sont exclus (aucun paiement ne serait confirmé).
 */
function excludedFor(project: string): RegExp[] {
  const excluded: RegExp[] = [];
  if (project !== FULL_MATRIX_PROJECT) excluded.push(SHOP_FULL_MATRIX_ONLY);
  if (!env.stripeWebhook) excluded.push(WEBHOOK_ONLY);
  return excluded;
}

const scenarioProjects = SCENARIO_TARGETS.map(({ name, device }) => ({
  name,
  testMatch: /.*\.spec\.ts/,
  grepInvert: excludedFor(name),
  dependencies: ["setup"],
  use: { ...devices[device] },
}));

/**
 * Scénarios E2E Chariot.
 *
 * - `setup` : provisionne les comptes de test et enregistre leur session SSO (`.auth/`).
 * - `<appareil>-<navigateur>` : tous les `*.spec.ts` (rangés par domaine dans `scenarios/`),
 *   joués sur chaque combinaison de `SCENARIO_TARGETS`. Filtrer avec `make e2e DEVICE=mobile BROWSER=safari`.
 *
 * Parallélisme : `E2E_WORKERS` workers (4 par défaut), chacun avec sa paire de comptes MJ / joueur
 * (cf. `testUser` dans `src/env.ts`). Sans `KEYCLOAK_ADMIN_*`, exécution séquentielle (1 worker).
 *
 * Artefacts : trace et capture conservées pour les tests en échec. `E2E_ARTIFACTS=all` garde
 * trace + vidéo + captures pour chaque test. Consultables avec `npm run report` ou `npm run ui`.
 */
const allArtifacts = env.artifacts === "all";

export default defineConfig({
  testDir: "./scenarios",
  outputDir: "./test-results",
  fullyParallel: true,
  workers: workerCount,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "reports/html", open: "never" }]],
  use: {
    baseURL: env.webUrl,
    locale: env.locale,
    trace: allArtifacts ? "on" : "retain-on-failure",
    video: allArtifacts ? "on" : "off",
    screenshot: allArtifacts ? "on" : "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    ...scenarioProjects,
    ...perfProjects,
  ],
});
