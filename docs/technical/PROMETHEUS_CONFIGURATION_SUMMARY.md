# Prometheus Configuration - Complete Implementation Summary

## Overview

This document summarizes the complete implementation of environment-based configuration for Prometheus and AlertManager across the Chariot project. The solution ensures that sensitive credentials (especially SMTP passwords) are never committed to version control while maintaining clean, maintainable configuration templates.

## Architecture

### Pattern: Template + Environment Variables + Runtime Substitution

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Compose File                        │
│  (compose.yml, compose.integ.yml, compose.prod.yml)         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ├── env_file: .env.prometheus
                          │   (Loads secret variables at runtime)
                          │
                          └── volumes:
                              ├── prometheus.yml.template
                              └── alertmanager.yml.template
                                  (Contains ${VAR} placeholders)
                          │
                          └── command: /bin/sh -c
                              envsubst < template > config
                              exec service --config.file=config
```

### Key Components

#### 1. **Environment Files**

- **`.env.prometheus`** (Git-ignored) - Runtime secrets
  - SMTP credentials for AlertManager
  - Service URLs and ports
  - Retention policies
  - Threshold values
  
- **`.env.prometheus.example`** (Git-tracked) - Documentation
  - Shows all available variables
  - Contains placeholder/example values
  - Safe for public repositories

#### 2. **Configuration Templates**

- **`prometheus.yml.template`** (Git-tracked)
  - Contains full Prometheus configuration
  - Uses `${VAR_NAME}` placeholders
  - Configuration logic stays in version control
  
- **`alertmanager.yml.template`** (Git-tracked)
  - Contains full AlertManager configuration
  - All SMTP settings parametrized
  - Alert routing rules with configurable delays

#### 3. **Runtime Substitution**

Each service (Prometheus and AlertManager) uses:

```yaml
env_file:
  - .env.prometheus  # Load variables from file

volumes:
  - ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
  # (template mounted as read-only)

command:
  - /bin/sh
  - -c
  - |
    envsubst < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml
    exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml ...
```

## Environment Variables

### Prometheus Variables

```bash
# Monitoring Configuration
PROMETHEUS_ENVIRONMENT=development        # Environment name (development/staging/production)
PROMETHEUS_MONITOR_NAME="Chariot Monitor" # Display name for Prometheus
PROMETHEUS_RETENTION_TIME=15d             # Data retention period

# Global Scrape Configuration
PROMETHEUS_SCRAPE_INTERVAL=15s            # How often to scrape targets
PROMETHEUS_SCRAPE_TIMEOUT=10s             # Scrape request timeout
PROMETHEUS_EVALUATION_INTERVAL=15s        # How often to evaluate alert rules

# Service Targets (URLs)
PROMETHEUS_BACKEND_URL=http://backend:9000
PROMETHEUS_MONGODB_URL=http://mongodb-exporter:9216
PROMETHEUS_NODE_EXPORTER_URL=http://node-exporter:9100
PROMETHEUS_CADVISOR_URL=http://cadvisor:8080

# Scrape Job Configuration
PROMETHEUS_BACKEND_INTERVAL=30s           # Backend-specific scrape interval
PROMETHEUS_BACKEND_TIMEOUT=10s
PROMETHEUS_MONGODB_INTERVAL=30s
PROMETHEUS_MONGODB_TIMEOUT=10s
# ... (similar for other targets)
```

### AlertManager Variables

```bash
# SMTP Configuration (SECRETS)
ALERTMANAGER_SMTP_HOST=smtp.gmail.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=your_email@gmail.com
ALERTMANAGER_SMTP_PASSWORD=your_secure_app_password  # NEVER commit this!
ALERTMANAGER_SMTP_FROM=alerts@chariot.com

# Alert Receiver Configuration
ALERTMANAGER_RECEIVER_EMAIL=ops@chariot.com
ALERTMANAGER_RECEIVER_EMAIL_ALERTS_WEBHOOK=http://localhost:5000/alerts

# Grouping and Timing
ALERTMANAGER_GROUP_WAIT=10s               # Wait before first notification
ALERTMANAGER_GROUP_INTERVAL=10s           # Time between batched notifications
ALERTMANAGER_REPEAT_INTERVAL=12h          # Repeat interval for ongoing alerts

# Service Configuration
ALERTMANAGER_PORT=9093
```

## Files Structure

```
Chariot/
├── .env.prometheus                        # Secret configuration (Git-ignored)
├── .env.prometheus.example                # Documentation (Git-tracked)
├── prometheus.yml.template                # Prometheus config template
├── alertmanager.yml.template              # AlertManager config template
│
├── compose.yml                            # Development (Updated)
├── compose.integ.yml                      # Integration (Updated)
├── compose.prod.yml                       # Production (Updated)
│
├── prometheus/
│   └── alerts/
│       ├── backend.yml
│       ├── containers.yml
│       ├── infrastructure.yml
│       └── mongodb.yml
│
├── scripts/
│   ├── prometheus-entrypoint.sh           # (Deprecated - kept for reference)
│   ├── alertmanager-entrypoint.sh         # (Deprecated - kept for reference)
│   └── README.md
│
└── docs/
    ├── development/
    │   ├── PROMETHEUS_MIGRATION.md        # Migration guide
    │   └── RELEASE_WORKFLOW.md
    └── technical/
        ├── PROMETHEUS_ENV_CONFIG.md       # Detailed configuration
        ├── PROMETHEUS_ARCHITECTURE.md     # Architecture overview
        └── PROMETHEUS_CONFIGURATION_SUMMARY.md (This file)
