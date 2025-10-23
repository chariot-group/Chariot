````markdown
# 📊 Prometheus and AlertManager - Complete Guide

## 📋 Overview

This guide covers the complete implementation and troubleshooting of Prometheus and AlertManager configuration in the Chariot project.

- **Architecture**: Environment variable-based configuration
- **Security**: Credentials protected in `.env.prometheus` (Git-ignored)
- **Multi-environment**: Support for dev, integ, and prod
- **Status**: ✅ Functional and stable

---

## 🏗️ Technical Architecture

### Implementation Pattern

```
┌─────────────────────────────────────────────────┐
│         Docker Compose Files                    │
│  (compose.yml, integ, prod)                    │
└─────────────────────────────────────────────────┘
           │
           ├─ env_file: .env.prometheus
           │  (Environment variables loaded at runtime)
           │
           ├─ volumes:
           │  ├─ prometheus.yml.template
           │  └─ alertmanager.yml.template
           │  (Configuration with placeholders ${VAR})
           │
           └─ entrypoint: /usr/local/bin/*-entrypoint.sh
              (Variable substitution scripts)
```

### ⚠️ Multi-platform Compatibility (Linux vs macOS)

Prometheus configuration works on **all platforms** (Linux, macOS, Windows) thanks to **environment variables**:

| Platform | Strategy | Example |
|----------|----------|---------|
| **Linux** (Prod) | Service names via bridge network | `backend:9000` |
| **macOS** (Docker Desktop) | host.docker.internal | `host.docker.internal:9000` |

**Solution:** Targets are parameterizable via `.env.prometheus` → a single template configuration works everywhere! 🎉

### Execution Flow

1. **Docker Compose starts** → Loads `.env.prometheus` via `env_file:`
2. **Entrypoint script executed** → Reads environment variables
3. **Sed substitution** → Replaces `${VAR}` in templates
4. **Service launched** → Uses generated configuration

### Services and Ports

| Service | Image | Port | Health Endpoint |
|---------|-------|------|-----------------|
| Prometheus | `prom/prometheus:latest` | 9090 | `http://localhost:9090/-/healthy` |
| AlertManager | `prom/alertmanager:latest` | 9093 | `http://localhost:9093/-/healthy` |

---

## 📁 File Structure

### Configuration Files

```
├── prometheus.yml.template           # Prometheus configuration template
├── alertmanager.yml.template         # AlertManager configuration template
├── .env.prometheus.example           # Environment variables example
├── .env.prometheus                   # ⚠️ Secrets (Git-ignored, local only)
│
├── compose.yml                       # Docker Compose (development)
├── compose.integ.yml                 # Docker Compose (integration)
├── compose.prod.yml                  # Docker Compose (production)
│
└── scripts/
    ├── prometheus-entrypoint.sh      # Prometheus entrypoint script
    └── alertmanager-entrypoint.sh    # AlertManager entrypoint script
```

---

## 🔐 Environment Variables (Minimum Required)

### Prometheus - Essential Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROMETHEUS_ENVIRONMENT` | `development` | "environment" label on metrics |
| `PROMETHEUS_MONITOR_NAME` | `chariot-monitor` | "monitor" label on metrics |
| `PROMETHEUS_SCRAPE_INTERVAL` | `15s` | Global collection frequency |
| `PROMETHEUS_EVALUATION_INTERVAL` | `15s` | Rule evaluation interval |

### Prometheus - Per-Job Intervals

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL` | `10s` | Backend collection |
| `PROMETHEUS_CADVISOR_SCRAPE_INTERVAL` | `15s` | Container metrics |
| `PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL` | `15s` | Machine metrics |
| `PROMETHEUS_MONGODB_SCRAPE_INTERVAL` | `15s` | MongoDB metrics |

### Prometheus - Targets

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROMETHEUS_SELF_TARGET` | `localhost:9090` | Prometheus self-monitoring |
| `PROMETHEUS_BACKEND_TARGET` | `backend:9000` | NestJS backend address |
| `PROMETHEUS_BACKEND_METRICS_PATH` | `/metrics` | Backend metrics endpoint |
| `PROMETHEUS_CADVISOR_TARGET` | `cadvisor:8080` | cAdvisor address |
| `PROMETHEUS_NODE_EXPORTER_TARGET` | `node-exporter:9100` | Node Exporter address |
| `PROMETHEUS_MONGODB_EXPORTER_TARGET` | `mongodb-exporter:9216` | MongoDB Exporter address |
| `PROMETHEUS_ALERTMANAGER_TARGET` | `alertmanager:9093` | AlertManager address |

### AlertManager - SMTP (Secrets ⚠️)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ALERTMANAGER_SMTP_FROM` | - | Sender email (required) |
| `ALERTMANAGER_SMTP_HOST` | - | SMTP server (required) |
| `ALERTMANAGER_SMTP_PORT` | - | SMTP port (587 for TLS) |
| `ALERTMANAGER_SMTP_USER` | - | SMTP login (required) |
| `ALERTMANAGER_SMTP_PASSWORD` | - | SMTP password (required) ⚠️ |
| `ALERTMANAGER_SMTP_REQUIRE_TLS` | `true` | TLS required |
| `ALERTMANAGER_RECEIVER_EMAIL` | - | Recipient email (required) |

