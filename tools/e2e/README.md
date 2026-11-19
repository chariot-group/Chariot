# Chariot E2E Scenarios (Playwright)

End-to-end tests in a real browser: web client, Keycloak, gateway, adventure and session (WebSocket).
Scenarios run in parallel (4 workers by default, one GM / player account pair per worker). Failed scenarios keep their trace and screenshot for step-by-step replay; `ARTIFACTS=all` records everything, videos included.

📖 **Full guide**: [docs/development/E2E_TESTING.md](../../docs/development/E2E_TESTING.md) (writing and editing tests, reading reports and traces, diagnosing failures).

## Getting started

```bash
make up ENV=dev          # local Docker stack
cp tools/e2e/env.example tools/e2e/.env
make e2e-install         # once
make e2e                 # all scenarios
make e2e FILTER=session  # only those whose title contains "session"
make e2e DEVICE=mobile   # only on phone (Pixel 7, iPhone 14); DEVICE=desktop for computer only
make e2e BROWSER=safari  # only one browser: chrome, firefox or safari (WebKit)
make e2e WORKERS=2       # number of parallel workers (default 4; not --workers, see "Test accounts")
make e2e ARTIFACTS=all   # trace + video + screenshots for every test (default: trace + screenshot on failure only)
make e2e FILTER=boutique STRIPE_WEBHOOK=1  # sales funnel, with `make stripe-listen` running (see the guide)
```

## Viewing runs

| Command | Usage |
| --- | --- |
| `make e2e-ui` | UI mode: scenario list, on-demand runs, timeline, DOM/network/console at each step, watch mode |
| `make e2e-report` | HTML report of the last run: traces and screenshots of failures (videos per GM / player actor with `ARTIFACTS=all`) |
| `npx playwright show-trace test-results/<test>/trace.zip` | Replay a specific trace |
| `npm run headed` (in `tools/e2e`) | Watch the browser while tests run |

## Layout

```
tools/e2e/
├── playwright.config.ts      # setup → <device>-<browser> projects, workers, artifacts
├── scenarios/
│   ├── auth.setup.ts         # creates test accounts + stores their SSO session (.auth/)
│   ├── auth/                 # login, post-auth navigation
│   ├── campagne/             # campaign creation
│   ├── profil/               # sign-up (Keycloak), profile read / edit, account deletion request
│   ├── boutique/             # sales funnel: packs, promo codes, affiliation, referral (Stripe test mode)
│   └── session/              # GM + player in real time (WebSocket)
└── src/
    ├── env.ts                # configuration (.env)
    ├── keycloak.ts           # account provisioning + tokens
    ├── api.ts                # gateway client to prepare / clean up data
    ├── fixtures.ts           # `gm` and `player` actors (browser + API)
    ├── payment.ts            # payment / balance API client (catalog, referral, admin codes)
    ├── shop.ts               # shop journeys and outcome assertions
    ├── shop-fixtures.ts      # `buyer`, `openBuyer`, promo / affiliation code factories
    └── flows.ts              # reusable UI journeys
```

## Writing a scenario

```ts
import { expect, test } from "@/fixtures";

test("my scenario", async ({ gm, player }) => {
  // gm.page / player.page: two isolated browsers, already logged in
  // gm.api / player.api:   gateway calls for setup and cleanup
});
```

Conventions:

- **One folder per functional domain**; test titles in French (matching UI labels); list the covered `FR-*` rules in the file header.
- **Prepare through the API, test through the UI**: only the journey under test is driven in the browser.
- **Accessible selectors** (`getByRole`, `getByLabel`) with the FR labels, no CSS classes.
  A broken selector often reveals an accessibility regression.
- **Unique, cleaned-up data**: `uniqueLabel()` adds an `[e2e]` prefix; delete in a `finally`.
- **`test.step()`** to split the scenario: steps structure the report and the replay.
- Imports through the `@/` alias only (no relative paths).
- **Every device and browser**: each scenario runs on desktop Chrome / Firefox / Safari and mobile Chrome / Safari. Below 768 px the sidebar sits behind a
  "Ouvrir le menu" button: go through `openSidebarIfMobile()` (`@/flows`) before clicking in it.

## Test accounts

Locally, `auth.setup.ts` creates (or resets) one pair per worker (`e2e-gm-<n>`, `e2e-player-<n>`) through the Keycloak admin API,
so parallel tests never share an account. In a test, get the current worker's account with `testUser(role, accountSlot(testInfo.parallelIndex))`;
the `gm` / `player` fixtures already do it. Without `KEYCLOAK_ADMIN_*`, the run uses `e2e-gm` / `e2e-player` on a single worker.
Scenarios that modify the account (`profil/`) use temporary `e2e-tmp-*` accounts created and deleted through the same admin API
(`createTemporaryAccount`, `deleteKeycloakAccount`); they are skipped without `KEYCLOAK_ADMIN_*`.
On a hosted environment, leave `KEYCLOAK_ADMIN_*` empty and provide existing dedicated test accounts.
Never use real user accounts.

## Measuring loading times on a slow network

`next dev` ships 10–20× more JavaScript than a production build (unminified, compiled on demand):
slow-network tests on it are not representative (FR-web-first-load-performance).

```bash
make web-prod-local                     # replaces the dev web container with a production build on :3000
make e2e-perf PERF_RUNS=3               # app → Keycloak → back in the app, 3G profile, cold cache
make web-dev-local                      # back to next dev
```

`make e2e-perf` reports, per phase (before the Keycloak redirect, login page, after login submit),
the elapsed time, requests, CORS preflights and transferred bytes, in `reports/perf/*.json`.
Options: `PERF_RUNS`, `PERF_LABEL`, `PERF_LATENCY_MS` / `PERF_DOWN_KBPS` / `PERF_UP_KBPS`
(default 2000 ms / 400 / 400), `PERF_THINK_MS` (typing time on the login page),
`PERF_TRACE_REQUESTS=1` (list every request). Point `.env` at another environment to measure it.
