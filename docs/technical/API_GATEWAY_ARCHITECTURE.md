# API Gateway - Technical Architecture

## Overview

API Gateway built with NestJS 10, serving as centralized entry point for all Chariot microservices on port **8082**.

## Request Flow

```
Client (Browser)
    ↓ HTTPS
Traefik (Prod/Integ)
    ↓
Gateway (8082)
  → CORS validation
  → Rate limiting
  → Request logging
  → Metrics collection
  → Proxy to backends
    ↓
Adventure Service (9000)
```

## Core Features

### Routing & Proxy
- `/api/*` → forwards to Adventure service (removes `/api` prefix)
- All HTTP methods supported (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Header propagation with internal headers cleanup

### Rate Limiting
Configured per environment via `@nestjs/throttler`:

| Environment | Max Requests | Window |
|-------------|--------------|--------|
| Dev | 100 | 60s |
| Integ | 200 | 60s |
| Prod | 500 | 60s |

Excluded endpoints: `/health`, `/ready`, `/metrics`, `/`

### CORS Management
Centralized configuration:
- Dynamic origin based on `FRONTEND_URL` environment variable
- Credentials enabled
- Standard headers allowed

### Logging (Winston)
- JSON structured format with timestamps
- Daily log rotation (14 days retention)
- Files: `logger/logs/combined-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`
- Compliant with FR-001

### Metrics (Prometheus)
Exposed on `/metrics`:
- `http_requests_total` - Request counter (method, route, status)
- `http_request_duration_seconds` - Latency histogram (buckets: 0.1s, 0.5s, 1s, 2s, 5s)
- Node.js system metrics (CPU, memory, event loop, GC)

### Health Checks

**GET /health** - Always returns 200 if service is running
```json
{
  "status": "ok",
  "timestamp": "2025-12-30T...",
  "service": "chariot-gateway"
}
```

**GET /ready** - Checks backend connectivity
```json
{
  "status": "ready|not_ready",
  "checks": {
    "gateway": true,
    "adventure": true|false
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_PORT` | 8082 | Listen port |
| `GATEWAY_LOG_LEVEL` | info | Log level (debug/info/warn/error) |
| `GATEWAY_RATE_LIMIT_MAX` | 100 | Max requests per window |
| `GATEWAY_RATE_LIMIT_WINDOW` | 60000 | Time window (ms) |
| `ADVENTURE_SERVICE_URL` | http://chariot-adventure:9000 | Backend URL |
| `FRONTEND_URL` | http://localhost:3000 | Allowed CORS origin |

### Ports

| Service | Port | Exposure |
|---------|------|----------|
| Gateway | 8082 | External |
| Adventure | 9000 | Internal only |
| Frontend | 3000 | External |
| Keycloak | 8081 | External |

## Security

### Helmet Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Request Validation
- Body size limit: 10MB
- Automatic DTO validation with `class-validator`
- Whitelist-only properties

## Deployment

```bash
# Development
make up SERVICE=gateway ENV=dev

# Integration
make up SERVICE=gateway ENV=integ

# Production
make up SERVICE=gateway ENV=prod

# View logs
make logs SERVICE=gateway
```

## Monitoring

### Prometheus Scraper Config
```yaml
scrape_configs:
  - job_name: 'chariot-gateway'
    scrape_interval: 15s
    static_configs:
      - targets: ['gateway:8082']
    metrics_path: '/metrics'
```

### PromQL Examples
```promql
# Request rate
rate(http_requests_total[5m])

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## Future Evolutions

### Phase 2: Centralized Authentication
- JWT validation at gateway level
- User context injection via custom headers (`X-User-Id`, `X-User-Roles`)
- Remove redundant authentication from backend services

### Phase 3: Circuit Breaker
- Protection against cascade failures with `@nestjs/circuitbreaker`
- Configurable retry strategies

### Phase 4: API Versioning
- Support multiple API versions (`/api/v1/*`, `/api/v2/*`)

### Phase 5: Distributed Cache
- Redis integration for response caching
- Smart cache invalidation strategies

## References

- Gateway README: [services/gateway](../../services/gateway)
- Functional rules: [functional-rules.md](../functional-rules.md) (FR-002 to FR-006)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Throttler Module](https://docs.nestjs.com/security/rate-limiting)

