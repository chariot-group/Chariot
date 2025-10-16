# 📊 Monitoring Prometheus - Guide Complet

## 🚀 Démarrage Rapide

### Démarrer l'infrastructure

```bash
docker-compose up -d
docker-compose ps  # Vérifier que tout tourne
```

### Accéder aux interfaces

| Service | URL | Description |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | Interface de monitoring |
| **cAdvisor** | http://localhost:8080 | Métriques des containers Docker |
| **Node Exporter** | http://localhost:9100/metrics | Métriques de la machine hôte |
| **Backend API** | http://localhost:3001 | API NestJS |
| **Métriques** | http://localhost:3001/metrics | Endpoint Prometheus |
| **Frontend** | http://localhost:3000 | Application Next.js |

### Vérification rapide

```bash
# Voir les métriques brutes
curl http://localhost:3001/metrics

# Vérifier les targets dans Prometheus
open http://localhost:9090/targets

# Première requête PromQL
open "http://localhost:9090/graph?g0.expr=chariot_http_requests_total"
```

---

## 🏗️ Architecture du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                               │
│                    (Navigateur Web)                              │
└────────────────────────┬────────────────────────────────────────┘
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
         │   Resources: Auth, Campaigns, │    │  Scraping
         │   Characters, Groups, etc.    │    │  toutes les
         └───────────────┬───────────────┘    │  10 secondes
                         │                     │
                         │ MongoDB             │
                         ▼                     │
         ┌───────────────────────────────┐    │
         │   MongoDB                      │    │
         │   Port: 27017                  │    │
         └────────────────────────────────┘    │
                                               │
         ┌─────────────────────────────────────┤
         │                                     │
         │  ┌──────────────────────────────┐  │
         │  │   cAdvisor                   │  │
         │  │   Port: 8080                 │◄─┤
         │  │   (Métriques containers)     │  │
         │  └──────────────────────────────┘  │
         │                                     │
         │  ┌──────────────────────────────┐  │
         │  │   Node Exporter              │  │
         │  │   Port: 9100                 │◄─┤
         │  │   (Métriques machine hôte)   │  │
         │  └──────────────────────────────┘  │
         │                                     │
         ▼                                     │
┌───────────────────────────────┐             │
│   Prometheus                   │             │
│   Port: 9090                   │─────────────┘
│                                │
│   Collecte:                    │
│   - chariot-backend            │
│   - cadvisor (containers)      │
│   - node-exporter (host)       │
│                                │
│   Stockage: Time-series DB     │
│   Rétention: 15 jours          │
└────────────────────────────────┘
```

### Flux de Collecte des Métriques

```
Requête HTTP → MetricsInterceptor (capture startTime)
             → Controller + Service exécutés
             → MetricsInterceptor (calcule duration, enregistre)
             → Réponse envoyée

Prometheus scrape (toutes les 10s)
             → GET http://backend:9000/metrics
             → Parse et stocke dans TSDB
```

---

## 📊 Types de Métriques

### 1. Counter (Compteur)
Valeur qui ne fait qu'augmenter.
```
Exemple: chariot_http_requests_total
Usage: Nombre total de requêtes
```

### 2. Gauge (Jauge)
Valeur qui peut monter et descendre.
```
Exemple: chariot_process_resident_memory_bytes
Usage: Utilisation de la mémoire
```

### 3. Histogram (Histogramme)
Distribution de valeurs avec buckets et percentiles.
```
Exemple: chariot_http_request_duration_seconds
Usage: Temps de réponse (p50, p95, p99)
```

### Labels et Cardinalité

```
Exemple: chariot_http_requests_total{method="GET", route="/campaigns", status_code="200"} 42

⚠️ Éviter les labels à haute cardinalité (ex: user_id avec 10,000+ valeurs)
```

---

## 📊 Métriques Disponibles

### Métriques HTTP (automatiques)
- `chariot_http_requests_total` - Compteur de requêtes
- `chariot_http_request_duration_seconds` - Temps de réponse (histogram)

### Métriques Système (automatiques)
- `chariot_process_cpu_*_seconds_total` - CPU
- `chariot_process_resident_memory_bytes` - Mémoire
- `chariot_nodejs_eventloop_lag_*` - Event loop
- `chariot_nodejs_heap_size_*` - Heap
- `chariot_nodejs_gc_duration_seconds` - Garbage collector

### Métriques Métier (définies, à implémenter)
- `chariot_campaigns_created_total`
- `chariot_active_campaigns`
- `chariot_characters_created_total`
- `chariot_groups_created_total`
- `chariot_active_users`
- `chariot_auth_attempts_total`
- `chariot_emails_sent_total`
- `chariot_stripe_payments_total`
- `chariot_errors_total`

> 📖 Voir `backend/docs/METRICS.md` pour implémenter les métriques métier

---

---

## 🎯 Requêtes PromQL Essentielles

Copiez-collez dans Prometheus: http://localhost:9090/graph

> 💡 **Note**: Pour les métriques des containers et de la machine hôte, consultez le [Guide de Monitoring des Containers](CONTAINER_MONITORING.md)

### Santé

```promql
# Application UP ?
up{job="chariot-backend"}

