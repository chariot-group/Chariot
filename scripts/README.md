# Docker Entrypoint Scripts

## prometheus-entrypoint.sh

Initialization script for Prometheus that:
1. Loads environment variables from `.env.prometheus`
2. Substitutes placeholders in `prometheus.yml.template`
3. Generates finalized `prometheus.yml`
4. Launches Prometheus

**Usage**:
```yaml
# In docker-compose.yml
prometheus:
  entrypoint: /prometheus-entrypoint.sh
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

## alertmanager-entrypoint.sh

Initialization script for AlertManager that:
1. Loads environment variables from `.env.prometheus`
2. Substitutes placeholders in `alertmanager.yml.template`
3. Generates finalized `alertmanager.yml`
4. Launches AlertManager

**Usage**:
```yaml
# In docker-compose.yml
alertmanager:
  entrypoint: /alertmanager-entrypoint.sh
  command:
    - '--config.file=/etc/alertmanager/alertmanager.yml'
    - '--storage.path=/alertmanager'
```

## Requirements

- Docker image containing `envsubst` (available in `alpine:latest`, `ubuntu:latest`, etc.)
- Templates must be available at the mounted paths
- Environment variables must be defined in the Docker service

## Troubleshooting

### Error: Command not found: envsubst

Make sure your Docker image contains `envsubst`:
```dockerfile
# Add to your custom Dockerfile
FROM prom/prometheus:latest
RUN apk add --no-cache gettext
```

Or use an image that already contains it:
```yaml
image: alpine:latest  # For testing
```

### Error: Template not found

```
Error: prometheus.yml.template not found
```

Check the volume in docker-compose.yml:
```yaml
volumes:
  - ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
```

### Variables are not being substituted

Verify:
1. That variables are defined in `environment:`
2. That the template uses the `${VAR_NAME}` syntax (not `$VAR_NAME`)
3. That `envsubst` is available in the image

Test manually:
```bash
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -i environment
```
