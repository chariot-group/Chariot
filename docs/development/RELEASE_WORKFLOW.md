# 🚀 Production Release Workflow - Interactive Guide

> Last updated: October 2025

---

## 📋 Table of contents

- [Scenario 1: Feature development](#scenario-1-feature-development)
- [Scenario 2: Release preparation](#scenario-2-release-preparation)
- [Scenario 3: Hotfix in production](#scenario-3-hotfix-in-production)
- [Appendices](#appendices)

---

## Scenario 1: Feature development

### Step 1.1: Start the feature

Prerequisite: A ticket exists in GitHub Issues (e.g., #123)

Ticket labelling:
- Type: `feature`, `bug`, `enhancement`
- Priority: `high`, `medium`, `low`
- Milestone: `v1.3.0` (if known) or `Backlog`
- Status: `in-progress`

Develop the feature.

---

### Step 1.2: Finalization and PR
Prerequisite: PR checklist complete and ticket up to date with develop

Create the PR.

---

### Step 1.3: Code review

The reviewer reads the ticket and decides whether the PR is OK or whether changes are required.

→ If approved, continue to merge.

---

### Step 1.4: Merge after approval

✅ The PR is approved

On GitHub, use "Squash and merge pull request" to keep a clean history.

With CI/CD configured:
- Automated tests pass ✅

Update the ticket:
- Status: `done`
- Keep the issue open until production (track items merged in develop but not yet in main)

---

## Scenario 2: Release preparation

### Step 2.1: Decide to release

Trigger: A coherent set of features is ready.

Questions:
- ✅ Do we have complete features in `develop`?
- ✅ Nothing unstable?

Determine the version number:
Review changes since last version:
- MAJOR (v2.0.0): Breaking changes, major redesign
- MINOR (v1.3.0): New features (backward compatible)
- PATCH (v1.2.1): Bug fixes only

Create the release ticket:
- Create a GitHub issue with the determined version number
- Title: "Release vX.Y.Z" (e.g., "Release v1.3.0")
- Description:
  - List of key features to include
  - Checklist of release steps
  - Link to this workflow guide
  - Version type (MAJOR/MINOR/PATCH) with rationale
- Labels: `release`
- Milestone: Create a corresponding milestone if needed (e.g., `v1.3.0`)
- Assignees: Release Manager + second developer

---

### Step 2.2: Create the release branch

⚠️ IMPORTANT: Only one person creates the branch (the "Release Manager" for this iteration)

Pre-check:
```bash
git checkout develop
git status  # must be clean
git pull origin develop  # must be up-to-date
```

Create the branch (Release Manager only):
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.3.0
git push -u origin release/v1.3.0

# Create a Pull Request on GitHub
# Title: "chore: prepare release v1.3.0"
# Description: List features included in the release
# Labels: release
# Reviewers: Add the other developer
```

---

### Step 2.3: Update changelog and version

Edit CHANGELOG.md:
```markdown
# Changelog

## [1.3.0] - 2024-11-15

### Added
- New user profile feature (#123)
- Push notifications support (#145)
- CSV data export (#156)

### Changed
- Improved home page performance (#134)
- Settings UI redesign (#142)

### Fixed
- Fixed mobile display bug (#151)
- Fixed memory leak in dashboard (#148)

## [1.2.0] - 2024-10-28
...
```

Update version in code:
```json
// package.json
"version": "1.3.0"
```

---

### Step 2.4: Deploy to integ

Create a PR for integ:
```bash
git checkout develop
git pull origin develop
```

- Source: `develop`
- Target: `integ`
- Title: "chore: deploy features for release v1.3.0 to staging"
- Description:
  - List of major changes
  - Link to the release ticket
  - Checklist of tests to perform
- Labels: `deploy-staging`
- Reviewers: The other developer

Once approved, merge into integ.

Automatic deployment:
- CI/CD detects the push to `integ`
- Build + automated tests
- Deploy to the integration server
- Automatic health check

Manual verification:
- [ ] App starts correctly
- [ ] Health check endpoint responds (e.g., `/api/health`)
- [ ] Logs show no critical errors

---

### Step 2.5: Test on integ

Developer 1:
- [ ] Test own features
- [ ] General smoke test (main user flow)
- [ ] Cross-browser test (Chrome, Firefox, Safari)

Developer 2:
- [ ] Test own features
- [ ] General smoke test
- [ ] Mobile (responsive) test

Regression tests:
- [ ] Existing features still operational
- [ ] No visual regressions
- [ ] Acceptable performance

Monitoring:
- Check logs: no backend exceptions
- Check metrics: response times OK

Bug reporting:
- Create a ticket for each bug found
- Labels: `bug` + `release-blocker` (if blocking)
- Objective criteria:
  - Blocking bug: Core feature broken, 500 error, data loss
  - Minor bug: Cosmetic issue, rare edge case, typo

→ After tests: either proceed to production, fix minor bugs on the release branch, or drop the release if major issues.

---

### Step 2.6a: Integ OK → GO Prod

✅ No blocking bug, everything works

Create a PR to main:
- Source: `integ`
- Target: `main`
- Title: "chore: release v1.3.0"
- Description:
  - Full changelog
  - List of included tickets
- Labels: `release`
- Reviewers: The other developer

Once approved:
```bash
git checkout main
git pull origin main
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin main --tags
```

Production deployment:
- CI/CD detects the tag v1.3.0 on `main`
- Build + automated tests
- Manual approval (if configured)
- Deploy to production
- Automatic health check
- Discord notification: "✅ v1.3.0 deployed to production"

Post-release sync (mandatory):
```bash
git checkout develop
git pull origin develop
git merge origin/main --no-ff
git push origin develop
```

Why this matters:
- Guarantees `main` has no commit missing in `develop` after each production release.
- Prevents long conflict sessions in the next release cycle.
- Keeps `develop` as the source of truth without rewriting its history.

Optional stabilization (outside release window): keep `integ` equal to `main`
```bash
git fetch origin --prune
git push --force-with-lease origin origin/main:integ
```

Use this only when you intentionally want `integ` to mirror production between release campaigns.

Verification checks (run after synchronization):
```bash
git rev-list --left-right --count origin/develop...origin/main
git rev-list --left-right --count origin/develop...origin/integ
```

Expected values:
- `origin/develop...origin/main` -> `X 0` (`X >= 0`)
- `origin/develop...origin/integ` -> `Y 0` (`Y >= 0`)

Interpretation:
- Right value `0` means the target branch (`main` or `integ`) has no commit that `develop` does not have.

Cleanup:
```bash
git branch -d release/v1.3.0
git push origin --delete release/v1.3.0
```

---

## Appendix: Anti-drift guardrails

Rule 1: Never rewrite `develop`
- Do not force-push `develop`.
- If production introduces merge commits, absorb them with `git merge origin/main --no-ff` on `develop`.

Rule 2: Preserve branch direction
- Feature flow remains `develop` -> `integ` -> `main`.
- Hotfixes on `main` must be merged back into `develop` immediately.

Rule 3: Verify branch health regularly
- Run `git rev-list --left-right --count` checks before and after each release.
- Any non-zero right value must be resolved before starting the next release.

Create a GitHub Release:
- Tag: `v1.3.0`
- Title: `Version 1.3.0 - Profiles & Notifications`
- Description: Copy the changelog content

Close tickets:
- All tickets in milestone v1.3.0 → Status `released`
- Close the issues

---

### Step 2.6b: Integ KO → Minor bugs

🟡 Bugs detected but not blocking

Examples of minor bugs:
- Typo
- Slight CSS misalignment
- Rare edge case
- Cosmetic issue

Decision: Fix quickly on the release branch
```bash
git checkout release/v1.3.0
git add .
git commit -m "fix: button alignment on mobile"
git push origin release/v1.3.0

git checkout integ
git merge release/v1.3.0
git push origin integ
```

Quick re-test:
- Verify the fix
- General smoke test

---

### Step 2.6c: Integ KO → Major bugs

🔴 Blocking bugs detected

Examples:
- Core feature broken
- Frequent 500 errors
- Data loss
- Security issue
- Unacceptable performance

Complex fix or uncertainty → Drop the release:
```bash
git checkout integ
git reset --hard HEAD~1
git push origin integ --force

git branch -D release/v1.3.0
git push origin --delete release/v1.3.0
```

Back to development on develop; fix the bug in a new feature branch; re-plan later.

---

### Step 2.7: Post-production monitoring

Immediate checks (H+1):
- [ ] App accessible
- [ ] Backend logs clean (no exceptions)
- [ ] Metrics normal (CPU, RAM, requests/s)

Next day checks (D+1):
- [ ] Normal request volume
- [ ] Error rate < 1%
- [ ] Acceptable response time
- [ ] No user complaints

Tools:
- Sentry, logs, uptime monitor, Grafana

If all good after 48h: ✅ Successful release

If issues: go to Scenario 3 or emergency rollback.

---

## Scenario 3: Hotfix in production

### Step 3.1: Detect the problem

Detection sources:
- 🔔 Sentry alert: Error spike
- 🔔 Monitoring alert: App down/degraded
- 📧 User report
- 👁️ Direct observation

Criticality:
- 🔴 Critical (fix within 24h): app down, data loss, security, core feature broken
- 🟠 Important (v1.3.1 within 1 week): annoying but workaround exists
- 🟡 Minor: cosmetic, rare edge case, UX

---

### Step 3.2: Critical hotfix

Quick investigation (≤ 30 min): reproduce, identify cause, assess impact.

Option A: Quick fix → create hotfix branch

Option B: Complex/uncertain → Emergency rollback

Create the hotfix:
```bash
git checkout main
git pull origin main
git checkout -b hotfix/v1.3.1
```

Commit and push minimal fix, test locally, deploy to integ for quick validation.

Deploy to prod and tag:
```bash
git checkout main
git merge hotfix/v1.3.1 --no-ff -m "chore: hotfix v1.3.1"
git tag -a v1.3.1 -m "Hotfix v1.3.1"
git push origin main --tags
```

Sync with develop, then delete the hotfix branch.

---

## 🚨 Emergency Rollback Procedure

Automatic triggers: error rate > 5%, response time > 2s, HTTP 500/503, data loss.

Manual triggers: critical bug affecting everyone, discovered vulnerability, severe performance degradation.

Manual rollback script (example): see scripts/emergency-rollback.sh with Discord notifications, DB backup, tag, and verification.

Checklist covers assessment, preparation, execution, validation, communication, and follow-up.

---

## Appendices

### A. Branch architecture
```
main (production)
  ↑
  ├── release/vX.Y.Z (preparation)
  ├── hotfix/vX.Y.Z (urgent fixes)
  ↑
integ (pre-production)
  ↑
develop (development)
  ↑
  ├── feature/XXX (features)
  ├── fix/XXX (fixes)
```

### B. Semantic Versioning
Format: MAJOR.MINOR.PATCH (e.g., v2.3.1)

### C. Commit conventions
<type>(<scope>): <description>

### D. Branch protection on GitHub
- main: PRs required, approvals, checks
- develop: PRs required
- integ: no protection

### E. Pre-release checklist
- [ ] Tickets done/moved
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Tests pass
- [ ] No debug code
- [ ] Env vars verified
- [ ] Rollback plan tested
- [ ] Monitoring configured

---

Document version: 2.0.0
Last update: October 3, 2025