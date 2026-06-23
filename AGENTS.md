# AGENTS.md - Functional Decision Gate

This file defines the mandatory functional workflow for any AI agent operating in this repository.

## Normative Keywords

The keywords **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are to be interpreted as requirement levels.

## 1) Scope and Goal

- The functional source of truth is `docs/functional-rules.md`.
- The frontend design baseline source of truth is `docs/design.md`.
- Before any implementation, the agent MUST validate that the request is functionally covered.
- Before any frontend feature implementation (UI, page, component, style, responsive behavior), the agent MUST read `docs/design.md` and align with its rules.
- For every frontend ticket, accessibility MUST be treated as a mandatory acceptance criterion, not an optional enhancement.
- The agent MUST obtain explicit functional confirmation before writing production code.

## 2) Mandatory Execution Flow

For every new request that can impact behavior:

1. The agent MUST read `docs/functional-rules.md`.
2. For any frontend feature request, the agent MUST read `docs/design.md` before proposing or writing UI code.
3. The agent MUST identify rules applicable to the requested module/feature.
4. For frontend requests, the agent MUST explicitly include accessibility checks in the implementation/validation scope.
5. The agent MUST classify the request into one of these states:
   - **Covered**: at least one applicable rule exists and no conflict is detected.
   - **Missing rule**: no applicable rule exists.
   - **Conflict**: request contradicts one or more existing rules.
6. The agent MUST follow the corresponding branch in sections 3, 4, or 5.
7. The agent MUST ask for explicit functional confirmation before implementation.

## 3) Branch A - Covered by Existing Rules

If the request is **Covered**:

1. The agent MUST list the rules it will apply.
2. The agent MUST implement in strict compliance with those rules.
3. The agent MUST NOT silently deviate from rule intent.
4. The agent MUST still request functional confirmation before starting implementation.

## 4) Branch B - Missing Functional Rule

If the request is **Missing rule**:

1. The agent MUST draft and write a new functional rule in `docs/functional-rules.md`.
2. The rule MUST use a stable slug identifier: `FR-{domain}-{feature}` (kebab-case, English). Numeric IDs (`FR-001` … `FR-038`) are deprecated.
3. The agent MUST append the new rule at the **end** of `docs/functional-rules.md` to reduce merge conflicts across parallel branches.
4. The rule SHOULD be concise, testable, and implementation-agnostic (except essential technical constraints).
5. After writing the rule, the agent MUST stop and request explicit functional confirmation.
6. The agent MUST NOT start implementation before confirmation.

## 5) Branch C - Functional Conflict

If the request is in **Conflict** with existing rules:

1. The agent MUST NOT implement immediately.
2. The agent MUST explain the conflict clearly (request vs existing rule).
3. The agent MUST propose resolution options, at minimum:
   - Keep current rule(s)
   - Adopt new rule
   - Define compromise rule
4. The agent SHOULD provide impact and risk for each option.
5. The agent MUST request explicit functional confirmation on the selected option.
6. The agent MUST update `docs/functional-rules.md` accordingly before implementation starts.

## 6) Required Response Template (Before Coding)

Before any implementation, the agent MUST output a short decision summary using this structure:

1. **Functional status**: Covered | Missing rule | Conflict
2. **Applicable rules**: list of rule IDs (or "None")
3. **Proposed action**:
   - Covered: implementation plan under listed rules
   - Missing rule: new rule draft written
   - Conflict: options and recommendation
4. **Confirmation gate**: explicit request for functional confirmation

## 7) Fallbacks and Edge Cases

- If `docs/functional-rules.md` is missing or unreadable, the agent MUST stop and ask for guidance before coding.
- If rules are ambiguous, the agent MUST ask a clarification question and pause implementation.
- For non-functional-only requests (formatting, refactor without behavior change), the agent SHOULD still declare why no functional rule update is required, then ask for confirmation before proceeding.

## 8) Priority Order

When constraints compete, the agent MUST apply this precedence:

1. Explicit user-approved functional decision (current request)
2. `docs/functional-rules.md`
3. Other local conventions

No production implementation starts until the functional confirmation gate is passed.

## 9) Post-Implementation Satisfaction and Quality Pass

After a feature is implemented and presented to the user:

1. The agent MUST explicitly ask the user whether they are satisfied with the delivered feature.
2. When a feature is developed, the agent MUST add or update focused unit tests that cover expected behavior and provide non-regression protection for that feature.
3. The minimum expected unit-test coverage MUST include: one nominal case, at least one relevant edge case, and one error/failure case when applicable.
4. If the user confirms satisfaction, the agent MUST perform a dedicated cleanup and optimization pass before closure.
5. This pass MUST follow project technical standards from repository documentation (including `docs/*.md`), and SHOULD align with recent best practices of the technologies in use when compatible with project constraints.
6. As part of this pass, the agent MUST run the linter and relevant test suite(s), then report results.
7. If linter or tests fail, the agent MUST fix issues when feasible and rerun checks before considering the work complete.

## 10) High-Attention Domain: Sessions & WebSocket

Session and WebSocket code is a **cross-cutting, stateful subsystem** spanning frontend layout, session lobby, initiative tracker, character sheets, Redux persist, and the NestJS session gateway. Changes here have caused regressions from seemingly small diffs (duplicate connections, false disconnect toasts, roster wipes on reconnect). Treat this domain as **high attention** by default.

### 10.1 Mandatory Pre-Work

Before proposing or implementing any session or WebSocket change, the agent MUST:

