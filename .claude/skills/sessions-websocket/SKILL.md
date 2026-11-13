---
name: sessions-websocket
description: >-
  Mandatory pre-work, architecture map, known pitfalls and test anchors for Chariot's
  session / WebSocket subsystem (AGENTS.md §10). Load before any change touching sessions,
  the session lobby, WebSocket / Socket.IO, the session socket pool, the NestJS session
  gateway, roster / participants, battle sync (combat snapshot, late join), character
  sheet sync, or sessionSlice.
---

# Sessions & WebSocket (Chariot)

Session and WebSocket code is a **cross-cutting, stateful subsystem** spanning frontend layout, session lobby, initiative tracker, character sheets, Redux persist, and the NestJS session gateway. Changes here have caused regressions from seemingly small diffs (duplicate connections, false disconnect toasts, roster wipes on reconnect). Treat this domain as **high attention** by default.

Sources of truth: `AGENTS.md` (gate) and `docs/functional-rules.md` (rules). When they disagree with this skill, they win. Use the `functional-rules` skill (`fr.sh show <slug>`) to read rules without loading the whole file.

## 1. Mandatory Pre-Work

Before proposing or implementing any session or WebSocket change, the agent MUST:

1. Read applicable functional rules: **FR-user-cache-isolation**, **FR-session-combat-navigation**, **FR-session-combat-sync**, **FR-session-participant-labels**, **FR-session-lobby-navigation**, **FR-session-websocket-lifecycle** (and **FR-combat-initiative-tracker** / **FR-tracker-vital-status** when combat tracker behavior is involved).
2. Trace the full path: **emitter client → gateway handler → broadcast → consumer client(s) → Redux/local state**.
3. Classify the change into one primary category:
   - **Connection lifecycle** (pool, JWT refresh, reconnect, session end)
   - **Roster / participant state** (join, leave, disconnect, display names)
   - **Combat sync** (battle snapshot, visibility, late join)
   - **Character sheet sync** (sheet updates, tracker mirror, local echo for GM)
4. Identify all subscribers to the shared socket pool — never assume only the session lobby page holds the connection.
5. Never treat session work as frontend-only; gateway timing and broadcast semantics are part of the contract.

## 2. Architecture Snapshot

Client paths are relative to `services/web/client/src/`.

| Layer | Responsibility | Key files |
| --- | --- | --- |
| Connection pool | One Socket.IO client per OTP code, shared refCount | `lib/sessionSocketPool.ts` |
| Layout subscriber | Persistent WS while `isInSession`, join on connect, roster HTTP fallback | `components/SessionCharacterSyncClient.tsx` |
| Lobby subscriber | Session page actions (launch, tokens, leave) + Redux merge | `hooks/useSessionSocket.ts` |
| Battle sync | GM broadcast / player apply / late-join request | `hooks/useSessionBattleSync.ts`, `lib/sessionBattleSyncBridge.ts` |
| Sheet sync | Emit + local echo (GM not echoed by gateway) | `lib/sessionCharacterSyncBridge.ts` |
| Roster merge | Keep WS-assigned `characterId` across HTTP sync | `lib/sessionParticipantMerge.ts` |
| Participant labels | Display-name resolution chain | `lib/formatSessionParticipantUserLabel.ts` |
| Redux state | Roster, combat, display names, persistence | `store/slices/sessionSlice.ts` |
| Gateway | Auth, rooms, grace-period disconnect, broadcast validation | `services/session/api/src/resources/session/session.gateway.ts` |

**Naming trap**: WebSocket field `sessionId` = **OTP session code**, not the internal DB UUID.

**Broadcast trap**: Gateway uses `client.to(room)` — the emitter does not receive its own event. GM/local updates need explicit client-side listeners (FR-session-combat-sync).

## 3. Lessons from `hotfix/sessions` (Non-Exhaustive Pitfall List)

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

## 4. Mandatory Test Coverage

Any session or WebSocket change MUST include or update focused tests covering at minimum:

1. **Nominal** path for the touched event or lifecycle step.
2. **One reconnect or race edge** (JWT refresh, rapid disconnect/rejoin, debounced HTTP sync).
3. **One failure or guard case** when applicable (unauthorized broadcast, missing roster character, pool OTP switch).

Existing test anchors:

- `services/web/client/src/lib/__tests__/sessionSocketPool.test.ts`
- `services/web/client/src/lib/__tests__/sessionCharacterSyncBridge.test.ts`
- `services/web/client/src/lib/__tests__/formatSessionParticipantUserLabel.test.ts`
- `services/session/api/src/resources/session/session.gateway.spec.ts`
- `services/web/client/src/store/slices/__tests__/sessionSlice.*.test.ts` (battleSnapshot, deathStatus, gmGuest, lobbyModal, playerVisibility, roster)

## 5. Checklist Before Coding

- [ ] Listed applicable FR IDs and confirmed no functional conflict.
- [ ] Mapped emitter → gateway → all consumers (including layout-level `SessionCharacterSyncClient`).
- [ ] Verified pool acquire/release balance for every new subscriber.
- [ ] Confirmed JWT/token changes do not recreate the socket effect.
- [ ] Confirmed gateway broadcasts use persisted authoritative data, not optimistic client payload alone.
- [ ] Planned tests for nominal + reconnect/race + failure case.
- [ ] For UI-facing changes: accessibility remains in scope (FR-frontend-design).
