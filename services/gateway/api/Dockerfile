FROM node:20-alpine

WORKDIR /app

# Install dumb-init and wget (for healthcheck)
RUN apk add --no-cache dumb-init wget

# Create logs directory
RUN mkdir -p /app/logger/logs

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 8082

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Install dependencies and start dev server
CMD ["sh", "-c", "npm install && npm run start:dev"]