1. Read applicable functional rules: **FR-user-cache-isolation**, **FR-session-combat-navigation**, **FR-session-combat-sync**, **FR-session-participant-labels**, **FR-session-lobby-navigation**, **FR-session-websocket-lifecycle** (and FR-combat-initiative-tracker/FR-tracker-vital-status when combat tracker behavior is involved).
2. Trace the full path: **emitter client → gateway handler → broadcast → consumer client(s) → Redux/local state**.
3. Classify the change into one primary category:
   - **Connection lifecycle** (pool, JWT refresh, reconnect, session end)
   - **Roster / participant state** (join, leave, disconnect, display names)
   - **Combat sync** (battle snapshot, visibility, late join)
   - **Character sheet sync** (sheet updates, tracker mirror, local echo for GM)
4. Identify all subscribers to the shared socket pool — never assume only the session lobby page holds the connection.
5. Never treat session work as frontend-only; gateway timing and broadcast semantics are part of the contract.

### 10.2 Architecture Snapshot

| Layer | Responsibility | Key files |
| --- | --- | --- |
| Connection pool | One Socket.IO client per OTP code, shared refCount | `sessionSocketPool.ts` |
| Layout subscriber | Persistent WS while `isInSession`, join on connect, roster HTTP fallback | `SessionCharacterSyncClient.tsx` |
| Lobby subscriber | Session page actions (launch, tokens, leave) + Redux merge | `useSessionSocket.ts` |
| Battle sync | GM broadcast / player apply / late-join request | `useSessionBattleSync.ts`, `sessionBattleSyncBridge.ts` |
| Sheet sync | Emit + local echo (GM not echoed by gateway) | `sessionCharacterSyncBridge.ts` |
| Redux state | Roster, combat, display names, persistence | `sessionSlice.ts` |
| Gateway | Auth, rooms, grace-period disconnect, broadcast validation | `session.gateway.ts` |

**Naming trap**: WebSocket field `sessionId` = **OTP session code**, not the internal DB UUID.

**Broadcast trap**: Gateway uses `client.to(room)` — the emitter does not receive its own event. GM/local updates need explicit client-side listeners (FR-session-combat-sync).

### 10.3 Lessons from `hotfix/sessions` (Non-Exhaustive Pitfall List)

| Symptom | Root cause | Required safeguard |
| --- | --- | --- |
| False "participant disconnected" toast on page refresh | Immediate gateway disconnect notification | 3s grace period + cancel on rejoin/leave (FR-session-websocket-lifecycle) |
| Double WebSocket connections | Layout + lobby each calling `io()` | Shared `sessionSocketPool` with refCount (FR-session-websocket-lifecycle) |
| Reconnect drops assigned character | Join broadcast used client payload `characterId: null` | Gateway broadcasts persisted roster `characterId` (FR-session-websocket-lifecycle) |
| Socket reconnects on every JWT refresh | Token included in pool connection key | Key = OTP code only; `syncSessionSocketAuth` for token (FR-session-websocket-lifecycle) |
| Roster flashes or loses WS updates | HTTP sync overwrites Redux participants | `mergeParticipantsPreserveCharacterIds` (FR-session-websocket-lifecycle) |
| Duplicate session-end toasts | Multiple components listen to `session:closed` / `session:expired` | `shouldShowSessionEndNotice` dedup (FR-session-websocket-lifecycle) |
| UUID shown as player name | Raw `userId` / email used before profile fetch | FR-session-participant-labels label resolution chain |
| GM sheet edit not reflected on tracker | No local echo (`client.to` excludes emitter) | `registerLocalCharacterSheetUpdatedListener` (FR-session-combat-sync) |
| `participant-left` not received by others | `client.to()` after `client.leave()` | `server.to(roomId)` on gateway (FR-session-websocket-lifecycle) |

### 10.4 Mandatory Test Coverage for Session/WS Changes

Any session or WebSocket change MUST include or update focused tests covering at minimum:

1. **Nominal** path for the touched event or lifecycle step.
2. **One reconnect or race edge** (JWT refresh, rapid disconnect/rejoin, debounced HTTP sync).
3. **One failure or guard case** when applicable (unauthorized broadcast, missing roster character, pool OTP switch).

Existing test anchors:

- `services/web/client/src/lib/__tests__/sessionSocketPool.test.ts`
- `services/web/client/src/lib/__tests__/sessionCharacterSyncBridge.test.ts`
- `services/web/client/src/lib/__tests__/formatSessionParticipantUserLabel.test.ts`
- `services/session/api/src/resources/session/session.gateway.spec.ts`
- `services/web/client/src/store/slices/__tests__/sessionSlice.*.test.ts`

### 10.5 Agent Checklist Before Coding

- [ ] Listed applicable FR IDs and confirmed no functional conflict.
- [ ] Mapped emitter → gateway → all consumers (including layout-level `SessionCharacterSyncClient`).
- [ ] Verified pool acquire/release balance for every new subscriber.
- [ ] Confirmed JWT/token changes do not recreate the socket effect.
- [ ] Confirmed gateway broadcasts use persisted authoritative data, not optimistic client payload alone.
- [ ] Planned tests for nominal + reconnect/race + failure case.
- [ ] For UI-facing changes: accessibility remains in scope (FR-frontend-design).

## 11) Technical Constraints

### 11.1 No Relative Imports

All TypeScript/JavaScript imports MUST use `@/` path aliases. Relative paths (`./` or `../`) are **forbidden** in all source files.

- **Correct**: `import { foo } from "@/lib/foo";`
- **Forbidden**: `import { foo } from "./foo";` or `import { foo } from "../../lib/foo";`

This applies to all files under `services/web/client/src/`. The `@/` alias resolves to `src/`.

When writing or editing any file, the agent MUST verify that no relative imports are introduced. If fixing or refactoring existing code that contains relative imports, the agent MUST convert them to `@/` aliases as part of the change.
