import { defineConfig, devices } from "@playwright/test";
import { env } from "@/env";

const isCI = !!process.env.CI;

/**
 * Mesures sur réseau lent (FR-web-first-load-performance), uniquement à la demande :
 * `make e2e-perf` (E2E_PERF=1). Exclues de `make e2e`.
 */
const perfProjects = process.env.E2E_PERF === "1"
  ? [
      {
        name: "perf",
        testDir: "./perf",
        testMatch: /.*\.perf\.ts/,
        use: { ...devices["Desktop Chrome"], trace: "off" as const, video: "off" as const, screenshot: "off" as const },
      },
    ]
  : [];

/**
 * Scénarios E2E Chariot.
 *
 * - `setup` : provisionne les comptes de test et enregistre leur session SSO (`.auth/`).
 * - `scenarios` : tous les `*.spec.ts`, rangés par domaine fonctionnel dans `scenarios/`.
 *
 * Chaque exécution produit trace + vidéo + captures, consultables avec `npm run report`
 * ou en direct avec `npm run ui`.
 */
export default defineConfig({
  testDir: "./scenarios",
  outputDir: "./test-results",
  fullyParallel: false,
  // Les scénarios partagent les mêmes comptes de test (sessions WS, roster) : exécution séquentielle.
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "reports/html", open: "never" }]],
  use: {
    baseURL: env.webUrl,
    locale: env.locale,
    trace: "on",
    video: "on",
    screenshot: "on",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "scenarios",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    ...perfProjects,
  ],
});
