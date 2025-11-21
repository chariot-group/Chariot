# Contributing to Chariot Backend

When contributing to the Chariot backend application, follow these guidelines for maintaining consistency and code quality.

> **Note**: The backend is part of the Chariot microservice located at `services/chariot/backend/`

## Table of contents

- [Resource creation](#resource-creation)
- [Log management](#log-management)
- [Working with pnpm workspace](#working-with-pnpm-workspace)

## Resource creation

### 1. Generate the resource

To create a new resource in the NestJS backend, navigate to the backend directory and use the Nest CLI:

```sh
cd services/chariot/backend
npx nest generate resource resourceName
```

or the short version:

```sh
npx nest g res resourceName
```

This will automatically generate the necessary files for the resource: service, controller, module, DTOs, schema/entity, and test files.

## 2. Adapting to MongoDB

Since we use MongoDB with Mongoose, we need to adapt the default generated structure:

1. **Rename the `entities` folder to `schemas`**:

   ```sh
   mv src/resources/resource-name/entities src/resources/resource-name/schemas
   ```

2. **Rename the file `resource.entity.ts` to `resource.schema.ts`**:

   ```sh
   mv src/resources/resource-name/schemas/resource.entity.ts src/resources/resource-name/schemas/resource.schema.ts
   ```

Note: In a future version of the project, we may add a Nest CLI plugin or overlay to generate schemas instead of entities automatically.

## 3. Example Mongoose schema for NestJS

Here is an example Mongoose schema for a basic resource such as `Product`:

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
```

This file will be saved under `src/resources/product/schemas/product.schema.ts`.

With this approach, we structure our NestJS project following best practices for MongoDB with Mongoose without altering NestJS's modular structure.

## Log management

To record events or important messages, we use a centralized logger. This helps track application activity and ease debugging.

For more details on usage and configuration of the logger, see: [logger.md](./logger.md).

## Working with pnpm workspace

The Chariot backend is part of a pnpm monorepo workspace. Here's how to work effectively:

### Running Commands

```bash
# From project root - run backend commands
pnpm --filter @chariot/backend [command]

# Or navigate to backend directory
cd services/chariot/backend
pnpm [command]
```

### Using Shared Library

Import shared types, utilities, and constants from the shared library:

```typescript
import { ApiResponse, UserRole } from '@chariot/shared/types';
import { formatResponse, validateEmail } from '@chariot/shared/utils';
import { HTTP_STATUS, API_VERSION } from '@chariot/shared/constants';

// Example usage
const response: ApiResponse = formatResponse(
  true,
  { user: userData },
  'User retrieved successfully'
);
```

### Adding Dependencies

```bash
# From project root
pnpm --filter @chariot/backend add package-name

# Or from backend directory
cd services/chariot/backend
pnpm add package-name
```

### Development Workflow

1. Make changes to backend code
2. Hot-reload is enabled in development mode
3. Test changes: `pnpm --filter @chariot/backend test`
4. Build for production: `pnpm --filter @chariot/backend build`

See the [main contributing guide](../../../../CONTRIBUTING.md) for overall project contribution guidelines.
