FROM node:22-alpine AS base

WORKDIR /app

# Update Alpine packages to patch OS-level vulnerabilities
RUN apk upgrade --no-cache

# Copy package files and Prisma schema before npm ci
# so that @prisma/client postinstall generates the correct client
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (this layer will be cached unless package.json or schema changes)
RUN npm ci

# Copy source code
COPY . .

CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]
