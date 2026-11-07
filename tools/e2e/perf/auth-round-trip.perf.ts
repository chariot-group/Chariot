import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type CDPSession, type Page } from "@playwright/test";
import { env } from "@/env";
import { ensureTestUsers } from "@/keycloak";

/**
 * FR-web-first-load-performance — « Slow-network authentication round trip », exigence 9.
 *
 * Mesure le parcours app → page de login Keycloak → retour dans l'app sur un réseau lent,
 * cache froid. À lancer contre un build de prod (`next build && next start`) ou la prod :
 * les mesures sur `next dev` ne sont pas représentatives.
 *
 * Profil par défaut (référence de la règle) : 400 kbps / 400 kbps / 2000 ms de latence.
 * Surcharges : PERF_DOWN_KBPS, PERF_UP_KBPS, PERF_LATENCY_MS, PERF_RUNS, PERF_LABEL,
 * PERF_THINK_MS (temps passé à saisir les identifiants sur la page de login, 0 par défaut).
 */

const profile = {
  downKbps: Number(process.env.PERF_DOWN_KBPS ?? 400),
  upKbps: Number(process.env.PERF_UP_KBPS ?? 400),
  latencyMs: Number(process.env.PERF_LATENCY_MS ?? 2000),
};
const runs = Math.max(1, Number(process.env.PERF_RUNS ?? 1));
const label = process.env.PERF_LABEL ?? "run";
const traceRequests = process.env.PERF_TRACE_REQUESTS === "1";
const thinkMs = Math.max(0, Number(process.env.PERF_THINK_MS ?? 0));

type Phase = "app-before-redirect" | "login-page" | "after-submit";

interface PhaseTraffic {
  requests: number;
  /** CORS preflights (OPTIONS), included in `requests`. */
  preflights: number;
  bytes: number;
}

interface TracedRequest {
  phase: Phase;
  /** Milliseconds since navigation start. */
  at: number;
  method: string;
  type: string;
  url: string;
}

interface RunResult {
  /** Navigation → URL Keycloak. */
  toKeycloakRedirectMs: number;
  /** Navigation → formulaire de login affiché et page chargée. */
  toLoginRenderedMs: number;
  /** Clic « Se connecter » → page de destination affichée avec ses données. */
  submitToContentMs: number;
  destination: string;
  traffic: Record<Phase, PhaseTraffic>;
  /** Filled when PERF_TRACE_REQUESTS=1: every request, to spot chains and duplicates. */
  requests?: TracedRequest[];
}

const kbpsToBytesPerSecond = (kbps: number) => (kbps * 1000) / 8;

async function throttle(cdp: CDPSession): Promise<void> {
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: profile.latencyMs,
    downloadThroughput: kbpsToBytesPerSecond(profile.downKbps),
    uploadThroughput: kbpsToBytesPerSecond(profile.upKbps),
  });
}

/** Comptabilise requêtes et octets transférés (encodés) par phase du parcours. */
function trackTraffic(
  cdp: CDPSession,
  currentPhase: () => Phase,
  start: () => number,
): { traffic: Record<Phase, PhaseTraffic>; requests: TracedRequest[] } {
  const traffic: Record<Phase, PhaseTraffic> = {
    "app-before-redirect": { requests: 0, preflights: 0, bytes: 0 },
    "login-page": { requests: 0, preflights: 0, bytes: 0 },
    "after-submit": { requests: 0, preflights: 0, bytes: 0 },
  };
  const requests: TracedRequest[] = [];
  const phaseByRequest = new Map<string, Phase>();

  cdp.on("Network.requestWillBeSent", (event) => {
    if (phaseByRequest.has(event.requestId)) return; // redirection : même requestId
    const phase = currentPhase();
    phaseByRequest.set(event.requestId, phase);
    traffic[phase].requests += 1;
    const isPreflight = event.type === "Preflight" || event.request.method === "OPTIONS";
    if (isPreflight) traffic[phase].preflights += 1;
    if (traceRequests) {
      requests.push({
        phase,
        at: Date.now() - start(),
        method: event.request.method,
        type: isPreflight ? "Preflight" : (event.type ?? "Other"),
        url: event.request.url.split("#")[0],
      });
    }
  });
  cdp.on("Network.loadingFinished", (event) => {
    const phase = phaseByRequest.get(event.requestId);
    if (phase) traffic[phase].bytes += event.encodedDataLength;
  });
  return { traffic, requests };
}

