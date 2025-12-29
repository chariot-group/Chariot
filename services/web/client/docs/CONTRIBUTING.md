# Contributing to Chariot Frontend

When contributing to the Chariot frontend application, follow these guidelines for maintaining consistency and code quality.

> **Note**: The frontend is part of the Chariot microservice located at `services/chariot/frontend/`

## Table of contents

1.  [Code rules](#code-rules)
2.  [Project architecture](#project-architecture)
3.  [Naming conventions](#naming-conventions)
4.  [Working with pnpm workspace](#working-with-pnpm-workspace)

## 📚 Code rules

### 🔗 Navigation

Even if buttons look visually similar:

- Every navigation button must use Next.js navigation `<Link></Link>`

### 🌐 Locales & translation

For any translation or internationalization questions, see [I18n.md](./I18n.md) for configuration and best practices.

## 🏗️ Project architecture

Chariot Frontend uses a centralized modular structure.

Instead of a `modules` folder containing everything for a given module, we use global domain folders (`components`, `models`, `services`, `hooks`, etc.) where files are **grouped by module**.

For example:

```
components/
  ├── orders/
  │   ├── OrderForm.tsx
  │   └── OrderCard.tsx
  ├── users/
  │   └── UserList.tsx
```

Each subfolder corresponds to a **functional module** (e.g., `orders`, `users`, etc.), keeping structure clear while sharing file types.

This organization applies to the following folders:

- **components/**: React components by module
- **models/**: types and interfaces specific to a module
- **services/**: API calls grouped by module
- **hooks/**: custom hooks, also grouped by module
- **utils/**: utility functions, grouped by functional domain when relevant

Truly global files or components (usable across modules) live at the root of each folder, or in a `common/` subfolder when appropriate.

👉 This architecture improves **readability** and **navigation** without sacrificing separation of concerns.

## 🔤 Naming conventions

### 🧩 Components

- Name components in **PascalCase** and match the filename.
- Naming pattern: **Module|(CRUDAction)|Specific**

Example: **CampainIndexDatatable** or **NPCForm**

### 🏷️ Models

- Interfaces and types (in both their name and file name) must start with an **I**.

Example:

`file: /src/modules/Campains/types/IContact.ts`

```ts
export interface ICampains {}
```

### 🏗️ Variables

- Variables must be named in **camelCase**.
- Global constants must be in **UPPER_CASE**.
- Names must be explicit and avoid unnecessary abbreviations.

Example:

```ts
const userName = "John Doe";
const API_BASE_URL = "https://api.example.com";
```

## 🛠️ Working with pnpm workspace

The Chariot frontend is part of a pnpm monorepo workspace. Here's how to work effectively:

### Running Commands

```bash
# From project root - run frontend commands
pnpm --filter @chariot/frontend [command]

# Or navigate to frontend directory
cd services/chariot/frontend
pnpm [command]
```

### Using Shared Library

Import shared types, utilities, and constants from the shared library:

```typescript
import { ApiResponse, UserRole } from '@chariot/shared/types';
import { formatResponse, validateEmail } from '@chariot/shared/utils';
import { HTTP_STATUS, API_VERSION } from '@chariot/shared/constants';

// Example usage in a component or service
const response: ApiResponse = await fetchUserData();
```

### Adding Dependencies

```bash
# From project root
pnpm --filter @chariot/frontend add package-name

# Or from frontend directory
cd services/chariot/frontend
pnpm add package-name
```

### Development Workflow

1. Make changes to frontend code
2. Hot-reload is enabled in development mode (Next.js Fast Refresh)
3. Test changes: `pnpm --filter @chariot/frontend test`
4. Build for production: `pnpm --filter @chariot/frontend build`
5. Run production build locally: `pnpm --filter @chariot/frontend start`

### Environment-Specific Testing

Test your changes across different environments:

```bash
# Development (hot-reload)
docker compose up

# Integration (production build, fast healthchecks)
./scripts/deploy.sh integ

# Production (optimized build, resource limits)
./scripts/deploy.sh prod
```

See the [main contributing guide](../../../../CONTRIBUTING.md) for overall project contribution guidelines.
const MAX_ATTEMPTS = 5;
```
