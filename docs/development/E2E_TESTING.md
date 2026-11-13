# End-to-End Testing (Playwright)

Complete guide to Chariot's E2E scenarios: running tests, writing and editing them, reading reports and diagnosing failures.

The code lives in [`tools/e2e/`](../../tools/e2e/). Playwright version: see `tools/e2e/package.json`.

> **Language note**: this guide is in English, but test titles and UI selectors stay in French. They match the scenario names and the application's French labels (`services/web/client/messages/fr.json`).

---

## Table of contents

1. [What these tests are for](#1-what-these-tests-are-for)
2. [Setup and first run](#2-setup-and-first-run)
3. [Running tests](#3-running-tests)
4. [Folder structure](#4-folder-structure)
5. [Writing a new scenario](#5-writing-a-new-scenario)
6. [Editing an existing scenario](#6-editing-an-existing-scenario)
7. [Choosing selectors](#7-choosing-selectors)
8. [Assertions and waiting](#8-assertions-and-waiting)
9. [UI mode](#9-ui-mode)
10. [The HTML report](#10-the-html-report)
11. [The Trace Viewer: replaying a run step by step](#11-the-trace-viewer-replaying-a-run-step-by-step)
12. [Diagnosing a failure](#12-diagnosing-a-failure)
13. [Known Chariot pitfalls](#13-known-chariot-pitfalls)
14. [Command reference](#14-command-reference)

---

## 1. What these tests are for

Unit tests (Vitest, Jest) check isolated functions. E2E tests check **a real user journey** through the whole stack:

```
Browser ──► Web (Next.js) ──► Keycloak (SSO)
               │
               ├──► Gateway ──► Adventure (campaigns, characters)
               └──► Session (HTTP + WebSocket)
```

They cover what unit tests cannot see:

- **real-time multi-user flows**: a GM and a player in two separate browsers, connected over WebSocket;
- **SSO login** and post-authentication redirects;
- **integration** between the frontend, the gateway and the APIs.

Each scenario lists the functional rules (`FR-*`) it covers in its file header.

E2E tests do not replace unit tests: they are slower and more expensive to maintain. Keep them for **critical journeys**.

---

## 2. Setup and first run

### Prerequisites

- Node.js 22+
- Docker, with the dev stack running

### Steps

```bash
make up ENV=dev
```

```bash
cp tools/e2e/env.example tools/e2e/.env
```

```bash
make e2e-install
```

`make e2e-install` installs the npm dependencies and the Chromium browser used by Playwright (about 100 MB, downloaded once into `~/Library/Caches/ms-playwright`).

```bash
make e2e
```

If everything is green, setup is complete.

### The `.env` file

| Variable | Purpose | Local value |
| --- | --- | --- |
| `WEB_URL` | Web client URL | `http://localhost:3000` |
| `GATEWAY_URL` | Gateway URL (used to prepare data through the API) | `http://localhost:8082` |
| `KEYCLOAK_URL` / `KEYCLOAK_AUTH_PREFIX` | SSO. The `/auth` prefix only exists in local Docker | `http://localhost:8080` / `/auth` |
| `KEYCLOAK_REALM` / `KEYCLOAK_CLIENT_ID` | OIDC realm and client | `chariot` / `chariot-app` |
| `LOCALE` | UI language under test. Selectors use the FR labels | `fr` |
| `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD` | Admin account used **only** to create the test accounts | `admin` / `admin` |
| `E2E_GM_USERNAME` / `E2E_PLAYER_USERNAME` / `E2E_USER_PASSWORD` | Test accounts | see `env.example` |

`.env` is never committed (it is listed in `tools/e2e/.gitignore`).

### Test accounts

At the start of every run, `scenarios/auth.setup.ts`:

1. creates `e2e-gm` and `e2e-player` in Keycloak if they do not exist, and resets their password;
2. logs in with each account through the real Keycloak form;
3. saves the browser session (SSO cookies + `localStorage`) to `tools/e2e/.auth/<role>.json`.

Scenarios then reuse these sessions: they start **already logged in**, without going through the login screen again.

> On a hosted environment (integ), leave `KEYCLOAK_ADMIN_*` empty and provide dedicated test accounts created beforehand. Never use real user accounts.

---

## 3. Running tests

### From the repository root

```bash
make e2e
```

```bash
make e2e FILTER=session
```

`FILTER` selects tests whose title (or file name) contains the given text.

```bash
make e2e-ui
```

```bash
make e2e-report
```

### From `tools/e2e/` (more options)

```bash
npx playwright test scenarios/session/rejoindre-session.spec.ts
```

```bash
npx playwright test scenarios/session/rejoindre-session.spec.ts:11
```

```bash
npx playwright test --headed
```

```bash
npx playwright test --debug
```

```bash
npx playwright test --last-failed
```

```bash
npx playwright test --repeat-each=5 -g "rejoint"
```

| Option | Effect |
| --- | --- |
| `file.spec.ts:11` | Runs only the test defined on line 11 |
| `-g "text"` | Filters by title (regular expression) |
| `--headed` | Shows the browser while running |
| `--debug` | Opens the Playwright Inspector, step-by-step execution |
| `--last-failed` | Re-runs only the tests that failed last time |
| `--repeat-each=5` | Repeats each test 5 times, to detect a flaky test |
| `--project=scenarios` | Skips other projects (setup still runs, it is a dependency) |

> ⚠️ Do not pass `--reporter=...` on the command line if you want the HTML report: this option **replaces** the reporters from the config, and `reports/html` is not regenerated.

### Execution order

The config declares two projects:

1. **`setup`**: `auth.setup.ts` (accounts + SSO sessions);
2. **`scenarios`**: every `*.spec.ts`, which depend on `setup`.

Tests run **one at a time** (`workers: 1`): they share the same accounts, and two simultaneous WebSocket sessions for the same user would skew the results.

---

## 4. Folder structure

```
tools/e2e/
├── playwright.config.ts        # config: projects, timeouts, reporters, trace/video/screenshots
├── env.example                 # .env template
├── scenarios/                  # the tests, one folder per functional domain
│   ├── auth.setup.ts           # setup: test accounts + SSO sessions
│   ├── auth/connexion.spec.ts
│   ├── campagne/creation-campagne.spec.ts
│   └── session/rejoindre-session.spec.ts
├── src/                        # shared tooling (imported via @/…)
│   ├── env.ts                  # .env loading, uniqueLabel(), .auth/ paths
│   ├── keycloak.ts             # account provisioning, tokens
│   ├── api.ts                  # ChariotApi: gateway calls (setup / cleanup)
│   ├── auth.ts                 # loginThroughKeycloak(): login through the SSO form
│   ├── fixtures.ts             # `gm` and `player` actors
│   └── flows.ts                # reusable UI journeys
├── .auth/                      # saved sessions (generated, git-ignored)
├── test-results/               # traces, videos, screenshots of the last run (generated)
└── reports/html/               # HTML report (generated)
```

### The `gm` and `player` fixtures

A fixture is an object Playwright prepares before the test and tears down after it. You request it as a parameter:

```ts
test("…", async ({ gm, player }) => { … });
```

Each actor provides:

| Property | Description |
| --- | --- |
| `gm.page` | A page in an **isolated browser**, already logged in as the GM |
| `gm.api` | An HTTP client authenticated as the same account (`ChariotApi`) |

The GM and the player each have their own cookies, `localStorage` and WebSocket: the equivalent of two people on two computers. At the end of the test, each actor's video is attached to the report ("vidéo MJ", "vidéo Joueur").

Only request the actors you need: a test that only asks for `gm` does not open a player browser.

For a test **without a pre-existing session** (the login test, for example), use the standard `page` fixture by importing `test` from `@playwright/test` instead of `@/fixtures`.

---

## 5. Writing a new scenario

### Step 1: check the functional rule

Before writing the test, find the `FR-*` rule describing the expected behavior in [`docs/functional-rules.md`](../functional-rules.md). The test **verifies the rule**, it does not define it. If the behavior is not described anywhere, follow the workflow in [`AGENTS.md`](../../AGENTS.md).

### Step 2: create the file

One file per journey, in the domain folder, kebab-case, with the `.spec.ts` suffix:

```
tools/e2e/scenarios/personnage/duplication-personnage.spec.ts
```

### Step 3: template

```ts
import { uniqueLabel } from "@/env";
import { expect, test } from "@/fixtures";

/**
 * FR-character-duplicate: duplicating creates an independent copy
 * named "<name> (copie)".
 */
test.describe("Duplication de personnage", () => {
  test("le joueur duplique un personnage depuis la sidebar", async ({ player }) => {
    // 1. ARRANGE: prepare data through the API (fast, reliable)
    const character = await player.api.createPlayer(uniqueLabel("Brom"));

    try {
      // 2. ACT: drive only the journey under test in the UI
      await test.step("ouvrir la fiche", async () => {
        await player.page.goto(`/fr/characters/${character._id}`);
      });

      await test.step("dupliquer depuis le menu contextuel", async () => {
        await player.page.getByRole("button", { name: /actions/i }).click();
        await player.page.getByRole("menuitem", { name: "Dupliquer" }).click();
      });

      // 3. ASSERT: check what the user sees
      await test.step("la copie apparaît dans la sidebar", async () => {
        await expect(
          player.page.getByRole("navigation").getByText(`${character.firstname} (copie)`),
        ).toBeVisible();
      });
    } finally {
      // 4. CLEANUP: always, even if the test fails
      await player.api.deleteCharacter(character._id);
    }
  });
});
```

> The selectors in this example are illustrative: check the real labels with the code generator (§ 6) or in `services/web/client/messages/fr.json`.

### Five rules for a good scenario

1. **Prepare through the API, test through the UI.** If the test is about joining a session, the player's character is created with `player.api.createPlayer()`, not by filling in the form. The test runs faster and does not fail because of an unrelated screen.
2. **Unique data.** `uniqueLabel("Aria")` produces `[e2e] Aria lx3k9a`: no collisions between runs, and test data is easy to spot.
3. **Cleanup in a `finally`.** Everything that is created gets deleted, even if an assertion fails.
4. **Split with `test.step()`.** Each step shows up with its name and duration in the report and the trace. Name steps from the user's point of view ("MJ : lancer une session").
5. **One test = one behavior.** Cover a nominal case, at least one edge case and one error case, as for unit tests (AGENTS.md § 9).

### Adding an API call

If setup needs an endpoint missing from `ChariotApi`, add it to `src/api.ts`:

```ts
async createGroup(campaignId: string, label: string): Promise<{ _id: string }> {
  const res = await this.request<Envelope<{ _id: string }>>("POST", "/groups", {
    label,
    campaigns: [{ idCampaign: campaignId, type: "active" }],
  });
  return res.data;
}
```

- Adventure routes are prefixed with `/api` (added automatically).
- Session routes start with `/session/…` and do not go through `/api` (handled automatically).
- To find the expected payload, look at the matching web service (`services/web/client/src/services/*Service.ts`) and the API DTO.

### Adding a reusable journey

If several scenarios repeat the same sequence of UI actions, extract it into `src/flows.ts`. Existing examples: `createCampaignFromWelcome()` and `launchSessionFromSidebar()`.

### Code constraints

- Imports through the `@/` alias only, never relative paths (AGENTS.md § 11.1).
- `describe`, `test` and `test.step` titles in French, to match the existing scenarios.
- Type-check before committing:

```bash
cd tools/e2e && npx tsc --noEmit
```

---

## 6. Editing an existing scenario

### The code generator (codegen)

The easiest way to find the right selectors: open an **already logged-in** browser and click around. Playwright writes the matching code.

```bash
cd tools/e2e && npx playwright codegen --load-storage=.auth/gm.json http://localhost:3000/fr/welcome
```

- Replace `gm.json` with `player.json` for the other role (the files are created on the first `make e2e`).
- Each click generates a line such as `await page.getByRole('button', { name: '…' }).click();`.
- The "Pick locator" button gives an element's selector without performing an action.
- Copy the useful lines into the scenario, then replace `page` with `gm.page` or `player.page`.

Generated code is a **draft**: split it into `test.step` blocks, add assertions and remove unnecessary clicks.

### Iterating quickly

1. Run `make e2e-ui`.
2. Enable **watch mode** (the 👁 icon next to the file): the test re-runs on every save.
3. Edit the file in your editor and watch the result.

### Setting a breakpoint

Temporarily add to the test:

```ts
await gm.page.pause();
```

Then run in headed mode:

```bash
cd tools/e2e && npx playwright test -g "rejoint" --headed
```

Execution stops and the Playwright Inspector opens: you can inspect the page, try selectors, then resume. **Do not commit** `pause()` calls.

### Temporarily disabling a test

| Annotation | Usage |
| --- | --- |
| `test.skip("…", …)` | Skips the test (explain why in a comment) |
| `test.fixme("…", …)` | Known broken test, to be fixed |
| `test.only("…", …)` | Runs only this test. Handy locally, **forbidden in CI** (`forbidOnly`) |
| `test.slow()` | Triples the test timeout |

---

## 7. Choosing selectors

Order of preference:

| Priority | Selector | Example |
| --- | --- | --- |
| 1 | Role + accessible name | `getByRole("button", { name: "Lancer une session" })` |
| 2 | Form label | `getByLabel("Nom de la campagne")` |
| 3 | Visible text | `getByText("Campagne X créée avec succès !")` |
| 4 | Stable `id` attribute | `locator("#kc-login")` (Keycloak form only) |
| ✗ | CSS classes, XPath, position | `locator(".btn-yellow > div:nth-child(2)")` |

**Why role first?** Screen readers rely on it. If a test can no longer find `getByRole("button", { name: "…" })`, a button has often lost its accessible name: **a broken selector also reveals an accessibility regression**.

### The accessible name is not always the visible text

When an element has an `aria-label`, **that** is its accessible name, not the visible text. Example on the welcome page: the button displays "Créer une campagne", but its name is "Naviguer vers la création de campagne".

To find the exact name: use "Pick locator" in codegen or UI mode, or read the accessibility snapshot in `error-context.md` (§ 12).

### Narrowing the search

When a text appears several times, chain locators:

```ts
gm.page.getByRole("dialog", { name: "Créer une nouvelle campagne" }).getByRole("button", { name: "Sauvegarder" });
```

### Where to find labels

All UI strings come from `services/web/client/messages/fr.json`. If a label changes there, the tests using it must be updated.

---

## 8. Assertions and waiting

### Playwright waits on its own

Actions (`click`, `fill`…) wait for the element to be visible, stable and enabled. `expect(locator)` assertions retry until their timeout (15 s in our config).

```ts
// ✅ Retries until the text appears
await expect(gm.page.getByText(characterName)).toBeVisible();

// ❌ Checks once, immediately: fails if the WebSocket has not answered yet
expect(await gm.page.getByText(characterName).isVisible()).toBe(true);
```

Always write `await expect(locator).toBe…()`, never `expect(await …)`.

### Common assertions

| Assertion | Checks |
| --- | --- |
| `toBeVisible()` / `toBeHidden()` | On-screen presence |
| `toHaveText("…")` / `toContainText("…")` | Text content |
| `toBeEnabled()` / `toBeDisabled()` | State of a button or field |
| `toHaveValue("…")` | Field value |
| `toHaveCount(n)` | Number of matching elements (`0` for "absent") |
| `expect(page).toHaveURL(/regex/)` | Current URL |

### Avoid fixed waits

`page.waitForTimeout(ms)` makes tests slow and flaky. The only legitimate exception: proving that **an event does not happen** within a given time. Example in `rejoindre-session.spec.ts`: we wait 5 s (beyond the gateway's 3 s grace period) before checking that no disconnect toast appeared. Always justify this case with a comment.

### Reading a network response

To grab data returned by the API during a UI journey (a session's OTP code, for example):

```ts
const responsePromise = page.waitForResponse((res) => res.url().endsWith("/session/sessions"));
await page.getByRole("button", { name: "Lancer une session" }).click();
const body = await (await responsePromise).json();
```

Declare the wait **before** the click, otherwise the response may arrive before listening starts.

---

## 9. UI mode

```bash
make e2e-ui
```

This is the main tool for **developing and exploring** tests.

```
┌──────────────────┬───────────────────────────────────────────────┐
│ Test list        │  Timeline (screen thumbnails over time)        │
│ ▶ setup          ├──────────────────┬────────────────────────────┤
│ ▶ auth           │ Actions / steps  │  DOM snapshot at the        │
│ ▶ campagne       │                  │  selected step              │
│ ▶ session        │                  │                             │
│                  ├──────────────────┴────────────────────────────┤
│ Filters, watch   │ Locator · Source · Call · Log · Errors ·        │
│                  │ Console · Network · Attachments                 │
└──────────────────┴───────────────────────────────────────────────┘
```

| Area | Usage |
| --- | --- |
| **Test list** (left) | ▶ runs a test, a file or everything. 👁 enables watch mode. Filters by status and project. |
| **Timeline** (top) | Screen thumbnails throughout the test. Hovering the timeline shows the page state at each moment. |
| **Actions** | Every `click`, `fill`, `expect` and `test.step`. Clicking an action shows the DOM **as it was at that moment**. |
| **DOM snapshot** | Not an image: the real, inspectable DOM. The *Before* and *After* tabs show the page before and after the action. |
| **Pick locator** | Clicking an element in the snapshot gives its recommended selector. |
| **Bottom tabs** | *Source*: test line. *Console*: browser logs. *Network*: HTTP requests. *Errors*: failure message. |

> Important: in UI mode, the `setup` project must have run at least once so that `.auth/*.json` exists. If tests fail on a Keycloak page, run `setup` first from the list.

---

## 10. The HTML report

Every `make e2e` generates `tools/e2e/reports/html/`. To open it:

```bash
make e2e-report
```

The report is served at `http://localhost:9323`. It is a self-contained folder: you can zip it and share it, or publish it as a CI artifact.

### Home page

- **Top**: *All / Passed / Failed / Flaky / Skipped* counters. Clicking one filters the list.
- **Search bar**: filters by text, or with the `s:failed`, `p:scenarios`, `@tag` syntax.
- **List**: one test per row, grouped by file, with duration and status.

### Test page

Clicking a test opens its page:

1. **Title, file:line, duration, "View Trace" button**.
2. **Errors** (on failure): message, expected / received, code excerpt with the offending line.
3. **Test Steps**: the scenario's `test.step` blocks, each expandable down to individual actions, with its duration. An orange bar shows where the time goes. This is where you see **where** a slow test spends its time.
4. **Screenshots**: end-of-test screenshot (and the failure screenshot, if any).
5. **Videos**: one video per browser. For a multi-actor test: "vidéo MJ" and "vidéo Joueur".
6. **Traces**: link to the full trace (§ 11).
7. **Attachments**: attached files, including `error-context.md` on failure.

### Statuses

| Status | Meaning |
| --- | --- |
| ✅ Passed | Succeeded |
| ❌ Failed | Failed, needs fixing |
| ⚠️ Flaky | Failed then passed on retry (CI only, `retries: 1`). **Treat it as a bug**: the test or the app has a race condition. |
| ⏭ Skipped | Skipped (`test.skip`, `test.fixme`) |

---

## 11. The Trace Viewer: replaying a run step by step

A trace is the full recording of a test: every action, the DOM before and after, the network, the console. Traces are recorded for **every** test (`trace: "on"`).

### Opening a trace

- From the report: the **View Trace** button on the test page.
- From the command line, with the path printed in the test output:

```bash
cd tools/e2e && npx playwright show-trace test-results/<test-folder>/trace.zip
```

- Without installing anything: drag the `trace.zip` onto [trace.playwright.dev](https://trace.playwright.dev). The file is read locally by the browser and is not uploaded.

### Reading a trace

The interface is the same as UI mode (§ 9), read-only. How to understand a test:

1. **Go through the action list**: `test.step` blocks structure the run.
2. **Click the failed action** (in red) and look at the **Before** tab: that is the page state when Playwright was looking for the element.
3. **Log tab**: what Playwright did ("waiting for…", "element is not visible", "retrying…").
4. **Network tab**: a 4xx or 5xx API request often explains an empty screen.
5. **Console tab**: frontend JavaScript errors.

### Multi-actor tests

A trace contains **every browser** in the test. GM and player actions are interleaved in chronological order. The page tab above the snapshot shows which browser is displayed. To follow a single actor end to end, the matching video is often easier to read.

---

## 12. Diagnosing a failure

### Method

1. **Read the message in the terminal or the report.** It gives the action, the selector and the line.
2. **Open `error-context.md`** (in `test-results/<test>/` or attached in the report). It contains the error, the **page's accessibility snapshot** at the time of the failure and the code excerpt. This is often enough.
3. **Look at the screenshot and the video** to see what the user would have seen.
4. **Open the trace** for action-by-action detail.
5. **Reproduce**: `npx playwright test <file>:<line> --headed`, or in UI mode.

### Reading the accessibility snapshot

```yaml
- main:
  - heading "Bienvenue sur Chariot" [level=1]
  - list "Choix disponibles pour commencer":
    - listitem:
      - button "Naviguer vers la création de campagne": Créer une campagne
- dialog "Nouveautés":
  - heading "Nouveautés" [level=2]
```

- `button "X": Y`: the accessible name is **X** (pass that to `getByRole`), Y is the displayed text.
- `[aria-hidden]` on an area: it is hidden behind a modal. Look for an open `dialog` elsewhere in the snapshot.
- `[disabled]`: the element exists but is disabled.

### Common errors

| Message | Likely cause | Lead |
| --- | --- | --- |
| `locator.click: Timeout 15000ms exceeded` + `waiting for getByRole(…)` | Element not found: wrong accessible name, or page hidden behind a modal | Snapshot in `error-context.md`. Look for an unexpected `dialog` or an `[aria-hidden]` |
| `strict mode violation: … resolved to 2 elements` | The selector matches several elements | Narrow with a parent (`getByRole("dialog").getByRole(…)`) |
| `expect(page).toHaveURL … Received: …/welcome` | Different redirect than expected | Check the navigation rule and the entry point (§ 13) |
| `HTTP 500 … validation failed: X is required` | Incomplete setup data | Complete the call in `src/api.ts` (see the API DTO and the web form's default values) |
| `Connexion Keycloak impossible … HTTP 401` | Wrong password or missing account | Check `.env` and `KEYCLOAK_ADMIN_*` |
| The test page is on `localhost:8080/auth/…` | Expired SSO session or missing `.auth/` | Re-run the `setup` project (or `make e2e`) |
| `ECONNREFUSED localhost:3000` | The stack is not running | `make up ENV=dev` |

### Fails in CI but not locally

- Download the HTML report published as an artifact, then open the trace.
- Run locally with `--repeat-each=10`: an intermittent failure reveals a race condition.
- Do not "fix" it by adding `waitForTimeout`: find the event to wait for (text, network request, URL).

---

## 13. Known Chariot pitfalls

| Pitfall | What happens | How it is handled |
| --- | --- | --- |
| **"Nouveautés" modal** (FR-release-notes) | It opens on every new version and makes the rest of the page `aria-hidden`: no button can be found. | `auth.setup.ts` mutes it for test accounts through the `chariot_release_notes_muted_<userId>` key. A test without a storageState (login) will see it. |
| **Post-login redirect** (FR-post-auth-navigation) | It only fires when arriving through the root (`/fr`), not through `/fr/welcome`, `/characters/…` or `/campaigns/…`. | `loginThroughKeycloak()` starts from `/fr`. |
| **`?join=CODE` and redirects** | If the player has a character without a group, the root redirects to that character's sheet and drops the parameter. | Open the invite link on a page that does not redirect (a character sheet). |
| **Accessible name ≠ text** | `aria-label` takes precedence over the displayed text. | Use the name from the snapshot or "Pick locator". |
| **`--reporter` on the command line** | Replaces the config's reporters: no HTML report. | Use `make e2e`, or do not pass `--reporter`. |
| **Shared WebSocket sessions** | Two parallel tests on the same accounts interfere (roster, toasts). | `workers: 1`. |
| **Session left open** | A test failing before its cleanup can leave an active session. | `leaveSession()` in the `finally`. `[e2e]` data is easy to find for manual cleanup. |
| **Automatic screenshots** | `screenshot: "on"` only captures the default page, not the actors' pages. | Use the GM and player videos, or the trace. |

---

## 14. Command reference

| From the root | Equivalent in `tools/e2e/` | Effect |
| --- | --- | --- |
| `make e2e-install` | `npm ci && npx playwright install chromium` | Setup |
| `make e2e` | `npx playwright test` | All scenarios + HTML report |
| `make e2e FILTER=x` | `npx playwright test --grep "x"` | Filtered scenarios |
| `make e2e-ui` | `npx playwright test --ui` | UI mode |
| `make e2e-report` | `npx playwright show-report reports/html` | Opens the report |
| — | `npx playwright test --headed` | Visible browser |
| — | `npx playwright test --debug` | Step-by-step inspector |
| — | `npx playwright test --last-failed` | Re-runs failures |
| — | `npx playwright show-trace <trace.zip>` | Opens a trace |
| — | `npx playwright codegen --load-storage=.auth/gm.json <url>` | Generates code from clicks |
| — | `npx tsc --noEmit` | Type check |

### Resources

- [Playwright documentation](https://playwright.dev/docs/intro)
- [Best practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- "Playwright Test for VSCode" extension: run and debug tests from the editor, with a ▶ button in the gutter of each test.
