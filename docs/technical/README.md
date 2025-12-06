# 🛠️ Technical Documentation

## 📡 API
- [API Response Conventions](API_RESPONSE_CONVENTIONS.md) - API response standards

## 🚀 Deployment
- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions for all environments
- [Environment Comparison](ENVIRONMENTS_COMPARISON.md) - Differences between dev/integ/prod
- [Docker Cheatsheet](../../DOCKER_CHEATSHEET.md) - Quick reference for Docker commands

## 🎨 Frontend
See [services/chariot/frontend/docs/](../../services/chariot/frontend/docs/) for:
- [Internationalization](../../services/chariot/frontend/docs/i18n.md) - i18n configuration
- [Frontend Contribution](../../services/chariot/frontend/docs/CONTRIBUTING.md) - Development standards

## ⚙️ Backend
See [services/chariot/backend/docs/](../../services/chariot/backend/docs/) for:
- [Logger](../../services/chariot/backend/docs/logger.md) - Log configuration
- [Stripe](../../services/chariot/backend/docs/stripe.md) - Payments integration
- [Access rights](../../services/chariot/backend/docs/rights.md) - Permission system
- [Backend Contribution](../../services/chariot/backend/docs/CONTRIBUTING.md) - Development standards

## 🔐 Authentication & SSO
See [services/sso/docs/](../../services/sso/docs/) for:
- [SSO Integration Guide](../../services/sso/docs/SSO_INTEGRATION.md) - Complete Keycloak setup and integration
  - Architecture overview with Keycloak 23.0.7
  - Custom theme development (Tailwind CSS v4)
  - Multi-language support (French, English, Spanish)
  - Email templates and SMTP configuration
  - Frontend integration (Next.js with keycloak-js)
  - Backend integration (NestJS with passport-keycloak-bearer)
  - Token management and security
  - Troubleshooting guide
  - **START HERE for authentication questions**

## 📊 Monitoring & Observability

### Logging
- **[Logging Flow Diagram](LOG_FLOW_DIAGRAM.md)** - Complete centralized logging with Loki & Promtail
  - Architecture and log flow
  - Configuration for Backend, Frontend, and MongoDB
  - Retention policies and troubleshooting
  - Development behavior (console-only in dev)
  - **START HERE for logging questions**

### Monitoring & Metrics
- [Monitoring Guide](MONITORING.md) - Complete monitoring setup (Prometheus, cAdvisor, Node Exporter)
- [Prometheus Configuration](PROMETHEUS.md) - Prometheus scrape jobs and alerts
- [macOS Compatibility](MONITORING_MACOS.md) - Node Exporter on macOS

## 📋 Architecture

### Microservices Architecture
- **Structure**: Monorepo with pnpm workspaces
- **Services**: 
  - `services/chariot/backend`: NestJS 11 API
  - `services/chariot/frontend`: Next.js 15 UI
- **Infrastructure**: Centralized monitoring, logging, and alerting
  - `infrastructure/prometheus`: Metrics collection and alerts
  - `infrastructure/grafana`: Visualization dashboards
  - `infrastructure/loki`: Log aggregation
  - `infrastructure/alertmanager`: Alert management
- **Shared Library**: `@chariot/shared` - Common types, utilities, and constants
- **Database**: MongoDB 8.0.15 (production/integration), latest (development)
- **Authentication**: Integrated system with permission management
- **Payments**: Stripe integration
- **Logs**: Winston (backend), console (development)

### Deployment Environments
- **Development**: Hot-reload, verbose logs, development database
- **Integration**: Production builds, testing infrastructure, fast healthchecks
- **Production**: Optimized builds, resource limits, minimal logs, automatic restarts

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment documentation.