### AlertManager - Timing and Grouping

| Variable | Default | Purpose |
|----------|---------|---------|
| `ALERTMANAGER_TIMEOUT` | `10s` | AlertManager connection timeout |
| `ALERTMANAGER_GROUP_WAIT` | `30s` | Wait before grouping alerts |
| `ALERTMANAGER_GROUP_INTERVAL` | `5m` | Grouping interval |
| `ALERTMANAGER_REPEAT_INTERVAL` | `3h` | Unresolved alerts repetition |
| `ALERTMANAGER_CRITICAL_GROUP_WAIT` | `10s` | Wait for critical alerts |
| `ALERTMANAGER_CRITICAL_REPEAT_INTERVAL` | `30m` | Critical alerts repetition |
| `ALERTMANAGER_RESOLVE_TIMEOUT` | `5m` | Resolution timeout |

**⚠️ WARNING**: Never commit `.env.prometheus` with real secrets to Git!

---

## 🚀 Usage

### Initial Configuration

```bash
# 1. Create local configuration
cp .env.prometheus.example .env.prometheus

# 2. Edit with SMTP credentials
# (Warning: never commit this file!)
nano .env.prometheus

# 3. Verify that .env.prometheus is in .gitignore
grep ".env.prometheus" .gitignore
```

### ⚙️ Multi-OS Configuration (Linux vs macOS)

#### 🐧 Configuration for LINUX (CI/Prod) - Default

On Linux, containers communicate via Docker bridge network. **No modifications needed** - use the default configuration in `.env.prometheus.example`:

```bash
# ✅ Default (Linux) - Use service names
PROMETHEUS_BACKEND_TARGET=backend:9000
PROMETHEUS_CADVISOR_TARGET=cadvisor:8080
PROMETHEUS_NODE_EXPORTER_TARGET=node-exporter:9100
PROMETHEUS_MONGODB_EXPORTER_TARGET=mongodb-exporter:9216
PROMETHEUS_ALERTMANAGER_TARGET=alertmanager:9093
```

#### 🍎 Configuration for MACOS (Dev) - Override

On macOS with Docker Desktop, containers cannot directly access local services. Use `host.docker.internal` to access the host:

```bash
# 📝 Edit .env.prometheus and replace targets with:
PROMETHEUS_BACKEND_TARGET=host.docker.internal:9000
PROMETHEUS_CADVISOR_TARGET=host.docker.internal:8080
PROMETHEUS_NODE_EXPORTER_TARGET=host.docker.internal:9100
PROMETHEUS_MONGODB_EXPORTER_TARGET=host.docker.internal:9216
PROMETHEUS_ALERTMANAGER_TARGET=alertmanager:9093  # AlertManager remains local
```

**Why?**
- On macOS, Docker Desktop runs an intermediate Linux VM
- Service names (`backend`, `cadvisor`) are only accessible within the VM
- `host.docker.internal` is a special alias to access the host machine (macOS)
- Prometheus/AlertManager containers remain accessible via `localhost` in compose.yml

**macOS Checklist:**
```bash
# Verify configuration
grep "host.docker.internal" .env.prometheus

# Test connectivity from Prometheus
docker exec prometheus wget -v http://host.docker.internal:9000/metrics
```

### Start Services

```bash
# Development
docker-compose up -d prometheus alertmanager

# Integration
docker-compose -f compose.integ.yml up -d prometheus alertmanager

# Production
docker-compose -f compose.prod.yml up -d prometheus alertmanager
```

### Verify Startup

```bash
# See running services
docker-compose ps prometheus alertmanager

# Check logs
docker-compose logs prometheus --tail=20
docker-compose logs alertmanager --tail=20

# Test endpoints
curl http://localhost:9090/-/healthy
curl http://localhost:9093/-/healthy
```

### Verify Variable Substitution

```bash
# Display generated configuration (Prometheus)
docker exec prometheus cat /etc/prometheus/prometheus.yml | head -30

# Display generated configuration (AlertManager)
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml | head -30

# Verify a specific variable was replaced
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -A2 "external_labels"
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml | grep "smtp_from"
```

---

## 🔧 Entrypoint Scripts

### `scripts/prometheus-entrypoint.sh`

**Responsibilities:**
1. Read Prometheus environment variables (with default values)
2. Read AlertManager environment variables (timeout, etc.)
3. Substitute `${VAR}` in template via `sed`
4. Change working directory to `/etc/prometheus`
5. Execute Prometheus with provided arguments

**Technology:**
- Uses `sed` for substitution (Alpine compatible)
- No external dependency (`envsubst` not required)
- Standard shell `/bin/sh` (portability)

### `scripts/alertmanager-entrypoint.sh`

**Responsibilities:**
1. Read AlertManager environment variables (with default values)
2. Substitute `${VAR}` in template via `sed`
3. Change working directory to `/etc/alertmanager`
4. Execute AlertManager with provided arguments

