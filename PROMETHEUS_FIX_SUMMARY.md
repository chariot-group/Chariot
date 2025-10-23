# Prometheus and AlertManager Restart Loop - Fix Summary

## Problem
Both Prometheus and AlertManager containers were restarting continuously with the error:
```
Error parsing command line arguments: unexpected /bin/sh
```

This was followed by configuration errors when the issue was partially resolved:
```
Error loading config: open prometheus.yml: no such file or directory
```

## Root Cause
The initial Docker Compose configuration attempted to use inline shell commands with `command:` directives in an array format, which was being misinterpreted by Docker Compose. The commands were being parsed incorrectly, causing shell syntax errors.

## Solution
Implemented dedicated entrypoint shell scripts for both services that:

1. **Handle template substitution**: Use `sed` instead of `envsubst` (which isn't available in Alpine-based images)
2. **Substitute environment variables**: Both Prometheus and AlertManager specific variables
3. **Set working directory**: Change to the config directory so relative paths work correctly
4. **Execute the services**: Properly pass through the command-line arguments

## Changes Made

### Docker Compose Files (3 files)
- `compose.yml`
- `compose.integ.yml`
- `compose.prod.yml`

**Changes**:
- Replaced inline shell commands with `entrypoint:` directives pointing to dedicated scripts
- Set `command:` with proper argument arrays for each service
- Used relative paths for config files (e.g., `prometheus.yml` instead of `/etc/prometheus/prometheus.yml`)

Example Prometheus configuration:
```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
    - ./scripts/prometheus-entrypoint.sh:/usr/local/bin/prometheus-entrypoint.sh:ro
    - prometheus_data:/prometheus
  env_file:
    - .env.prometheus
  entrypoint: ["/usr/local/bin/prometheus-entrypoint.sh"]
  command: 
    - "--config.file=prometheus.yml"
    - "--storage.tsdb.path=/prometheus"
    - "--storage.tsdb.retention.time=15d"
    - "--web.enable-lifecycle"
    - "--web.console.libraries=/etc/prometheus/console_libraries"
    - "--web.console.templates=/etc/prometheus/consoles"
```

### Entrypoint Scripts

#### `scripts/prometheus-entrypoint.sh`
- Reads Prometheus environment variables with defaults
- Reads AlertManager timeout variable (used in Prometheus config)
- Uses `sed` to substitute all variables in the template
- Changes to `/etc/prometheus` directory
- Executes Prometheus with provided arguments

#### `scripts/alertmanager-entrypoint.sh`
- Reads AlertManager environment variables with defaults
- Uses `sed` to substitute all variables in the template
- Changes to `/etc/alertmanager` directory
- Executes AlertManager with provided arguments

## Variable Substitution

The scripts handle all variables needed by both services:

**Prometheus variables:**
- `PROMETHEUS_ENVIRONMENT`
- `PROMETHEUS_MONITOR_NAME`
- `PROMETHEUS_RETENTION_TIME`
- `PROMETHEUS_RETENTION_SIZE`
- `PROMETHEUS_SCRAPE_INTERVAL`
- `PROMETHEUS_EVALUATION_INTERVAL`
- `PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL`
- `PROMETHEUS_MONGODB_SCRAPE_INTERVAL`
- `PROMETHEUS_CADVISOR_SCRAPE_INTERVAL`
- `PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL`
- `PROMETHEUS_SELF_TARGET`
- `PROMETHEUS_BACKEND_TARGET`
- `PROMETHEUS_BACKEND_METRICS_PATH`
- `PROMETHEUS_CADVISOR_TARGET`
- `PROMETHEUS_NODE_EXPORTER_TARGET`
- `PROMETHEUS_MONGODB_EXPORTER_TARGET`
- `PROMETHEUS_ALERTMANAGER_TARGET`

**AlertManager variables:**
- `ALERTMANAGER_SMTP_FROM`
- `ALERTMANAGER_SMTP_HOST`
- `ALERTMANAGER_SMTP_PORT`
- `ALERTMANAGER_SMTP_USER`
- `ALERTMANAGER_SMTP_PASSWORD`
- `ALERTMANAGER_SMTP_REQUIRE_TLS`
- `ALERTMANAGER_RECEIVER_EMAIL`
- `ALERTMANAGER_TIMEOUT`
- `ALERTMANAGER_GROUP_WAIT`
- `ALERTMANAGER_GROUP_INTERVAL`
- `ALERTMANAGER_REPEAT_INTERVAL`
- `ALERTMANAGER_CRITICAL_GROUP_WAIT`
- `ALERTMANAGER_CRITICAL_REPEAT_INTERVAL`
- `ALERTMANAGER_RESOLVE_TIMEOUT`
- `ALERTMANAGER_EXTERNAL_URL`

All variables have sensible defaults, so containers work even without `.env.prometheus` file.

## Verification

Both services now start successfully and pass health checks:

```bash
NAME           IMAGE                      COMMAND                  SERVICE        STATUS
alertmanager   prom/alertmanager:latest   "/usr/local/bin/aler…"   alertmanager   Up 1 minute (healthy)
prometheus     prom/prometheus:latest     "/usr/local/bin/prom…"   prometheus     Up 13 seconds (healthy)
```

Health check endpoints respond correctly:
- Prometheus: `curl http://localhost:9090/-/healthy` → "Prometheus Server is Healthy."
- AlertManager: `curl http://localhost:9093/-/healthy` → "OK"

## Benefits

1. **Compatibility**: Uses `sed` instead of `envsubst`, works with any Linux base image
2. **Transparency**: Entrypoint scripts are visible and easy to modify
3. **Reliability**: No complex shell escaping or quoting issues
4. **Maintainability**: Separate scripts for each service, clear variable definitions
5. **Portability**: Same configuration works across development, integration, and production environments

## Future Improvements

Consider:
1. Adding logging to entrypoint scripts for debugging
2. Validating configuration files before starting services
3. Using health check endpoints in startup scripts
4. Adding support for additional configuration formats (e.g., Jsonnet for Prometheus)
