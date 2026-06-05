FROM node:26-alpine

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

# Start dev server (dependencies already installed in build step)
CMD ["npm", "run", "start:dev"]
