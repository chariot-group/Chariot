FROM node:26-alpine AS base

WORKDIR /app

# Update Alpine packages to patch OS-level vulnerabilities
RUN apk upgrade --no-cache

# Copy package files and Prisma config before npm ci
# so that @prisma/client postinstall generates the correct client
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies (this layer will be cached unless package.json or schema changes)
RUN npm ci

ENV DATABASE_URL=postgresql://fake:fake@localhost:5432/fake
RUN npx prisma generate

# Copy source code
COPY . .

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate dev && npm run start:dev"]
