# Contributing to Chariot Backend

When contributing to the Chariot backend application, ...

## Table of contents

- [Resource creation](#resource-creation)
- [Log management](#log-management)

## Resource creation

### 1. Generate the resource

To create a new resource in a NestJS project, use the following command:

```sh
nest generate resource resourceName
```

or the short version:

```sh
nest g res resourceName
```

This will automatically generate the necessary files for the resource: service, controller, module, DTOs, schema/entity, and test files.

## 2. Adapting to MongoDB

Since we use MongoDB with Mongoose, we need to adapt the default generated structure:

1. **Rename the `entities` folder to `schemas`**:

   ```sh
   mv src/resource-name/entities src/resource-name/schemas
   ```

2. **Rename the file `resource.entity.ts` to `resource.schema.ts`**:

   ```sh
   mv src/resource-name/schemas/resource.entity.ts src/resource-name/schemas/resource.schema.ts
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

This file will be saved under `src/product/schemas/product.schema.ts`.

With this approach, we structure our NestJS project following best practices for MongoDB with Mongoose without altering NestJS's modular structure.

## Log management

To record events or important messages, we use a centralized logger. This helps track application activity and ease debugging.

For more details on usage and configuration of the logger, see: [`logger.md`](./logger.md).
