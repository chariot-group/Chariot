# Chariot Shared Library (`@chariot/shared`)

Shared code, types, utilities, and configurations used across Chariot microservices.

> **Package**: `@chariot/shared`  
> **Location**: `shared/`  
> **Managed by**: pnpm workspaces

## 📦 Contents

- **types**: Common TypeScript interfaces and types
  - API responses
  - User roles and permissions
  - Common data models
- **utils**: Shared utility functions
  - Response formatters
  - Validation helpers
  - Common transformations
- **constants**: Application-wide constants
  - HTTP status codes
  - API versions
  - Configuration values

## 🚀 Usage

The shared library is automatically linked via pnpm workspaces. Import from any microservice:

```typescript
// Import types
import { ApiResponse, UserRole, PaginationParams } from '@chariot/shared/types';

// Import utilities
import { formatResponse, validateEmail, hashPassword } from '@chariot/shared/utils';

// Import constants
import { HTTP_STATUS, API_VERSION, DEFAULT_PAGE_SIZE } from '@chariot/shared/constants';

// Example usage
const response: ApiResponse<User> = formatResponse(
  true,
  { user: userData },
  'User retrieved successfully',
  HTTP_STATUS.OK
);
```

## 📁 Directory Structure

```
shared/
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
├── index.ts              # Main export file
├── types/
│   └── index.ts         # Type definitions
├── utils/
│   └── index.ts         # Utility functions
└── constants/
    └── index.ts         # Constants
```

## 🛠️ Development

### Adding New Code

1. **Add to appropriate directory**:
   ```bash
   # For types
   echo "export interface NewType { ... }" >> shared/types/index.ts
   
   # For utilities
   echo "export function newUtil() { ... }" >> shared/utils/index.ts
   
   # For constants
   echo "export const NEW_CONSTANT = 'value';" >> shared/constants/index.ts
   ```

2. **Export from main index**:
   ```typescript
   // shared/index.ts
   export * from './types';
   export * from './utils';
   export * from './constants';
   ```

3. **TypeScript compilation**:
   ```bash
   # From project root
   pnpm --filter @chariot/shared build
   
   # Or from shared directory
   cd shared
   pnpm build
   ```

### Using in Microservices

The shared library is automatically available in all workspace packages:

```json
// services/chariot/backend/package.json
{
  "dependencies": {
    "@chariot/shared": "workspace:*"
  }
}
```

No installation needed - pnpm workspaces handle linking automatically.

### Best Practices

1. **Keep it generic**: Only add code that's truly shared across services
2. **Type everything**: Maintain strict TypeScript typing
3. **Document exports**: Add JSDoc comments for public APIs
4. **Version carefully**: Breaking changes affect all services
5. **Test thoroughly**: Changes impact multiple microservices

### Testing Changes

When modifying the shared library:

```bash
# Rebuild shared library
pnpm --filter @chariot/shared build

# Test in backend
pnpm --filter @chariot/backend test

# Test in frontend
pnpm --filter @chariot/frontend build

# Or test all at once
pnpm test
```

## 🔄 Versioning

When making changes:

1. **Minor changes** (additions): Increment patch version
2. **Breaking changes**: Increment minor/major version
3. **Update consumers**: Update dependent services if needed

```bash
# Update version
cd shared
npm version patch  # or minor, or major
```

## 📚 Documentation

For consuming services:
- **Backend**: See [services/chariot/backend/docs/CONTRIBUTING.md](../services/chariot/backend/docs/CONTRIBUTING.md)
- **Frontend**: See [services/chariot/frontend/docs/CONTRIBUTING.md](../services/chariot/frontend/docs/CONTRIBUTING.md)

For project structure:
- **Main README**: [README.md](../README.md)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)
