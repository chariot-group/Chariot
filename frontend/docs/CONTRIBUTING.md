# Contributing to Chariot Frontend

When contributing to the Chariot frontend application, ...

## Table of contents

1.  [Code rules](#code-rules)
2.  [Project architecture](#project-architecture)
3.  [Naming conventions](#naming-conventions)

## 📚 Code rules

### 🔗 Navigation

Even if buttons look visually similar:

- Every navigation button must use Next.js navigation `<Link></Link>`

### 🌐 Locales & translation

For any translation or internationalization questions, see [i18n.md](./i18n.md) for configuration and best practices.

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
const MAX_ATTEMPTS = 5;
```
