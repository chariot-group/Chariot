# Chariot - Microservices Architecture

> Modern microservices-based platform built with NestJS, Next.js, and Docker

## 🏗️ Architecture

This project follows a microservices architecture with the following structure:

```
Chariot/
├── services/
│   └── chariot/          # Main Chariot microservice
│       ├── backend/      # NestJS 11 API
│       └── frontend/     # Next.js 15 UI
├── infrastructure/       # Shared infrastructure (Monitoring, Logging)
│   ├── prometheus/       # Metrics collection
│   ├── grafana/          # Visualization dashboards
│   ├── loki/             # Log aggregation
│   └── alertmanager/     # Alert management
├── shared/               # Shared code library
│   ├── types/            # Common TypeScript types
│   ├── utils/            # Utility functions
│   └── constants/        # Application constants
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 9.0.0
- **Docker** & **Docker Compose** v2

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chariot-group/Chariot.git
   cd Chariot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # ⚠️ All variables are REQUIRED - no default values
   ```

4. **Start all services**
   
   **Development** (with hot-reload):
   ```bash
   docker compose up
   # or
   ./scripts/deploy.sh dev
   ```

   **Integration** (production build, testing):
   ```bash
   ./scripts/deploy.sh integ
   ```

   **Production** (optimized, resource limits):
   ```bash
   ./scripts/deploy.sh prod
   ```

   Or start specific services:
   ```bash
   # Start only Chariot microservice
   docker compose --profile chariot up

   # Start only infrastructure
   docker compose --profile infrastructure up
   ```

## 📦 Microservices

### Chariot Service
- **Backend**: `http://localhost:9000`
- **Frontend**: `http://localhost:3000`
- **MongoDB**: `localhost:27017`

## 📊 Infrastructure

### Monitoring & Logging
- **Prometheus**: `http://localhost:9090` - Metrics collection
- **Grafana**: `http://localhost:3001` - Dashboards (admin/admin)
- **Loki**: `http://localhost:3100` - Log aggregation
- **Alertmanager**: `http://localhost:9093` - Alert management

### Exporters
- **cAdvisor**: `http://localhost:8080` - Container metrics
- **Node Exporter**: `http://localhost:9100` - Host metrics
- **MongoDB Exporter**: `http://localhost:9216` - Database metrics

## 🛠️ Development

### Workspace Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint all code
pnpm lint

# Format all code
pnpm format
```

### Docker Commands

```bash
# Start all services (development)
docker compose up

# Start in production mode
docker compose -f compose.yml -f compose.prod.yml up -d

# Start in integration mode
docker compose -f compose.yml -f compose.integ.yml up -d

# Or use the deployment script (recommended)
./scripts/deploy.sh [dev|integ|prod]

# Stop all services
docker compose down

# Clean all volumes and containers
docker compose down -v --remove-orphans

# View logs
docker compose logs -f [service-name]

# Rebuild specific service
docker compose build [service-name]
```

See [DOCKER_CHEATSHEET.md](./DOCKER_CHEATSHEET.md) for more commands.

### Working with Shared Library

Import shared code in microservices:

```typescript
// In backend services
import { ApiResponse, UserRole } from '@shared/types';
import { formatResponse } from '@shared/utils';
import { HTTP_STATUS } from '@shared/constants';

// Example usage
const response: ApiResponse = formatResponse(
  true,
  { user: data },
  'User created successfully'
);
```

## 🌍 Environments

This project supports three deployment environments:

### Development
- **Purpose**: Local development with hot-reload
- **Build**: Development mode with source maps
- **Database**: MongoDB (latest)
- **Volumes**: Bind mounts for live code updates
- **Logs**: Verbose console output
- **Command**: `docker compose up` or `./scripts/deploy.sh dev`

### Integration
- **Purpose**: Integration testing and QA
- **Build**: Production builds
- **Database**: MongoDB 8.0.15
- **Healthchecks**: 15-20s intervals
- **Resources**: No limits (similar to production)
- **Command**: `./scripts/deploy.sh integ`

### Production
- **Purpose**: Live production deployment
- **Build**: Optimized multi-stage builds
- **Database**: MongoDB 8.0.15 with authentication
- **Healthchecks**: 30s intervals
- **Resources**: CPU and memory limits enforced
- **Logs**: Minimal (errors only)
- **Restart**: Always (unless-stopped)
- **Command**: `./scripts/deploy.sh prod`

See [docs/technical/ENVIRONMENTS_COMPARISON.md](./docs/technical/ENVIRONMENTS_COMPARISON.md) for detailed comparison.

## 🚀 Deployment

### Using Deployment Script

The recommended way to deploy in any environment:

```bash
# Development
./scripts/deploy.sh dev

