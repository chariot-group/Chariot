# 📦 Dependency Update Policy

How dependencies are kept up to date in **Chariot**, and which packages are deliberately pinned.

## 🤖 Dependabot

Configuration: [`.github/dependabot.yml`](../../.github/dependabot.yml).

- Every npm service, Dockerfile and GitHub Actions workflow is scanned.
- Schedule: Saturday and Sunday at 02:00 (Europe/Paris), at most 5 open PRs per entry.
- Updates are grouped per ecosystem entry: one **minor-and-patch** group and one **major** group.
- Major updates are **not** ignored by default. Only the packages listed below are held back.

## 🧱 Runtime requirements

| Where | Node version | Why |
| --- | --- | --- |
| NestJS services (adventure, gateway, session, media, payment) | `>=24.9.0` (`engines`) | NestJS 12 is ESM-only; Jest needs `--experimental-vm-modules` and Node 24.9+ |
| Docker images | `node:26-alpine` | Current runtime for all services |
| GitHub Actions | Node 24 | Same constraint as above |

Notes:

- Local development is done through Docker, so the host Node version does not matter.
- `npm` only warns (`EBADENGINE`) on a mismatching Node; it does not block unless `engine-strict` is enabled.
- NestJS test scripts run `node --experimental-vm-modules ./node_modules/jest/bin/jest.js`. Do not replace them with a bare `jest` call.
- NestJS service `tsconfig.json` files use `module`/`moduleResolution: nodenext`, `target: ES2023`, `useDefineForClassFields: false` and `strict: false` to keep the runtime semantics of NestJS 11 (Mongoose schemas, DTOs, decorator metadata). Do not change them as a side effect of another update.

## 📌 Deliberate pins

| Package | Scope | Held at | Reason | Lift when |
| --- | --- | --- | --- | --- |
| `typescript` (major) | all services | `~6.0.x` | `typescript-eslint` peer range is `<6.1.0`; TypeScript 7 has no programmatic API | `typescript-eslint` supports TS 7 and `emitDecoratorMetadata` is confirmed working |
| `stripe` (server SDK) | payment (major only), gateway, session (all updates ignored) | `^20` in payment | Moving to v23 changes the pinned API version and removes `payment_method_types` from Checkout Sessions, which affects what customers can pay with. Needs its own ticket and a real Stripe test-mode run | A dedicated ticket decides the payment-method policy |
| `@stripe/*` | gateway, session | current version | Follows the server SDK | Same ticket as `stripe` |
| `@opentelemetry/api` | payment, media, web | `^1.10.0` | `@opentelemetry/resources` 3.x requires `api` `>=1.10.0 <1.11.0` | Peer range of `resources` widens |
| `@typescript-eslint/*` | session | `^8.72.0` | Must stay on one minor with its peers to avoid `ERESOLVE` | Next coordinated bump |

Pins that are enforced by Dependabot (`typescript`, `stripe`, `@stripe/*`) live in `.github/dependabot.yml`; the others are version ranges in `package.json` that npm resolves. Every pin, whichever kind, must have a row in this table.

## ✅ Checklist for a major update

1. Read the changelog / migration guide of the package.
2. Run `npm ci`, lint, build and the test suite of the service **in Docker** (same image as production).
3. Start the service and check it reaches its external dependencies (Keycloak, Redis, Mongo, Postgres, Stripe) without module errors.
4. Build the production image (`Dockerfile.prod`) from a clean context and start it.
5. For session / WebSocket changes, follow section 10 of [`AGENTS.md`](../../AGENTS.md) and replay the integration scenarios (join, refresh, reconnect, leave, combat sync, service restart).
6. If a pin is added or lifted, update `dependabot.yml` (when applicable) and the table above.

## 🧹 Lockfiles

- Lockfiles are regenerated with the npm bundled with Node 26 (npm 11), so diffs can be noisy. Review `package.json` and `tsconfig.json` changes; treat lockfile diffs as generated.
- Always commit `package.json` and `package-lock.json` together.
