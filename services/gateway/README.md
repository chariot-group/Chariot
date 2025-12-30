# Chariot API Gateway

## Overview

Centralized entry point for all Chariot microservices. Built with NestJS 10, it handles routing, rate limiting, CORS, and monitoring.

## Key Features

- **Reverse Proxy**: Routes `/api/*` to Adventure service
- **Rate Limiting**: Configurable per environment (100-500 req/min)
- **Health Checks**: `/health` and `/ready` endpoints
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
ADVENTURE_SERVICE_URL=http://chariot-adventure:9000
FRONTEND_URL=http://localhost:3000
```

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
- `GET /ready` - Readiness check (includes backend connectivity)
- `GET /metrics` - Prometheus metrics
- `ALL /api/*` - Proxy to Adventure service (removes `/api` prefix)

Example: `GET /api/campaigns` → `GET http://chariot-adventure:9000/campaigns`

## See Also

- Main README: [../../README.md](../../README.md)
- Technical docs: [../../docs/technical/README.md](../../docs/technical/README.md)
- Functional rules: [../../docs/functional-rules.md](../../docs/functional-rules.md)

