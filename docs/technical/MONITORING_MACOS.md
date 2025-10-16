# 🍎 macOS Compatibility - Node Exporter

## Overview

Node Exporter works differently on macOS compared to Linux due to Docker Desktop's architecture.

### Architecture Difference

```
macOS Environment:
┌─────────────────────────────────────────────────────────┐
│                      macOS                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Docker Desktop (Linux VM)                  │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  Node Exporter Container                  │    │  │
│  │  │  (monitors the Linux VM, not macOS)      │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  │                                                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Linux Environment:
┌─────────────────────────────────────────────────────────┐
│                    Linux Server                          │
│  ┌──────────────────────────────────────────┐           │
│  │  Node Exporter Container                  │           │
│  │  (monitors the server directly)          │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

**Key Point:** On macOS, Node Exporter monitors Docker Desktop's Linux VM, not your Mac directly.

---

## Configuration

### compose.yml - macOS Version

The configuration has been adapted for macOS compatibility:

```yaml
node-exporter:
  image: prom/node-exporter:latest
  container_name: node-exporter
  restart: always
  ports:
    - "${NODE_EXPORTER_PORT}:9100"
  command:
    - '--path.rootfs=/host'
    - '--path.procfs=/host/proc'
    - '--path.sysfs=/host/sys'
    - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
  volumes:
    # ⚠️ macOS: No 'rslave', only 'ro'
    - /:/host:ro
  # ⚠️ macOS: No network_mode: host or pid: host
  networks:
    - default
```

### Differences vs Linux

| Configuration | Linux | macOS | Reason |
|---------------|-------|-------|--------|
| **Volume** | `/:/host:ro,rslave` | `/:/host:ro` | `rslave` not supported on macOS |
| **Network** | `network_mode: host` | `networks: default` | Host mode not available on macOS |
| **PID** | `pid: host` | Not specified | Different PID isolation on macOS |
| **Prometheus Target** | `node-exporter:9100` | `node-exporter:9100` | Same via Docker network |

---

## Common Errors

### Error: "rslave not supported"

```bash
# ❌ Error message
Error response from daemon: path / is mounted on / but it is not a shared or slave mount

# ✅ Solution
# Already fixed in compose.yml
# Volume configured as: /:/host:ro (without rslave)
```

### Verification

```bash
# Check effective configuration
docker compose config | grep -A 15 node-exporter

# Verify 'rslave' is not present
docker compose config | grep rslave
# (no output = good)

# Check volumes
docker inspect node-exporter | jq '.[0].Mounts'
```

---

## Available Metrics

### ✅ Working Metrics on macOS

These metrics work correctly and monitor Docker Desktop's VM:

```promql
# CPU (of Docker Desktop VM)
node_cpu_seconds_total
rate(node_cpu_seconds_total{mode="idle"}[5m])

# Memory (of Docker Desktop VM)
node_memory_MemTotal_bytes
node_memory_MemAvailable_bytes

# Disk (of Docker Desktop VM)
node_filesystem_size_bytes
node_filesystem_avail_bytes

# Network (of Docker Desktop VM)
node_network_receive_bytes_total
node_network_transmit_bytes_total

# Load Average (of the VM)
node_load1, node_load5, node_load15
```

### ⚠️ Limited Metrics on macOS

These metrics may be absent or inaccurate:

```promql
# ❌ Hardware temperatures (Mac not accessible)
node_hwmon_*

# ❌ Mac-specific sensors
node_thermal_*

# ⚠️ Disk: May only show virtual disk
node_disk_*
```

---

## Understanding Metrics

### Memory Example

**Mac Setup:**
- MacBook Pro
- 32 GB total RAM
- Docker Desktop: 8 GB allocated

**Node Exporter Metrics:**
```promql
node_memory_MemTotal_bytes / 1024 / 1024 / 1024
# Result: ~8 GB (not 32 GB)
```

**Why?**
- Node Exporter sees the Docker VM (8 GB)
- Not the complete Mac (32 GB)
- This is **normal and expected** on macOS

**Useful for:**
- Knowing if Docker VM is low on RAM
- Optimizing Docker Desktop allocation
- Monitoring containers within their limits

---

## Docker Desktop Settings

You can adjust resources allocated to Docker Desktop:

```
Docker Desktop > Settings > Resources
├── CPUs: 4 cores
├── Memory: 8 GB    ← What node-exporter will see
├── Disk: 64 GB
└── Swap: 1 GB
```

**Note:** Increasing these values will increase the resources Node Exporter monitors.

---

## Testing

```bash
# Check node-exporter is responding
curl http://localhost:9100/metrics | head -20

# Count available metrics
curl -s http://localhost:9100/metrics | grep "^node_" | wc -l
# Should return 200-300 metrics

# Check key metrics
curl -s http://localhost:9100/metrics | grep "node_memory_MemTotal"
curl -s http://localhost:9100/metrics | grep "node_cpu_seconds_total"

# Check in Prometheus
open http://localhost:9090/targets
# node-exporter should show UP (green)
```

---

## When to Use

### ✅ Good for:

- **Local Development:** Test PromQL queries
- **Proof of Concept:** Validate monitoring architecture
- **Learning:** Learn Prometheus and PromQL
- **CI/CD:** Automated tests

### ❌ Limitations:

- **Mac Monitoring:** Doesn't replace Activity Monitor
- **Accurate Metrics:** VM vs actual Mac
- **Production-like:** Deploy on Linux for realism

### 💡 Recommendation

```
Development (macOS)
  └─> Node Exporter in Docker
      ├─ OK for learning
      ├─ OK for testing
      └─ OK for development

Production (Linux)
  └─> Native Node Exporter
      ├─ Complete metrics
      ├─ Optimal performance
      └─ Standard configuration
```

---

## Alternative: Monitor macOS Directly

If you want to monitor your Mac (not the Docker VM):

### Option 1: Grafana Agent
```bash
brew install grafana-agent
# Configure to send to Prometheus
```

### Option 2: Telegraf
```bash
brew install telegraf
# Configure Prometheus output
```

### Option 3: Production on Linux
```
🚀 Recommended: Deploy to production on Linux

On Linux:
✅ All metrics available
✅ Optimal performance
✅ Standard configuration
✅ Host mode supported
```

---

## Checklist

### Installation

- [x] Environment variables in `.env`
  ```bash
  NODE_EXPORTER_PORT=9100
  ```

- [x] Configuration without `rslave` in `compose.yml`
  ```yaml
  volumes:
    - /:/host:ro  # No rslave
  ```

- [x] Docker network (not host mode)
  ```yaml
  networks:
    - default
  ```

- [x] Prometheus configured with service name
  ```yaml
  - targets: ['node-exporter:9100']
  ```

### Verification

```bash
# 1. Service started
docker compose ps node-exporter
# Status: Up (healthy)

# 2. Port accessible
curl http://localhost:9100/metrics
# Returns metrics

# 3. Prometheus scraping OK
open http://localhost:9090/targets
# node-exporter: UP (green)

# 4. Metrics in Prometheus
curl "http://localhost:9090/api/v1/query?query=node_memory_MemTotal_bytes"
# Returns a value
```

---

## Resources

- [Node Exporter GitHub](https://github.com/prometheus/node_exporter)
- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- [Main Monitoring Guide](MONITORING.md)

---

**💡 TL;DR:** Node Exporter works on macOS but monitors the Docker VM, not your Mac directly. Perfect for development and learning, but deploy on Linux for production.
