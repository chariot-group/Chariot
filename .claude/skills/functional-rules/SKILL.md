---
name: functional-rules
description: >-
  Classify, amend or write Chariot functional rules (docs/functional-rules.md) following
  the AGENTS.md gate. Use before any behavior change, when a request needs a rule, when
  citing FR-* IDs, or when checking Covered / Missing rule / Conflict status. Includes
  fr.sh to look rules up without reading the whole file.
---

# Functional rules (Chariot)

Sources of truth: `AGENTS.md` (workflow gate, §4.1 amend vs create), `docs/functional-rules.md` (rules), `docs/design.md` (frontend). This skill is the fast path through them; when they disagree, they win.

## 1. Find the applicable rules (do not read the whole file)

```bash
.claude/skills/functional-rules/fr.sh refs CharacterSelect.tsx   # rules owning a file you will touch
.claude/skills/functional-rules/fr.sh search "lobby|join"        # rules mentioning a topic, ranked by hits
.claude/skills/functional-rules/fr.sh show FR-session-lobby-modal
.claude/skills/functional-rules/fr.sh list                       # every slug + title
```

Start with `refs` on the files the change touches: the rule listing them under **References** is usually the owner. Then `search` the feature vocabulary. Read in full (`show`) only the 1–3 candidates.

Session / WebSocket work: also load the `sessions-websocket` skill (`.claude/skills/sessions-websocket/SKILL.md`) and follow its pre-work and checklist.

## 2. Classify

| Status | When | Next |
| --- | --- | --- |
| Covered | a rule already states the expected behavior | list the rules, plan, ask confirmation |
| Missing rule | no rule states it | **amend** the owning rule (default) or create — see §3 |
| Conflict | the request contradicts a rule | options (keep / adopt / compromise) + recommendation, ask confirmation |

## 3. Amend vs create (AGENTS.md §4.1)

Default is **amend**. Ask: *which rule already owns this surface, flow or data?* If one does, the change goes inside it.

Amend when the request is: an ordering, a label, an empty/loading/error state, an extra edge case, a display variant, an added validation, a new surface of an existing flow.

Create only when all hold: no rule owns the surface; it is a feature in its own right (own lifecycle, permissions, API contract or user journey); it needs several requirements and tests of its own. When creating, name the closest rules considered and why none fits.

Never create a rule for one display detail (sorting a select, a tooltip text, spacing).

### Amendment shape

Add in place, inside the owning rule, at the section that fits:

- one bullet under **Requirements** / **Display** / **Data** (or a short `### Sub-topic` when it needs 3+ bullets);
- matching lines under **Tests** (nominal + edge + failure when applicable);
- new files under **References** if any.

Do not rename the rule or move it. Keep wording normative (MUST / MUST NOT) and implementation-agnostic.

### New rule shape (append at end of file)

```markdown
---

## FR-{domain}-{feature}: Short title

**Rule**: One normative sentence.

**Scope**: what it complements, what it does not cover (cross-reference FR slugs).

**Requirements**:
- ...

**Prohibitions**:
- ...

**Tests**:
- Nominal: ...
- Edge: ...
- Failure: ...

**References**:
- `services/...`
```

Slug: kebab-case English, unique (`fr.sh list | grep <slug>`), no numeric ID.

## 4. Report and stop

Use the `AGENTS.md` §6 template. For Missing rule, say "amended FR-x (section Y)" or "created FR-x because …". Then stop: no production code before explicit confirmation.

## 5. After writing

- `fr.sh check` — duplicate slugs, numeric IDs, rules without **Tests**.
- In code and tests, cite the slug: `/** @see FR-session-lobby-modal */`, `describe("FR-session-lobby-modal — …")`.
