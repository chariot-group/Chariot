# 📊 Monitoring Guide - Chariot

Complete guide for monitoring the Chariot application with Prometheus, cAdvisor, and Node Exporter.

---

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architecture](#-architecture)
3. [Available Metrics](#-available-metrics)
4. [Essential PromQL Queries](#-essential-promql-queries)
5. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### 1. Configuration (30 seconds)

Add to your `.env` file:

```bash
# Monitoring services
PROMETHEUS_PORT=9090
CADVISOR_PORT=8080
NODE_EXPORTER_PORT=9100
```

### 2. Start Services (1 minute)

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# Wait 15-30 seconds for services to stabilize
```

### 3. Verification (1 minute)

Open these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | Main monitoring interface |
| **cAdvisor** | http://localhost:8080 | Container metrics UI |
| **Node Exporter** | http://localhost:9100/metrics | Host metrics (raw) |
| **Backend** | http://localhost:3001/metrics | Application metrics |

**Check that all targets are UP:**
```bash
open http://localhost:9090/targets
# All services should show green "UP" status
```

---

## 🏗️ Architecture

### Monitoring Stack Overview

```
┌────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 APPLICATION (Backend NestJS) → Port 9000                │
│     • HTTP requests, latency, errors                        │
│     • Node.js metrics (heap, GC, event loop)               │
│     • Business metrics (campaigns, users, etc.)            │
│                                                             │
│  🐳 CONTAINERS (cAdvisor) → Port 8080                       │
│     • CPU, RAM per container                                │
│     • Network (bytes in/out)                                │
│     • Disk (I/O reads/writes)                               │
│     • Identify resource-hungry containers                   │
│                                                             │
│  🖥️  HOST (Node Exporter) → Port 9100                      │
│     • Global CPU, total RAM                                 │
│     • Disk, load average                                    │
│     • Network, IOPS                                         │
│                                                             │
│                           ⬇️                                 │
│                     PROMETHEUS → Port 9090                  │
│              (Collection, Storage & Queries)                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
│                    (Web Browser)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Frontend Next.js            │
         │   Port: 3000                  │
         └───────────────┬───────────────┘
                         │
                         │ HTTP Requests
                         ▼
         ┌───────────────────────────────┐
         │   Backend NestJS              │
         │   Port: 3001 (host)           │
         │   Port: 9000 (container)      │
         │                               │
         │   ┌─────────────────────┐    │
         │   │  MetricsModule      │    │
         │   │  - /metrics         │◄───┼────┐
         │   │  - MetricsService   │    │    │
         │   │  - Interceptor      │    │    │
         │   └─────────────────────┘    │    │
         │                               │    │
         └───────────────┬───────────────┘    │
                         │                     │
                         │ MongoDB             │
                         ▼                     │
         ┌───────────────────────────────┐    │
         │   MongoDB                      │    │  Scraping
         │   Port: 27017                  │    │  every
         └────────────────────────────────┘    │  10-15s
                                               │
         ┌─────────────────────────────────────┤
         │                                     │
         │  ┌──────────────────────────────┐  │
         │  │   cAdvisor                   │  │
         │  │   Port: 8080                 │◄─┤
         │  │   (Container metrics)        │  │
         │  └──────────────────────────────┘  │
         │                                     │
         │  ┌──────────────────────────────┐  │
         │  │   Node Exporter              │  │
         │  │   Port: 9100                 │◄─┤
         │  │   (Host metrics)             │  │
         │  └──────────────────────────────┘  │
         │                                     │
         ▼                                     │
┌───────────────────────────────┐             │
│   Prometheus                   │             │
│   Port: 9090                   │─────────────┘
│                                │
│   Jobs:                        │
│   - chariot-backend            │
│   - cadvisor (containers)      │
│   - node-exporter (host)       │
│                                │
│   Storage: Time-series DB      │
│   Retention: 15 days           │
└────────────────────────────────┘
```

### The 3 Monitoring Levels

| Level | Tool | What it monitors | Use case |
|-------|------|------------------|----------|
| **1. Application** | Backend /metrics | HTTP requests, errors, latency, Node.js | "Is the backend slow?" |
| **2. Containers** | cAdvisor | CPU/RAM per container | "Which container is using too much RAM?" |
| **3. Host** | Node Exporter | Global system resources | "Is the server running out of disk space?" |

---

## 📊 Available Metrics

### 1. Application Metrics (Backend)

Exposed at: `http://localhost:3001/metrics`

#### HTTP Metrics (Automatic)
```promql
# Total requests
chariot_http_requests_total

# Request duration (histogram)
chariot_http_request_duration_seconds

# Requests by route, method, status
chariot_http_requests_total{route="/campaigns", method="GET", status_code="200"}
```

#### Node.js Metrics (Automatic)
```promql
# Memory
chariot_process_resident_memory_bytes
chariot_nodejs_heap_size_total_bytes

# CPU
chariot_process_cpu_seconds_total

# Event Loop
chariot_nodejs_eventloop_lag_seconds

# Garbage Collection
chariot_nodejs_gc_duration_seconds
```

#### Business Metrics (Defined, to implement)
```promql
chariot_campaigns_created_total
chariot_active_campaigns
chariot_characters_created_total
chariot_groups_created_total
chariot_active_users
chariot_auth_attempts_total
chariot_emails_sent_total
chariot_stripe_payments_total
chariot_errors_total
```

### 2. Container Metrics (cAdvisor)

Exposed at: `http://localhost:8080/metrics`

#### CPU
```promql
# CPU usage per container (millicores)
rate(container_cpu_usage_seconds_total{name="backend"}[5m]) * 1000

# Top 3 CPU consumers
topk(3, rate(container_cpu_usage_seconds_total[5m]))
```

#### Memory
```promql
# Memory used per container (MB)
container_memory_usage_bytes{name="backend"} / 1024 / 1024

# Memory usage percentage
100 * (container_memory_usage_bytes / container_spec_memory_limit_bytes)

# Container using most RAM
topk(1, container_memory_usage_bytes)
```

#### Network
```promql
# Traffic in (KB/s)
rate(container_network_receive_bytes_total{name="backend"}[5m]) / 1024

# Traffic out (KB/s)
rate(container_network_transmit_bytes_total{name="backend"}[5m]) / 1024
```

#### Disk
```promql
# I/O reads (bytes/s)
rate(container_fs_reads_bytes_total{name="mongodb"}[5m])

# I/O writes (bytes/s)
rate(container_fs_writes_bytes_total{name="mongodb"}[5m])
```

### 3. Host Metrics (Node Exporter)

Exposed at: `http://localhost:9100/metrics`

#### CPU
```promql
# Global CPU usage (%)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU per core
100 * (1 - avg by (cpu) (rate(node_cpu_seconds_total{mode="idle"}[5m])))

# Load average
node_load1, node_load5, node_load15
```

#### Memory
```promql
# Available RAM (GB)
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024

# RAM usage (%)
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# SWAP used (MB)
(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes) / 1024 / 1024
```

#### Disk
```promql
# Available disk space (GB)
node_filesystem_avail_bytes{mountpoint="/"} / 1024 / 1024 / 1024

# Disk usage (%)
100 * (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}))

# Read/write rate (MB/s)
rate(node_disk_read_bytes_total[5m]) / 1024 / 1024
rate(node_disk_written_bytes_total[5m]) / 1024 / 1024
```

---

## 🎯 Essential PromQL Queries

Copy-paste these into Prometheus: http://localhost:9090/graph

### Health

```promql
# All services UP?
up

# Requests per second
rate(chariot_http_requests_total[5m])

# Average response time
rate(chariot_http_request_duration_seconds_sum[5m]) / rate(chariot_http_request_duration_seconds_count[5m])
```

### Performance

```promql
# 95th percentile latency (seconds)
histogram_quantile(0.95, rate(chariot_http_request_duration_seconds_bucket[5m]))

# Slowest routes
topk(5, rate(chariot_http_request_duration_seconds_sum[5m]) / rate(chariot_http_request_duration_seconds_count[5m]))
```

### Reliability

```promql
# Error rate (%)
100 * sum(rate(chariot_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(chariot_http_requests_total[5m]))

# Requests by status
sum by (status_code) (chariot_http_requests_total)
```

### Resources

```promql
# Backend memory (MB)
container_memory_usage_bytes{name="backend"} / 1024 / 1024

# Backend CPU (millicores)
rate(container_cpu_usage_seconds_total{name="backend"}[5m]) * 1000

# System CPU (%)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Monitoring Scenarios

#### 1. Detect Resource-Hungry Containers
```promql
# Containers using > 80% CPU
rate(container_cpu_usage_seconds_total[5m]) > 0.8

# Containers using > 500 MB RAM
container_memory_usage_bytes / 1024 / 1024 > 500
```

#### 2. Compare Containers
```promql
# CPU comparison
sum by (name) (rate(container_cpu_usage_seconds_total{name=~"backend|frontend|mongodb"}[5m]))

# Memory comparison
sum by (name) (container_memory_usage_bytes{name=~"backend|frontend|mongodb"})
```

#### 3. Predict Issues
```promql
# Memory growth over 1 hour
delta(container_memory_usage_bytes[1h])

# Predict disk full (in 24h)
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 24*3600)
```

#### 4. Recommended Alerts
```promql
# Container CPU > 80% for 5 min
rate(container_cpu_usage_seconds_total{name="backend"}[5m]) > 0.8

# Container memory > 90% of limit
(container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9

# Host disk < 10% available
(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1

# Load average > number of CPUs
node_load5 > count(node_cpu_seconds_total{mode="idle"})
```

---

## 🔧 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs prometheus
docker compose logs cadvisor
docker compose logs node-exporter
docker compose logs backend

# Check status
docker compose ps

# Restart services
docker compose restart prometheus cadvisor node-exporter
```

### Target DOWN in Prometheus

```bash
# Open targets page
open http://localhost:9090/targets

# Test endpoints manually
curl http://localhost:3001/metrics
curl http://localhost:8080/metrics
curl http://localhost:9100/metrics

# Check Prometheus config
docker compose exec prometheus cat /etc/prometheus/prometheus.yml

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

### No Metrics Visible

```bash
# Test backend metrics
curl http://localhost:3001/metrics | head -50

# Wait for scrape interval (15 seconds)
sleep 15

# Query Prometheus API
curl -s "http://localhost:9090/api/v1/query?query=up" | jq
```

### Port Already in Use

```bash
# Check ports
lsof -i :9090  # Prometheus
lsof -i :8080  # cAdvisor
lsof -i :9100  # Node Exporter

# Change port in .env if needed
PROMETHEUS_PORT=9091
```

### macOS Specific Issues

**Node Exporter error: "rslave not supported"**
- ✅ Already fixed in `compose.yml`
- Configuration adapted for macOS (see [MONITORING_MACOS.md](MONITORING_MACOS.md))

**cAdvisor permission issues**
- Check Docker Desktop settings
- Ensure File Sharing is enabled for `/`

---

## 📋 Key Concepts

### The 4 Golden Signals

```
1. LATENCY (Response Time)    → chariot_http_request_duration_seconds
2. TRAFFIC (Request Rate)      → rate(chariot_http_requests_total[5m])
3. ERRORS (Error Rate)         → chariot_http_requests_total{status_code="5xx"}
4. SATURATION (Resource Usage) → container_cpu_usage_seconds_total, container_memory_usage_bytes
```

### Metric Types

| Type | Behavior | Example | Use Case |
|------|----------|---------|----------|
| **Counter** | Only increases | `chariot_http_requests_total` | Total requests |
| **Gauge** | Can go up/down | `container_memory_usage_bytes` | Current memory |
| **Histogram** | Distribution | `chariot_http_request_duration_seconds` | Latency percentiles |

### cAdvisor vs Node Exporter

| Aspect | cAdvisor | Node Exporter |
|--------|----------|---------------|
| **Target** | Docker containers | Host machine |
| **Granularity** | Per container | Global |
| **CPU** | CPU of each container | Total machine CPU |
| **Memory** | RAM of each container | Total machine RAM |
| **Use Case** | "Backend uses too much CPU" | "Server is out of RAM" |

---

## 🚀 Next Steps

### Short Term
1. ✅ Test in real conditions
2. ✅ Observe metrics for a few days
3. ⏳ Implement business metrics

### Medium Term
4. ⏳ Install Grafana (port 3002)
5. ⏳ Create dashboards (HTTP, latency, resources)
6. ⏳ Configure alerts (latency > 1s, errors > 5%, memory > 80%)

### Long Term
7. ⏳ Monitor MongoDB (MongoDB Exporter)
8. ⏳ Monitor Frontend (Next.js, Web Vitals)
9. ⏳ High availability (Thanos for long-term storage)

---

## 🛠️ Useful Commands

### Docker Compose

```bash
# Start monitoring stack
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f prometheus
docker compose logs -f cadvisor
docker compose logs -f node-exporter

# Restart services
docker compose restart prometheus cadvisor node-exporter

# Stop all
docker compose down

# Clean everything (including data)
docker compose down -v
```

### Testing

```bash
# View backend metrics
curl http://localhost:3001/metrics | head -50

# Count backend metrics
curl -s http://localhost:3001/metrics | grep "^chariot_" | wc -l

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Query via API
curl -s "http://localhost:9090/api/v1/query?query=up" | jq
```

---

## 📚 Resources

### Official Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [cAdvisor GitHub](https://github.com/google/cadvisor)
- [Node Exporter GitHub](https://github.com/prometheus/node_exporter)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)

### Project Documentation
- [MONITORING_MACOS.md](MONITORING_MACOS.md) - macOS specific configuration
- [API Response Conventions](API_RESPONSE_CONVENTIONS.md) - API standards

---

## ✅ Status Checklist

- [x] Prometheus configured and operational
- [x] cAdvisor configured and operational
- [x] Node Exporter configured and operational (macOS compatible)
- [x] Backend /metrics endpoint operational
- [x] HTTP metrics automatic
- [x] System metrics automatic
- [x] Container metrics automatic
- [ ] Business metrics (to implement)
- [ ] Grafana (planned)
- [ ] Alerting (planned)

---

**🎉 Your monitoring is now operational! You can monitor your application in real-time.**

**Quick check:** http://localhost:9090/targets → All targets should be UP (green) ✅