# Requêtes par seconde
rate(chariot_http_requests_total[5m])

# Temps de réponse moyen
rate(chariot_http_request_duration_seconds_sum[5m]) / rate(chariot_http_request_duration_seconds_count[5m])
```

### Performance

```promql
# 95% des requêtes < X secondes
histogram_quantile(0.95, rate(chariot_http_request_duration_seconds_bucket[5m]))

# Routes les plus lentes
topk(5, rate(chariot_http_request_duration_seconds_sum[5m]) / rate(chariot_http_request_duration_seconds_count[5m]))
```

### Ressources

```promql
# Mémoire (MB)
chariot_process_resident_memory_bytes / 1024 / 1024

# CPU utilisé
rate(chariot_process_cpu_seconds_total[5m])

# Event loop lag
chariot_nodejs_eventloop_lag_mean_seconds
```

### Fiabilité

```promql
# Taux d'erreur (%)
100 * sum(rate(chariot_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(chariot_http_requests_total[5m]))

# Requêtes par status
sum by (status_code) (chariot_http_requests_total)
```

### Anatomie d'une requête PromQL

```promql
histogram_quantile(0.95, rate(chariot_http_request_duration_seconds_bucket[5m]))

Décomposition:
1. chariot_http_request_duration_seconds_bucket → Métrique de base
2. [5m] → Fenêtre temporelle (5 dernières minutes)
3. rate(...) → Taux de changement par seconde
4. histogram_quantile(0.95, ...) → 95e percentile
```

---

---

## 🔧 Commandes Utiles

### Docker
```bash
docker-compose restart prometheus        # Redémarrer Prometheus
docker-compose restart backend          # Redémarrer le backend
docker-compose logs -f prometheus       # Voir les logs
docker-compose down                     # Arrêter tout
docker-compose down -v                  # Arrêter et supprimer volumes
```

### Debugging
```bash
curl http://localhost:3001/metrics | head -50              # Voir métriques
curl -s http://localhost:3001/metrics | grep "# TYPE" | wc -l   # Compter métriques
curl -s http://localhost:9090/api/v1/targets | jq          # Vérifier targets
curl -s "http://localhost:9090/api/v1/query?query=up" | jq # Requête PromQL via API
```

---

## 🎓 Concepts Clés

### Les 4 Golden Signals
```
1. LATENCY (Latence)       → chariot_http_request_duration_seconds
2. TRAFFIC (Trafic)        → rate(chariot_http_requests_total[5m])
3. ERRORS (Erreurs)        → chariot_http_requests_total{status_code="5xx"}
4. SATURATION (Saturation) → chariot_process_cpu_*, chariot_process_resident_memory_bytes
```

### Métriques vs Logs vs Traces
```
MÉTRIQUES (Prometheus)     → Données agrégées numériques, "Combien de req/s ?"
LOGS (Winston)             → Événements avec contexte, "Quelle erreur ?"
TRACES (OpenTelemetry)     → Parcours d'une requête, "Où est le bottleneck ?"
```

---

## 🚀 Prochaines Étapes

### Court terme
1. Tester en conditions réelles
2. Implémenter métriques métier (voir `backend/docs/METRICS.md`)

### Moyen terme
3. Installer Grafana (port 3002)
4. Créer dashboards (HTTP, latence, ressources)
5. Configurer alertes (latence > 1s, erreurs > 5%, mémoire > 80%)

### Long terme
6. Monitorer MongoDB (exporter MongoDB)
7. Monitorer Frontend (Next.js, Web Vitals)
8. Haute disponibilité (Thanos pour stockage long terme)

---

## ❓ FAQ

**Le backend ne démarre pas ?**
```bash
docker-compose logs backend
docker-compose exec backend npm install
docker-compose restart backend
```

**Prometheus ne scrape pas ?**
```bash
open http://localhost:9090/targets
curl http://localhost:3001/metrics
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
```

**Les métriques n'apparaissent pas ?**
```bash
curl http://localhost:3001/metrics
sleep 15  # Attendre le scrape interval
curl "http://localhost:9090/api/v1/query?query=chariot_http_requests_total"
```

**Réinitialiser les données ?**
```bash
docker-compose down
docker volume rm chariot_prometheus_data
docker-compose up -d
```

---

## ✅ Statut

| Composant | Statut | Port |
|-----------|--------|------|
| Prometheus | ✅ Opérationnel | 9090 |
| cAdvisor | ✅ Opérationnel | 8080 |
| Node Exporter | ✅ Opérationnel | 9100 |
| Backend /metrics | ✅ Opérationnel | 3001 |
| Métriques HTTP | ✅ Automatiques | - |
| Métriques Système | ✅ Automatiques | - |
| Métriques Containers | ✅ Automatiques | - |
| Métriques Métier | 🟡 Définies | - |
| Grafana | ⏳ Planifié | 3002 |

---

## 📚 Ressources

- [Documentation Prometheus](https://prometheus.io/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)
- [Guide de Monitoring des Containers](CONTAINER_MONITORING.md) - cAdvisor et Node Exporter
- `backend/docs/METRICS.md` - Guide d'implémentation

---

→ Première action: http://localhost:9090/graph 📊

