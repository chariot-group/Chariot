---
name: functional-rules
description: >-
  Manage Chariot functional rules in docs/functional-rules.md following AGENTS.md
  workflow. Use when adding, updating, or implementing features tied to functional
  rules, when citing FR-* rule IDs, or when validating Covered/Missing/Conflict status
  before coding.
---

# Functional Rules (Chariot)

## Source of truth

- **Functional rules**: `docs/functional-rules.md`
- **Design baseline** (frontend): `docs/design.md`
- **Agent workflow gate**: `AGENTS.md` (MUST follow before any behavior change)
- **Numeric IDs** (`FR-001`…`FR-038`) are deprecated — use slug IDs from `docs/functional-rules.md` only

## Identifier convention

- Format: `FR-{domain}-{feature}` (kebab-case, English)
- Examples: `FR-session-websocket-lifecycle`, `FR-sidebar-quick-links`
- Sub-rules: `###` sections inside the parent rule — never numeric suffixes (e.g. avoid `FR-027-B`)
- New rules: append at **end** of `docs/functional-rules.md`

## Mandatory workflow (before coding)

1. Read `docs/functional-rules.md` and identify applicable rule slugs.
2. For frontend UI: also read `docs/design.md`; accessibility is mandatory (FR-frontend-design).
3. Classify the request:
   - **Covered** — applicable rule(s) exist, no conflict
   - **Missing rule** — draft new rule at file end, stop for confirmation
   - **Conflict** — explain conflict, propose options, stop for confirmation
4. Output the AGENTS.md decision summary (status, rules, action, confirmation gate).
5. **Do not implement** until the user confirms functionally.

## Adding a new rule

Write a concise, testable rule block:

```markdown
## FR-{domain}-{feature}: Short title

**Rule**: One-sentence normative statement.

**Requirements**:
- ...

**Prohibitions**:
- ...

**Tests**:
- Nominal: ...
- Edge: ...
- Failure: ... (when applicable)

**References**:
- paths to key files
```

Then request explicit functional confirmation before implementation.

## High-attention domain: sessions & WebSocket

Before session/WebSocket changes, read at minimum:

- FR-user-cache-isolation
- FR-session-combat-navigation
- FR-session-combat-sync
- FR-session-participant-labels
- FR-session-lobby-navigation
- FR-session-websocket-lifecycle
- FR-combat-initiative-tracker / FR-tracker-vital-status when combat tracker is involved

Trace: **emitter → gateway → broadcast → all consumer clients → Redux/local state**.

See AGENTS.md §10 for architecture snapshot, pitfall list, and mandatory test coverage.

## Cross-referencing in code

Use slug IDs in `@see`, test `describe` blocks, and comments:

```typescript
/** @see FR-user-password-change: User Password Change */
describe("FR-session-combat-sync — local sheet sync", () => { ... });
```

## Quick slug lookup (common rules)

| Domain | Slug IDs |
| --- | --- |
| Auth / user | FR-user-password-change, FR-user-profile-keycloak, FR-user-cache-isolation, FR-post-auth-navigation |
| Characters | FR-character-universal-fields, FR-dnd-conditions, FR-character-detail-view, FR-character-duplicate |
| Combat / tracker | FR-combat-initiative-tracker, FR-tracker-vital-status, FR-session-combat-navigation, FR-session-combat-sync |
| Session | FR-session-websocket-lifecycle, FR-session-participant-labels, FR-session-lobby-navigation, FR-session-join-qr-code |
| UI / design | FR-frontend-design, FR-sidebar-navigation, FR-sidebar-context-actions, FR-form-field-validation |
| Admin / payment | FR-stripe-checkout, FR-admin-promo-lifecycle, FR-admin-affiliation-lifecycle |
