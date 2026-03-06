# Chariot API Gateway

## Overview

Centralized entry point for all Chariot microservices. Built with NestJS 10, it handles routing, rate limiting, CORS, and monitoring.

## Key Features

- **Reverse Proxy**: Dynamic routing to multiple backend services via `/api/{service}/*`
- **Multi-Service Support**: Extensible configuration for multiple microservices
- **Rate Limiting**: Configurable per environment (100-500 req/min)
- **Health Checks**: `/health` and `/ready` endpoints with backend connectivity checks
- **Metrics**: Prometheus metrics on `/metrics`
- **Logging**: Winston with daily rotation (14 days retention)

## Configuration

Port: **8082** (all environments)

### Environment Variables

```bash
GATEWAY_PORT=8082
GATEWAY_LOG_LEVEL=info
GATEWAY_RATE_LIMIT_MAX=100
GATEWAY_RATE_LIMIT_WINDOW=60000

# Backend Services
# Add services with pattern: {SERVICE_NAME}_SERVICE_URL
ADVENTURE_SERVICE_URL=http://chariot-adventure:9000
# Example for additional services:
# USERS_SERVICE_URL=http://chariot-users:9001
# ORDERS_SERVICE_URL=http://chariot-orders:9002

FRONTEND_URL=http://localhost:3000,http://localhost:3001
```

## Dynamic Routing

The gateway automatically routes requests based on the URL structure:

- `GET /api` - List available services
- `ALL /api/{service}/*` - Route to configured backend service

### URL Mapping Examples

| Client Request              | Backend Target                          |
| --------------------------- | --------------------------------------- |
| `/api/adventure/users`      | `ADVENTURE_SERVICE_URL/users`           |
| `/api/users/profile`        | `USERS_SERVICE_URL/profile`             |
| `/api/orders/123`           | `ORDERS_SERVICE_URL/123`                |

### Adding a New Service

1. Add environment variable: `{SERVICE_NAME}_SERVICE_URL=http://service-url:port`
2. Service name in URL will be lowercase with hyphens
3. Gateway automatically detects and routes to the new service
4. Health checks will include the new service

## Quick Start

```bash
# Start service
make up SERVICE=gateway ENV=dev

# View logs
make logs SERVICE=gateway

# Run tests
make test SERVICE=gateway
```

## Endpoints

- `GET /` - Gateway information
- `GET /health` - Health check
- `GET /ready` - Readiness check (includes all backend services connectivity)
- `GET /metrics` - Prometheus metrics
- `GET /api` - List available backend services
- `ALL /api/{service}/*` - Proxy to specified backend service

Example: `GET /api/campaigns` → `GET http://chariot-adventure:9000/campaigns`

## See Also

- Main README: [../../README.md](../../README.md)
- Technical docs: [../../docs/technical/README.md](../../docs/technical/README.md)
- Functional rules: [../../docs/functional-rules.md](../../docs/functional-rules.md)

