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
5. **Follow** the [installation guide](README.md#-quick-start)  
6. **Create** a branch following our [branching policy](docs/development/BRANCHING_POLICY.md)  
7. **Develop** following the technical standards  
8. **Test** your changes in all environments
   ```bash
   # Development
   docker-compose up
   
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

## 🆘 Help

- **Technical questions** → [Technical Documentation](docs/technical/README.md)  
- **Development process** → [Development Documentation](docs/development/README.md)  
- **Deployment issues** → [Deployment Guide](docs/technical/DEPLOYMENT.md)
- **Bug or feature request** → GitHub Issues  