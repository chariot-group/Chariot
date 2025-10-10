# 📅 Day-to-day Development Process

## 📋 Table of contents

1. [Work philosophy](#-work-philosophy)
2. [Development cycle](#-development-cycle)
3. [Ticket management](#-ticket-management)
4. [Daily work](#-daily-work)

## 🎯 Work philosophy

### Core principles

- Ship less but stable
- A feature must be complete before merging
- Tests and code review are not optional

## 🔄 Development cycle

### Flexible cycle

**This cycle is NOT rigid**:
- If nothing is ready → skip a release
- If an urgent feature arrives → adapt
- If a critical bug happens → immediate hotfix

### Cycle phases

#### Phase 1: Planning (1–2h at the start of the cycle)

**Agenda**:
1. **Retrospective of the previous cycle** (15 min)
   - What went well?
   - What caused problems?
   - What adjustments to make?

2. **Cycle goals** (30 min)
   - Next version: v1.X.0 or v1.2.X?
   - Business/product priorities?
   - How much time is actually available?

3. **Ticket selection** (30 min)
   - Create milestone `v1.3.0`
   - Identify dependencies between tickets
   - Select achievable tickets
   - Assign tickets (who does what)

4. **Questions and clarifications** (15 min)
   - Are all tickets clear?
   - Any additional specs needed?
   - Risks identified?

**Deliverable**:
- Milestone `v1.3.0` created with tickets
- Indicative feature freeze date (e.g., Nov 10)

#### Phase 2: Development (about 2 weeks)

This is the core of the cycle. See [Daily work](#-daily-work) for details.

#### Phase 3: Feature freeze during release prep

**Trigger**: Planned date reached OR all features ready

**Announcement**:
```
🔒 Feature freeze for v1.3.0
From now on:
- No new features
- Bug fixes only
- Release preparation
```

## 🎫 Ticket management

### Ticket structure

**GitHub Issue template**:

```markdown
## Description
[Clear description of the need or bug]

## Context
[Why this feature/fix matters]

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical specs (optional)
[Technical details, API endpoints, etc.]

## Mockups/Screenshots (if applicable)
[Images or Figma links]

## Notes
[Additional information]
```

**Concrete example**:

```markdown
## Description
Allow users to export their history to CSV

## Context
Repeated request from 5+ users in support
Facilitates personal data analysis

## Acceptance criteria
- [ ] "Export to CSV" button on the profile page
- [ ] Export contains: date, action, details
- [ ] Valid CSV format (Excel compatible)
- [ ] File downloaded with name: history_YYYY-MM-DD.csv
- [ ] Loader displayed during generation

## Technical specifications
- Endpoint: GET /api/users/me/export
- Recommended lib: papaparse or csv-writer
- Limit: 10,000 lines max

## Notes
No need for Excel (XLSX) for now
```

### Labels and organization

**Type labels**:
- `feature`: New feature
- `bug`: Bug fix
- `enhancement`: Improvement to an existing feature
- `docs`: Documentation
- `chore`: Technical tasks (deps, config, refactoring)

**Technical labels**:
- `Backend`: Backend related
- `UX`: Frontend logic
- `UI`: UI/visuals
- `CI/CD`: Deployment related

**Status labels**:

Macro view
- `ideas`: Ideas for later (not yet formatted)
- `backlog`: To do (formatted for dev)
- `released-main`: Done and merged into main

Sprint view
- `backlog`: To do (formatted for dev)
- `in-progress`: In progress
- `freeze`: Blocked (must specify blocker on first line)
- `in-review`: In review (PR open)
- `done`: PR merged into develop

Deployment view
- `done`: PR merged into develop
- `released-integ`: PR merged into integ
- `released-main`: Done and merged into main

**Special labels**:
- `release-blocker`: Blocks the current release
- `release-integ`: Integration deployment ticket
- `release-main`: Production deployment ticket

### Ticket workflow

```
1. CREATION
   ├─ Create issue with template (can be incomplete) status `ideas`
   └─ Add labels (type + priority)
        ↓
2. PLANNING
   └─ Move to `backlog` (milestone v1.X.0)
        ↓
3. DEVELOPMENT
   ├─ Assign to a developer
   ├─ Status: in-progress
   ├─ Create branch feature/123-xxx
   └─ Develop respecting technical and functional constraints
        ↓
4. REVIEW
   ├─ Create PR
   ├─ Check "developer" checks
   ├─ Status: in-review
   └─ Await approval
        ↓
5. MERGE
   ├─ Merge into develop
   ├─ Status: done
   └─ Keep open until prod
        ↓
6. PRODUCTION
   ├─ Ticket included in release vX.Y.Z
   └─ Close the issue
```

### Ticket slicing

Golden rule: One ticket equals one complete user process

If too big: Split into subtickets

Example:
```
❌ "Redesign authentication system" (40h)

✅ Split into:
- "Implement JWT base" (6h)
- "Add refresh token" (4h)
- "Migrate existing users" (8h)
- "Login UI" (6h)
- "E2E authentication tests" (4h)
```

## 💼 Daily work

### Recommended daily routine

#### Start of session (5–10 min)

1. Check notifications
   - Discord messages
   - PRs to review
   - Comments on your PRs

2. Check your tickets
   - Verify "in-progress" tickets
   - Choose the day's priority

#### During development

Work cycle:

1. Develop in small increments
   - Partially functional feature
   - Commit every 30–60 min
   - Push regularly (backup)

2. Test locally
   - Ensure it works
   - No forgotten logs
   - Automated tests pass
   - Add tests if needed

3. Open the PR as soon as possible
   - No need to wait for perfection
   - Shows progress

4. Respond to reviews
   - Review notification
   - Make requested changes
   - Ask for clarifications if needed

#### End of session (5 min)

1. Commit and push your work
   ```bash
   git add .
   git commit -m "wip: progress on CSV export"
   git push origin feature/123-export-csv
   ```

2. Update the ticket
   - Add a comment on progress
   - Flag any blockers

### PR management

#### Create a good PR

Title convention
```
<type>(<scope>): <description> (#issue)

Examples:
feat(export): add CSV export functionality (#123)
fix(auth): correct token expiration bug (#145)
chore(deps): update dependencies
```

Description
```markdown
## Changes
- Add endpoint /api/users/me/export
- UI export button in ProfilePage
- Unit and E2E tests

## Screenshots (if UI)
[Image of the new button]

## How to test
1. Log in
2. Go to /profile
3. Click "Export to CSV"
4. Check the downloaded file

## Checklist
- [x] Tests added
- [x] Tests pass
- [x] Documentation updated
- [x] No console.log

## Linked issue
Closes #123
```

#### Do a good review

Reviewer checklist

1. Understanding
- [ ] Read the PR description
- [ ] Understand the goal
- [ ] Check the linked issue

2. Code reading
- [ ] Business logic correct
- [ ] No obvious bugs
+- [ ] Readable and maintainable code
- [ ] Project conventions respected
- [ ] No duplicated code
- [ ] Error handling present

3. Tests
- [ ] Relevant tests added
- [ ] Acceptable coverage
- [ ] Test locally if possible

4. Security and performance
- [ ] No obvious vulnerabilities
- [ ] No blocking code