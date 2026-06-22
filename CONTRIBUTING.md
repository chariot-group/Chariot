# Contribution Guide

## 🔄 Development Process

Refer to the development documentation for:
- [Branching Policy](docs/development/BRANCHING_POLICY.md)
- [Release Workflow](docs/development/RELEASE_WORKFLOW.md)
- [Development Process](docs/development/DEVELOPMENT_PROCESS.md)

## 🛠️ Technical Standards

### Frontend
See [services/chariot/frontend/docs/CONTRIBUTING.md](services/chariot/frontend/docs/CONTRIBUTING.md) for:
- Frontend code standards  
- Naming conventions  
- Testing and quality guidelines  

### Backend  
See [services/chariot/backend/docs/CONTRIBUTING.md](services/chariot/backend/docs/CONTRIBUTING.md) for:
- Backend code standards  
- Architecture and patterns  
- Testing and documentation  

### Shared Library
See [shared/README.md](shared/README.md) for:
- Common types and interfaces
- Shared utilities
- Constants and configurations

## 🏗️ Architecture

This project follows a **microservices architecture** with:
- **Monorepo**: Managed with pnpm workspaces
- **Services**: Located in `services/` directory
  - `services/chariot/`: Main Chariot service (backend + frontend)
- **Infrastructure**: Centralized in `infrastructure/` directory
  - Monitoring: Prometheus, Grafana, cAdvisor
  - Logging: Loki, Promtail
  - Alerts: Alertmanager
- **Shared Code**: Common library in `shared/` directory

## 🚀 Getting Started

1. **Fork** the project  
2. **Clone** your fork  
   ```bash
   git clone https://github.com/YOUR_USERNAME/Chariot.git
   cd Chariot
   ```
3. **Install dependencies**
   ```bash
   pnpm install
   ```
4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # ⚠️ All environment variables are REQUIRED
   ```
5. **Follow** the [installation guide](README.md#-quick-start) (including [Docker Desktop requirements](README.md#docker-desktop-macos))  
6. **Create** a branch following our [branching policy](docs/development/BRANCHING_POLICY.md)  
7. **Develop** following the technical standards  
8. **Test** your changes in all environments
   ```bash
   # Development
   docker compose up
   
   # Integration
   ./scripts/deploy.sh integ
   
   # Production (local testing)
   ./scripts/deploy.sh prod
   ```
9. **Open** a pull request  

## 📋 PR Checklist

- [ ] Code follows project standards (frontend/backend/shared)  
- [ ] Tests added or updated  
- [ ] Documentation updated if necessary  
- [ ] Branch follows naming policy  
- [ ] Changes tested in development environment
- [ ] No breaking changes to shared library without migration plan
- [ ] Environment variables documented if added

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run backend tests
pnpm --filter @chariot/backend test

# Run frontend tests  
pnpm --filter @chariot/frontend test

# Run tests with coverage
pnpm test:cov
```

### Testing Across Environments

Always test changes across different deployment environments:

1. **Development**: Ensure hot-reload works
2. **Integration**: Verify production build succeeds
3. **Production**: Check optimizations don't break functionality

## 📦 Working with Shared Library

When modifying the shared library:

1. Update version in `shared/package.json`
2. Update dependent services
3. Test across all consuming services
4. Document breaking changes in CHANGELOG.md

## 🔧 Adding a New Microservice

Follow these steps to add a new microservice to the Chariot ecosystem:

### 1. Create Service Directory Structure

```bash
# Create the service directory
mkdir -p services/your-service/{backend,frontend}

# Or for backend-only services
mkdir -p services/your-service
```

### 2. Initialize Service Package

Create `services/your-service/package.json`:

```json
{
  "name": "@chariot/your-service",
  "version": "1.0.0",
  "private": true,
  "description": "Description of your service",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest"
  },
  "dependencies": {
    "@chariot/shared": "workspace:*",
    "@nestjs/core": "^11.0.13",
    "@nestjs/common": "^11.0.13"
  }
}
```

### 3. Configure Docker Compose

Create `services/your-service/compose.yml`:

```yaml
services:
  your-service:
    container_name: your-service
    build:
      context: ../../
      dockerfile: services/your-service/Dockerfile
    env_file:
      - ../../.env
    ports:
      - "${YOUR_SERVICE_PORT}:${YOUR_SERVICE_PORT}"
    networks:
      - chariot-network
    depends_on:
      chariot-mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:${YOUR_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  chariot-network:
    name: chariot_chariot-network
    external: true
```

### 4. Create Dockerfile