---

## 🐛 Troubleshooting

### Services Restarting in Loop

**Symptom:** Containers display `Restarting (1)` in `docker-compose ps`

**Diagnosis:**
```bash
docker-compose logs prometheus --tail=50
docker-compose logs alertmanager --tail=50
```

**Common Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Error parsing command line arguments` | Incorrect shell syntax | Check entrypoint |
| `parsing YAML: not a valid duration string: "${VAR}"` | Variable not substituted | Verify `env_file: .env.prometheus` is present |
| `open prometheus.yml: no such file or directory` | Configuration not generated | Verify entrypoint script executed `sed` |

### Environment Variables Not Loaded

**Diagnosis:**
```bash
docker exec prometheus env | grep PROMETHEUS_
docker exec alertmanager env | grep ALERTMANAGER_
```

**Solution:** Verify that `.env.prometheus` exists and contains the variables.

### Incorrect Configuration

**Diagnosis:**
```bash
# Display generated configuration
docker exec prometheus cat /etc/prometheus/prometheus.yml

# Look for unreplaced values
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep "\${"
```

**Solution:** If `${VAR}` remains, the environment variable wasn't defined. Check `.env.prometheus`.

### Reload Configuration

```bash
# Without restarting containers (for Prometheus)
curl -X POST http://localhost:9090/-/reload

# Restart services
docker-compose restart prometheus alertmanager
```

---

## 🔐 Security

### Secret Protection

| Element | Security | Action |
|---------|----------|--------|
| `.env.prometheus` | 🔴 SECRETS | Git-ignored (do not commit) |
| `.env.prometheus.example` | 🟢 SAFE | Git-tracked (example only) |
| `prometheus.yml.template` | 🟢 SAFE | Git-tracked (no secrets) |
| `alertmanager.yml.template` | 🟢 SAFE | Git-tracked (no secrets) |
| Generated config in container | 🟡 MEMORY | Not persisted, encrypted in memory |

### Verify .gitignore Correctness

```bash
# Verify protection
cat .gitignore | grep "\.env\|prometheus\.yml\|alertmanager\.yml"

# Verify no secrets are tracked
git ls-files | grep ".env.prometheus"  # Should return nothing
```

### Best Practices

1. ✅ **Never commit** `.env.prometheus`
2. ✅ **Use** environment variables for secrets in CI/CD
3. ✅ **Validate** SMTP credentials are correct
4. ✅ **Restrict** access to servers having secrets

---

## 📈 Monitoring and Metrics

### Prometheus Targets

Prometheus collects metrics from:

```yaml
prometheus:9090        # Prometheus itself (self-monitoring)
backend:9000          # NestJS Backend
cadvisor:8080         # Docker containers metrics
node-exporter:9100    # Host machine metrics
mongodb-exporter:9216 # MongoDB metrics
```

### Interface Access

```
Prometheus Web UI:     http://localhost:9090
AlertManager Web UI:   http://localhost:9093
```

### Useful Prometheus Queries

```promql
# Scrape status
up{job="prometheus"}

# Running containers
container_last_seen{name="prometheus"}

# MongoDB disk space
mongodb_disk_storageSize_bytes

# Backend CPU
process_resident_memory_bytes{job="chariot-backend"}
```

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] `.env.prometheus` created locally (not git-tracked)
- [ ] Valid SMTP variables
- [ ] Service endpoints accessible
- [ ] `.gitignore` protects `.env.prometheus`

### After Deployment

- [ ] `docker-compose ps` shows services `Up (healthy)`
- [ ] Health checks respond correctly
- [ ] Configuration correctly generated (verify with `docker exec`)
- [ ] Logs without errors
- [ ] Prometheus collecting metrics
- [ ] AlertManager receiving routes

---

## 📊 Summary of Changes

### Initial Problem

Prometheus and AlertManager restarted in a loop with:
```
Error parsing command line arguments: unexpected /bin/sh
```

### Applied Solution

1. ✅ Dedicated entrypoint scripts (`prometheus-entrypoint.sh`, `alertmanager-entrypoint.sh`)
2. ✅ Substitution via `sed` (without `envsubst`)
3. ✅ Correct `entrypoint` and `command` configuration in Docker Compose
4. ✅ Working directory management

### Result

```
NAME           IMAGE                  STATUS
prometheus     prom/prometheus:latest Up 1 minute (healthy) ✅
alertmanager   prom/alertmanager      Up 1 minute (healthy) ✅
```

---

## 📞 Support

### Resources

- Prometheus docs: https://prometheus.io/docs/
- AlertManager docs: https://prometheus.io/docs/alerting/latest/overview/
- Docker Compose docs: https://docs.docker.com/compose/

### Reporting Issues

If you encounter a problem:

1. Check logs: `docker-compose logs SERVICE --tail=50`
2. Verify no configuration errors: see Troubleshooting section
3. Consult Prometheus/AlertManager documentation
4. Open an issue if the problem persists

````