# Integration
./scripts/deploy.sh integ

# Production
./scripts/deploy.sh prod
```

The script automatically:
- Validates prerequisites (Docker, .env file)
- Creates required networks
- Builds and starts services
- Runs healthchecks
- Displays service URLs

### Manual Deployment

```bash
# Development
docker compose up -d

# Integration
docker compose -f compose.yml -f compose.integ.yml up -d

# Production
docker compose -f compose.yml -f compose.prod.yml up -d
```

### Server Deployment

For production server setup with Nginx, SSL, backups, and systemd:

```bash
# Run the comprehensive server setup script
sudo ./scripts/server-setup.sh
```

See [docs/technical/DEPLOYMENT.md](./docs/technical/DEPLOYMENT.md) for complete deployment guide.

## 📁 Project Structure

```
services/
└── chariot/
    ├── backend/              # Chariot Backend (NestJS 11)
    ├── frontend/             # Chariot Frontend (Next.js 15)
    ├── compose.yml    # Dev configuration
    ├── compose.prod.yml
    └── compose.integ.yml

infrastructure/
├── compose.yml        # Infrastructure services
├── prometheus/               # Metrics & alerts
├── grafana/                  # Dashboards
├── loki-config.yml          # Log aggregation
└── promtail-config.yml      # Log collection

shared/                       # Shared library
├── types/                    # TypeScript interfaces
├── utils/                    # Helper functions
└── constants/                # App-wide constants
```

See `.env.example` for all available variables.

## 📚 Documentation

### Getting Started
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Development Process](./docs/development/DEVELOPMENT_PROCESS.md) - Development workflow
- [Branching Policy](./docs/development/BRANCHING_POLICY.md) - Git branching strategy
- [Release Workflow](./docs/development/RELEASE_WORKFLOW.md) - Release process

### Deployment
- [Deployment Guide](./docs/technical/DEPLOYMENT.md) - Complete deployment instructions
- [Environment Comparison](./docs/technical/ENVIRONMENTS_COMPARISON.md) - Dev/Integ/Prod differences
- [Docker Cheatsheet](./DOCKER_CHEATSHEET.md) - Quick reference for Docker commands

### Technical Documentation
- [API Conventions](./docs/technical/API_RESPONSE_CONVENTIONS.md) - API response standards
- [Monitoring Guide](./docs/technical/MONITORING.md) - Prometheus, Grafana, cAdvisor setup
- [Log Flow Diagram](./docs/technical/LOG_FLOW_DIAGRAM.md) - Centralized logging with Loki
- [Prometheus Configuration](./docs/technical/PROMETHEUS.md) - Metrics and alerts

### Service-Specific
- [Backend Documentation](./services/chariot/backend/docs/) - Backend architecture and standards
- [Frontend Documentation](./services/chariot/frontend/docs/) - Frontend patterns and i18n
- [Shared Library](./shared/README.md) - Common types, utils, and constants

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📝 License

See [LICENSE](./LICENSE) for details.

## 🔗 Technology Stack

- **Backend**: NestJS 11, TypeScript, Mongoose
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: MongoDB 8
- **Monitoring**: Prometheus, Grafana, Loki
- **Container**: Docker, Docker Compose
- **Package Manager**: pnpm workspaces

---

**Made with ❤️ by the Chariot Team**