Create `services/your-service/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /workspace

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY shared/ ./shared/
COPY services/your-service/ ./services/your-service/

# Configure pnpm for better network reliability
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Install dependencies with retry logic
RUN pnpm install --frozen-lockfile || \
    (sleep 10 && pnpm install --frozen-lockfile) || \
    (sleep 30 && pnpm install --frozen-lockfile)

# Development
FROM base AS development
WORKDIR /workspace/services/your-service
CMD ["pnpm", "dev"]

# Production build
FROM base AS builder
WORKDIR /workspace
RUN pnpm --filter @chariot/your-service build

# Production runtime
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /workspace/services/your-service/dist ./dist
COPY --from=builder /workspace/services/your-service/node_modules ./node_modules
COPY --from=builder /workspace/services/your-service/package.json ./

CMD ["node", "dist/main"]
```

### 5. Add Environment Variables

Update `.env` with service-specific variables:

```bash
# Your Service Configuration
YOUR_SERVICE_PORT=
YOUR_SERVICE_DATABASE_URL=
# Add all required variables without default values
```

### 6. Update Root Docker Compose

Add service include in root `compose.yml`:

```yaml
include:
  - services/chariot/compose.yml
  - services/your-service/compose.yml  # Add this line
  - infrastructure/compose.yml
```

### 7. Configure Monitoring

#### Add Prometheus Metrics

In your service, expose metrics endpoint:

```typescript
// src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    return register.metrics();
  }
}
```

#### Update Prometheus Configuration

Edit `infrastructure/prometheus.yml.template`:

```yaml
scrape_configs:
  # ... existing jobs
  
  - job_name: 'your-service'
    static_configs:
      - targets: ['your-service:${YOUR_SERVICE_PORT}']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

Add environment variables in `.env`:

```bash
PROMETHEUS_YOUR_SERVICE_TARGET=your-service:YOUR_SERVICE_PORT
```

### 8. Configure Logging

#### Update Promtail Configuration

Edit `infrastructure/promtail-config.yml`:

```yaml
scrape_configs:
  # ... existing jobs
  
  - job_name: your-service-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: your-service
          service: your-service
          component: application
          __path__: /logs/your-service/*.log
```

#### Mount Logs Volume

Update `infrastructure/compose.yml` in promtail service:

```yaml
promtail:
  volumes:
    # ... existing volumes
    - ../services/your-service/logs:/logs/your-service:ro
```

### 9. Create Service Documentation

Create `services/your-service/README.md`:

```markdown
# Your Service

## Description
Brief description of what this service does.

## Environment Variables
- `YOUR_SERVICE_PORT`: Port the service listens on
- `YOUR_SERVICE_DATABASE_URL`: Database connection string

## Endpoints
- `GET /health`: Health check
- `GET /metrics`: Prometheus metrics

## Development
\`\`\`bash
pnpm --filter @chariot/your-service dev
\`\`\`

## Testing
\`\`\`bash
pnpm --filter @chariot/your-service test
\`\`\`
```

### 10. Update Root Package.json

Add workspace reference in root `package.json`:

```json
{
  "scripts": {
    "your-service:dev": "pnpm --filter @chariot/your-service dev",
    "your-service:build": "pnpm --filter @chariot/your-service build",
    "your-service:test": "pnpm --filter @chariot/your-service test"
  }
}
```

### 11. Test the Service

```bash
# Install dependencies
pnpm install

# Start in development mode
docker compose up your-service

# Verify health
curl http://localhost:YOUR_SERVICE_PORT/health

# Check metrics
curl http://localhost:YOUR_SERVICE_PORT/metrics

# Check Prometheus target
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.job=="your-service")'

# Check logs in Loki
curl 'http://localhost:3100/loki/api/v1/label/job/values' | jq
```

### 12. Create Grafana Dashboard (Optional)

Create `infrastructure/grafana/dashboards/your-service.json` following the structure of existing dashboards.

### Checklist for New Service

- [ ] Directory structure created
- [ ] package.json configured with workspace reference
- [ ] Docker Compose files created (dev, integ, prod if needed)
- [ ] Dockerfile with multi-stage builds
- [ ] Environment variables added to `.env`
- [ ] Service included in root compose.yml
- [ ] Prometheus scrape configuration added
- [ ] Promtail log collection configured
- [ ] Health check endpoint implemented
- [ ] Metrics endpoint implemented
- [ ] Service documentation created
- [ ] Shared library dependency added
- [ ] Tests implemented
- [ ] Tested in all three environments (dev/integ/prod)

## 🆘 Help

- **Technical questions** → [Technical Documentation](docs/technical/README.md)  
- **Development process** → [Development Documentation](docs/development/README.md)  
- **Deployment issues** → [Deployment Guide](docs/technical/DEPLOYMENT.md)
- **Bug or feature request** → GitHub Issues  