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

1. The agent MUST first decide **amend vs create** (section 4.1). Amending an existing rule is the default.
2. **Amend**: add the requirement (and its test lines) inside the existing rule, in place, as a bullet or a `###` sub-section. The rule keeps its slug and position.
3. **Create** (only when 4.1 allows it): the rule MUST use a stable slug identifier `FR-{domain}-{feature}` (kebab-case, English) and MUST be appended at the **end** of `docs/functional-rules.md` to reduce merge conflicts. Numeric IDs (`FR-001` … `FR-038`) are deprecated.
4. The rule SHOULD be concise, testable, and implementation-agnostic (except essential technical constraints).
5. After writing, the agent MUST stop and request explicit functional confirmation, stating whether it amended (which rule) or created (and why 4.1 required it).
6. The agent MUST NOT start implementation before confirmation.

### 4.1) Amend vs Create — avoid rule inflation

`docs/functional-rules.md` MUST stay a small set of meaningful rules, not a changelog of tickets.

- The agent MUST **amend** an existing rule when the request refines a surface, flow or data already owned by that rule (ordering, labels, empty/loading states, a new edge case, a minor display variant, an extra validation).
- The agent MAY **create** a new rule only when all of these hold:
  - no existing rule owns the surface, flow or data;
  - the behavior is a feature in its own right (its own lifecycle, permissions, API contract or user journey);
  - it needs several requirements and tests of its own, not one or two lines.
- When the request spans several rules, amend the rule that owns the primary surface and cross-reference the others.
- The agent MUST NOT create a rule for a single display detail (e.g. sorting a select, a tooltip text, a spacing tweak).
- Before creating, the agent MUST name the closest existing rules it considered and why none fits.

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
   - Missing rule: amendment of an existing rule (named), or new rule draft with the §4.1 justification
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

Session and WebSocket code (socket pool, lobby, gateway, roster, battle sync, sheet sync, `sessionSlice`) is a cross-cutting, stateful subsystem where small diffs have caused regressions. Treat it as **high attention** by default.

- Before proposing or implementing any change in this domain, the agent MUST load the `sessions-websocket` skill (`.claude/skills/sessions-websocket/SKILL.md`) and follow its pre-work and checklist.
- The agent MUST read **FR-user-cache-isolation**, **FR-session-combat-navigation**, **FR-session-combat-sync**, **FR-session-participant-labels**, **FR-session-lobby-navigation**, **FR-session-websocket-lifecycle** (plus **FR-combat-initiative-tracker** / **FR-tracker-vital-status** for combat tracker behavior).
- Every session/WS change MUST include focused tests: one **nominal** case, one **reconnect or race** edge, and one **failure or guard** case when applicable.

## 11) Technical Constraints

### 11.1 No Relative Imports

All TypeScript/JavaScript imports MUST use `@/` path aliases. Relative paths (`./` or `../`) are **forbidden** in all source files.

- **Correct**: `import { foo } from "@/lib/foo";`
- **Forbidden**: `import { foo } from "./foo";` or `import { foo } from "../../lib/foo";`

This applies to all files under `services/web/client/src/`. The `@/` alias resolves to `src/`.

When writing or editing any file, the agent MUST verify that no relative imports are introduced. If fixing or refactoring existing code that contains relative imports, the agent MUST convert them to `@/` aliases as part of the change.
