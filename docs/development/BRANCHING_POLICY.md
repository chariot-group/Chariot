# 🚀 Branch Management Policy

This policy defines the branching rules for the **Chariot** project to ensure a structured, stable, and collaborative development process.

## 🌱 Main branches

### `main` (Production)  
🔒 **Protected branch**  
- Contains only stable code ready for production.  
- Must only be updated via **merge requests (MRs)** from `integ`.  
- Every merge must be code-reviewed and pass all checks.  

### `integ` (Integration & Staging)  
🔒 **Protected branch**  
- Receives **merge requests** from `develop`.  
- Used to test and validate new features before production.  
- Must always remain functional and stable.  

### `develop` (Development)  
🛠️ **Primary development branch**  
- Contains the latest in-progress development state.  
- Receives **merge requests** from issue branches.  
- May be unstable but must remain runnable.  

## 🔀 Temporary branches

### 🏷️ Issue branches (`type/xxx-issue-name`)  
Each **issue** (feature, bugfix, UI improvement, refactor, etc.) must be developed in a dedicated branch.  

#### Branch naming format

type/xxx-issue-name

- `type`: category of change among:  
  - `feat` → New feature  
  - `fix` → Bug fix  
  - `ui` → UI/UX change  
  - `refactor` → Code refactor  
  - `docs` → Documentation  
  - `test` → Tests added/updated  
  - `chore` → Maintenance (deps, configs, etc.)  
- `xxx`: GitHub issue number.  
- `issue-name`: short description in **kebab-case**.  

🔹 **Examples:**  
```bash
git checkout -b feat/123-add-login-button
git checkout -b fix/456-navbar-display-fix
git checkout -b ui/789-theme-color-updates
git checkout -b refactor/321-optimize-api-calls
```

### 🔁 Merge process

1. Create an issue branch (`type/xxx-issue-name`) from `develop`.
2. Develop with regular commits following the convention (feat:, fix:, ui:, etc.).
3. Open a pull request (PR) to `develop` with a clear description and a link to the issue.
4. Code review + tests must pass.
5. Merge into `develop`.
6. Test and validate on `integ`.
7. Merge into `main` after staging validation.

### ⛔ Rules to follow

- No direct commits to `main`, `integ`, or `develop`.
- One branch = one feature/fix.
- Every PR must be linked to an issue and include a clear description.
- Rebase your branch on `develop` regularly to avoid conflicts.

```bash
git checkout develop
git pull origin develop
git checkout feat/123-add-login-button
git rebase develop
```

- Delete issue branches once merged to keep the repo clean.