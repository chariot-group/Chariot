FROM node:26-alpine AS base

WORKDIR /app

# Update Alpine packages to patch OS-level vulnerabilities
RUN apk upgrade --no-cache

# Copy package files and Prisma schema before npm ci
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

RUN npx prisma generate

# Copy source code
COPY . .

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate dev --name init && npm run start:dev"]