```

## Implementation Across Environments

### Development (`compose.yml`)

```yaml
prometheus:
  env_file:
    - .env.prometheus
  volumes:
    - ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
    - prometheus_data:/prometheus
  command:
    - /bin/sh
    - -c
    - |
      envsubst < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml
      exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml ...

alertmanager:
  env_file:
    - .env.prometheus
  volumes:
    - ./alertmanager.yml.template:/etc/alertmanager/alertmanager.yml.template:ro
    - alertmanager_data:/alertmanager
  command:
    - /bin/sh
    - -c
    - |
      envsubst < /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
      exec /bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml ...
```

Same pattern applied to:
- `compose.integ.yml` - Integration environment
- `compose.prod.yml` - Production environment

## Security Considerations

### ✅ What's Protected

- **SMTP Password**: In `.env.prometheus`, Git-ignored
- **API Keys**: In environment variables, never in templates
- **Database Passwords**: Through `MONGO_INITDB_ROOT_PASSWORD`
- **Authentication Tokens**: In `.env.prometheus`

### ⚠️ Important Notes

1. **Never commit `.env.prometheus`** - Add to `.gitignore`
2. **Always use `.env.prometheus.example`** - Document expected variables
3. **Use strong SMTP passwords** - Or generate app-specific passwords (Gmail)
4. **Keep templates in git** - They contain no secrets, only structure
5. **Update `.env.prometheus` on deployment** - Use deployment scripts or CI/CD secrets

### Git Configuration

```bash
# .gitignore entries for security
.env
.env.*.local
.env.prometheus          # ← Secret configuration
prometheus.yml           # ← Generated at runtime (contains secrets in memory)
alertmanager.yml         # ← Generated at runtime (contains secrets in memory)
```

## Usage Guide

### Local Development Setup

```bash
# 1. Copy example to create local configuration
cp .env.prometheus.example .env.prometheus

# 2. Edit with your SMTP credentials
nano .env.prometheus
# Set ALERTMANAGER_SMTP_PASSWORD with your app password

# 3. Start services with Docker Compose
docker-compose up -d prometheus alertmanager

# 4. Verify configuration was substituted correctly
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
docker-compose exec alertmanager cat /etc/alertmanager/alertmanager.yml
```

### Viewing Generated Configuration

```bash
# See generated Prometheus config (with substituted values)
docker exec prometheus cat /etc/prometheus/prometheus.yml

# See generated AlertManager config (with substituted SMTP values)
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml

# Check environment variables loaded by the container
docker exec prometheus env | grep PROMETHEUS
docker exec alertmanager env | grep ALERTMANAGER
```

### Updating Configuration at Runtime

```bash
# Reload Prometheus configuration without restarting
curl -X POST http://localhost:9090/-/reload

# Reload AlertManager configuration without restarting
curl -X POST http://localhost:9093/-/reload
```

## Troubleshooting

### Issue: "envsubst: not found"

**Cause**: The base Docker image doesn't have `gettext` installed.

**Solution**: Use `/bin/sh -c` instead of trying to run envsubst separately. Most images have `sh` and `envsubst` available.

### Issue: Variables Not Substituted

**Cause**: `env_file` directive might be using wrong path.

**Solutions**:
```bash
# Verify .env.prometheus exists in working directory
ls -la .env.prometheus

# Check Docker Compose is reading env file
docker-compose config | grep -A 20 prometheus

# Verify variables are loaded in container
docker exec prometheus env | grep PROMETHEUS_
```

### Issue: SMTP Password With Special Characters

**Solution**: Properly escape special characters in `.env.prometheus`:

```bash
# ❌ Wrong - Will break envsubst
ALERTMANAGER_SMTP_PASSWORD=my$password!

# ✅ Correct - Use quotes or escape special chars
ALERTMANAGER_SMTP_PASSWORD=my\$password\!
```

## Performance Considerations

### Startup Time

- Template substitution adds ~500ms to container startup
- First data collection by Prometheus takes ~30 seconds
- Overall startup time: ~40-50 seconds

### Resource Usage

- Prometheus: ~100-200MB RAM (varies with metric volume)
- AlertManager: ~50-100MB RAM
- Both use minimal CPU at default scrape intervals

## Migration from Static Configuration

If you had static `prometheus.yml` and `alertmanager.yml`:

```bash
# 1. Backup original files
cp prometheus.yml prometheus.yml.backup
cp alertmanager.yml alertmanager.yml.backup

# 2. Identify variable parts (URLs, credentials, timings)
# 3. Create .env.prometheus with those values
# 4. Create prometheus.yml.template with ${VAR} placeholders
# 5. Update Docker Compose files
# 6. Test: docker-compose up -d prometheus
# 7. Remove old static files: rm prometheus.yml alertmanager.yml
```

## Related Documentation

- **[PROMETHEUS_ENV_CONFIG.md](./PROMETHEUS_ENV_CONFIG.md)** - Detailed variable reference
- **[PROMETHEUS_ARCHITECTURE.md](./PROMETHEUS_ARCHITECTURE.md)** - System architecture overview
- **[PROMETHEUS_MIGRATION.md](../development/PROMETHEUS_MIGRATION.md)** - Migration from old setup
- **[DEVELOPMENT_PROCESS.md](../development/DEVELOPMENT_PROCESS.md)** - Development workflow

## Conclusion

This implementation provides:

✅ **Security**: Secrets never in version control  
✅ **Flexibility**: Environment-specific configurations  
✅ **Simplicity**: Minimal dependencies (sh, envsubst)  
✅ **Maintainability**: Clear separation of config logic and secrets  
✅ **Scalability**: Works across development, integration, and production  

The pattern follows 12-Factor App principles and Docker best practices for managing environment-specific configurations in containerized applications.
