# Scripts

This directory contains automation and helper scripts for the Chariot project.

## Deployment Scripts

### deploy.sh

Automated deployment script for all environments (dev/integ/prod).

**Features**:
- Prerequisite validation (Docker, .env file)
- Network creation
- Environment-specific deployment
- Service healthcheck verification
- URL display after successful deployment

**Usage**:
```bash
# Development environment
./scripts/deploy.sh dev

# Integration environment
./scripts/deploy.sh integ

# Production environment
./scripts/deploy.sh prod
```

**What it does**:
1. Validates Docker and .env are present
2. Creates `chariot-network` if needed
3. Builds and starts services with appropriate compose files
4. Waits for all healthchecks to pass
5. Displays URLs for all running services

See [docs/technical/DEPLOYMENT.md](../docs/technical/DEPLOYMENT.md) for complete deployment documentation.

### server-setup.sh

Comprehensive server setup script for production/integration deployments.

**Features**:
- Docker and Docker Compose installation
- User and directory structure creation
- Automated backups with cron jobs
- Systemd service for auto-start
- Firewall configuration (UFW)
- Nginx reverse proxy templates
- SSL/TLS certificate setup instructions

**Usage**:
```bash
# Must be run as root on Ubuntu/Debian server
sudo ./scripts/server-setup.sh
```

**What it does**:
1. Installs Docker and Docker Compose
2. Creates `chariot` user with proper permissions
3. Sets up directories in `/opt/chariot/`
4. Configures automated backups (daily at 2 AM)
5. Creates systemd service for auto-start on boot
6. Sets up firewall rules (80, 443, 22)
7. Provides Nginx templates with SSL placeholders
8. Displays next steps for SSL certificate generation

**Post-installation**:
- Copy your project to `/opt/chariot/`
- Configure `.env` file with production values
- Set up SSL with certbot
- Start services: `sudo systemctl start chariot`

## Infrastructure Scripts

### prometheus-entrypoint.sh

Initialization script for Prometheus that:
1. Loads environment variables from `.env`
2. Substitutes placeholders in `infrastructure/prometheus.yml.template`
3. Generates finalized `prometheus.yml`
4. Launches Prometheus

**Location**: Mounted in Prometheus container  
**Template**: `infrastructure/prometheus.yml.template`

**Usage**:
```yaml
# In compose.yml (infrastructure/)
prometheus:
  entrypoint: /scripts/prometheus-entrypoint.sh
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

### alertmanager-entrypoint.sh

Initialization script for AlertManager that:
1. Loads environment variables from `.env`
2. Substitutes placeholders in `infrastructure/alertmanager.yml.template`
3. Generates finalized `alertmanager.yml`
4. Validates required SMTP variables
5. Launches AlertManager

**Location**: Mounted in Alertmanager container  
**Template**: `infrastructure/alertmanager.yml.template`

**Required Environment Variables**:
- `SMTP_FROM`: Sender email address
- `SMTP_SMARTHOST`: SMTP server (e.g., smtp.gmail.com:587)
- `SMTP_USERNAME`: SMTP authentication username
- `SMTP_PASSWORD`: SMTP authentication password
- `SMTP_TO`: Alert recipient email

**Usage**:
```yaml
# In compose.yml (infrastructure/)
alertmanager:
  entrypoint: /scripts/alertmanager-entrypoint.sh
  command:
    - '--config.file=/etc/alertmanager/alertmanager.yml'
    - '--storage.path=/alertmanager'
```

## Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: V2
- **envsubst**: Available in `alpine:latest`, `ubuntu:latest` (for entrypoint scripts)
- **.env file**: All environment variables must be configured (no defaults)

## Troubleshooting

### Error: Command not found: envsubst

Make sure your Docker image contains `envsubst`:
```dockerfile
# Add to your custom Dockerfile
FROM prom/prometheus:latest
RUN apk add --no-cache gettext
```

Or use an image that already contains it (our infrastructure images already include it).

### Error: Template not found

Check the volume mounts in your compose file:
```yaml
volumes:
  - ./infrastructure/prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
  - ./scripts:/scripts:ro
```

### Variables are not being substituted

Verify:
1. Variables are defined in `.env` file at project root
2. Template uses `${VAR_NAME}` syntax (not `$VAR_NAME`)
3. `envsubst` is available in the container

Test manually:
```bash
# Inside container
envsubst < /etc/prometheus/prometheus.yml.template
```

### Deployment script fails

Common issues:
- **Docker not running**: `sudo systemctl start docker`
- **.env file missing**: Create from `.env.example`
- **Network conflicts**: Remove existing network: `docker network rm chariot-network`
- **Port conflicts**: Stop services using ports 3000, 9000, 27017, etc.

### Server setup script fails

Common issues:
- **Not run as root**: Must use `sudo`
- **Unsupported OS**: Designed for Ubuntu/Debian
- **Docker already installed**: Script will skip installation
- **Firewall issues**: Manually configure with `sudo ufw allow 80/443`
```bash
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -i environment
```