/** La destination est affichée et plus aucune zone n'est en chargement (squelettes, aria-busy). */
async function waitForMeaningfulContent(page: Page): Promise<void> {
  await page.waitForURL(
    (url) =>
      url.href.startsWith(env.webUrl) && /\/(characters|campaigns|welcome)(\/|$|\?)/.test(url.pathname),
    { timeout: 300_000 },
  );
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null, undefined, {
    timeout: 300_000,
    polling: 100,
  });
}

async function measureOnce(page: Page, cdp: CDPSession): Promise<RunResult> {
  let phase: Phase = "app-before-redirect";
  let start = Date.now();
  const { traffic, requests } = trackTraffic(cdp, () => phase, () => start);
  await throttle(cdp);

  start = Date.now();
  await page.goto(`/${env.locale}`, { waitUntil: "commit", timeout: 300_000 });

  await page.waitForURL((url) => url.href.startsWith(env.keycloakUrl), {
    waitUntil: "commit",
    timeout: 300_000,
  });
  const toKeycloakRedirectMs = Date.now() - start;
  phase = "login-page";

  await page.locator("#username").waitFor({ state: "visible", timeout: 300_000 });
  await page.waitForLoadState("load", { timeout: 300_000 });
  const toLoginRenderedMs = Date.now() - start;

  // Un utilisateur réel met quelques secondes à saisir ses identifiants.
  if (thinkMs > 0) await page.waitForTimeout(thinkMs);
  await page.locator("#username").fill(env.users.player.username);
  await page.locator("#password").fill(env.password);
  phase = "after-submit";
  const submit = Date.now();
  await page.locator("#kc-login").click();

  await waitForMeaningfulContent(page);
  const submitToContentMs = Date.now() - submit;

  return {
    toKeycloakRedirectMs,
    toLoginRenderedMs,
    submitToContentMs,
    destination: new URL(page.url()).pathname.replace(/[0-9a-f]{24}/g, ":id"),
    traffic,
    ...(traceRequests ? { requests } : {}),
  };
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

test.describe("Performance — aller-retour d'authentification sur réseau lent", () => {
  test.setTimeout(runs * 15 * 60_000);

  test.beforeAll(async () => {
    await ensureTestUsers();
  });

  test("mesurer redirection SSO, page de login et retour dans l'app", async ({ browser }) => {
    const results: RunResult[] = [];

    for (let index = 0; index < runs; index += 1) {
      // Contexte vierge à chaque passage : cache froid, pas de session SSO.
      const context = await browser.newContext({ baseURL: env.webUrl, locale: env.locale });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      try {
        const result = await test.step(`passage ${index + 1}/${runs}`, () => measureOnce(page, cdp));
        results.push(result);
      } finally {
        await context.close();
      }
    }

    const summary = {
      label,
      date: new Date().toISOString(),
      webUrl: env.webUrl,
      profile,
      thinkMs,
      runs: results.length,
      median: {
        toKeycloakRedirectMs: median(results.map((result) => result.toKeycloakRedirectMs)),
        toLoginRenderedMs: median(results.map((result) => result.toLoginRenderedMs)),
        submitToContentMs: median(results.map((result) => result.submitToContentMs)),
      },
      results,
    };

    const outputDir = path.join(env.rootDir, "reports", "perf");
    mkdirSync(outputDir, { recursive: true });
    const file = path.join(outputDir, `auth-round-trip-${label}-${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(summary, null, 2));

    console.log(`\nAller-retour d'authentification (${label}) — médiane sur ${results.length} passage(s)`);
    console.table(summary.median);
    console.table(
      Object.fromEntries(
        Object.entries(results[results.length - 1].traffic).map(([phaseName, value]) => [
          phaseName,
          { requests: value.requests, preflights: value.preflights, kB: Math.round(value.bytes / 1024) },
        ]),
      ),
    );
    console.log(`Rapport : ${file}`);

    expect(results.length).toBe(runs);
  });
});
