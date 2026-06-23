FROM node:26-alpine AS base

WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache libc6-compat vips

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run", "start:dev"]
