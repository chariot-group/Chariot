# Chariot E2E Scenarios (Playwright)

End-to-end tests in a real browser: web client, Keycloak, gateway, adventure and session (WebSocket).
Every scenario is recorded (video, screenshots, trace) and can be replayed step by step.

📖 **Full guide**: [docs/development/E2E_TESTING.md](../../docs/development/E2E_TESTING.md) (writing and editing tests, reading reports and traces, diagnosing failures).

## Getting started

```bash
make up ENV=dev          # local Docker stack
cp tools/e2e/env.example tools/e2e/.env
make e2e-install         # once
make e2e                 # all scenarios
make e2e FILTER=session  # only those whose title contains "session"
```

## Viewing runs

| Command | Usage |
| --- | --- |
| `make e2e-ui` | UI mode: scenario list, on-demand runs, timeline, DOM/network/console at each step, watch mode |
| `make e2e-report` | HTML report of the last run: videos (one per GM / player actor), screenshots, trace |
| `npx playwright show-trace test-results/<test>/trace.zip` | Replay a specific trace |
| `npm run headed` (in `tools/e2e`) | Watch the browser while tests run |

## Layout

```
tools/e2e/
├── playwright.config.ts      # setup → scenarios projects, trace/video/screenshots always on
├── scenarios/
│   ├── auth.setup.ts         # creates test accounts + stores their SSO session (.auth/)
│   ├── auth/                 # login, post-auth navigation
│   ├── campagne/             # campaign creation
│   └── session/              # GM + player in real time (WebSocket)
└── src/
    ├── env.ts                # configuration (.env)
    ├── keycloak.ts           # account provisioning + tokens
    ├── api.ts                # gateway client to prepare / clean up data
    ├── fixtures.ts           # `gm` and `player` actors (browser + API)
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

## Test accounts

Locally, `auth.setup.ts` creates (or resets) `e2e-gm` and `e2e-player` through the Keycloak admin API.
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
