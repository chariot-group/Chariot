# Observabilité Chariot

Ce document décrit **la stack de monitoring côté Chariot** : comment les signaux sont produits, comment ils transitent vers le dépôt [`Chariot-Group/monitoring`](https://github.com/Chariot-Group/monitoring) (clone local typique : `../monitoring`), et comment configurer **dev**, **integ** et **prod**.

La source de vérité applicative des logs reste **FR-logging-system** (Winston, injection Nest, pas de `console.log`).

## 1. Deux dépôts, un contrat

| Dépôt | Rôle |
| --- | --- |
| **Chariot** (ce repo) | Produit les signaux. Expose `/metrics` et `/ready`. Pousse logs (Loki) et traces (OTLP). Fait tourner **Grafana Alloy** qui scrape en local et envoie les métriques. |
| **Monitoring** (`../monitoring`) | Stocke et visualise. **Prometheus** (remote write), **Loki**, **Tempo**, **Grafana**, **Alertmanager**. Ne scrape plus les APIs Chariot depuis l’extérieur. |

Alloy est le **seul** point d’échange **métriques** avec le VPS Monitoring. Les APIs, Keycloak et les bases **ne sont pas** scrapées depuis l’extérieur.

Logs et traces **ne passent pas par Alloy** : chaque process pousse directement vers Loki et Tempo (via WireGuard en integ/prod).

```mermaid
flowchart LR
  subgraph chariot["VPS / Docker Chariot"]
    APIs["Nest APIs\ngateway adventure payment session media"]
    Web["Next.js web"]
    KC["Keycloak"]
    DBs["Mongo / Redis / Postgres"]
    Alloy["Grafana Alloy"]
    APIs -->|"GET /metrics"| Alloy
    Web -->|"GET /api/metrics"| Alloy
    KC -->|"GET /auth/metrics"| Alloy
    DBs -->|"exporters embarqués"| Alloy
    APIs -->|"GET /ready"| Alloy
  end

  subgraph monitoring["VPS / Docker Monitoring"]
    Proxy["prometheus-proxy\nCaddy basic auth\n/api/v1/write uniquement"]
    Prom["Prometheus"]
    Loki["Loki :3100"]
    Tempo["Tempo OTLP :4318"]
    Graf["Grafana :3005"]
    AM["Alertmanager"]
    Proxy --> Prom
    Prom --> AM
    Prom --> Graf
    Loki --> Graf
    Tempo --> Graf
    Tempo -->|"span metrics"| Prom
  end

  Alloy -->|"remote_write + basic auth"| Proxy
  APIs -->|"Winston LokiTransport"| Loki
  Web -->|"LokiTransport"| Loki
  APIs -->|"OTLP HTTP /v1/traces"| Tempo
```

## 2. Les trois signaux

| Signal | Producteur Chariot | Transport | Destination Monitoring |
| --- | --- | --- | --- |
| **Métriques** | `prom-client` / `@willsoto/nestjs-prometheus` + exporters Alloy | Alloy scrape local (15 s) → `remote_write` | Prometheus (`--web.enable-remote-write-receiver`) derrière Caddy |
| **Logs** | Winston (Nest) / logger Next | HTTP `POST {LOKI_URL}/loki/api/v1/push` | Loki |
| **Traces** | OpenTelemetry SDK Node | OTLP HTTP `{OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` | Tempo (4318) |
| **Readiness** | `GET /ready` (APIs), `GET /api/ready` (web), `GET /auth/health/ready` (Keycloak) | Alloy blackbox (`probe_success`) | Prometheus, job `chariot-ready` |

Activation logs / traces : **opt-in**. Tant que `LOKI_ENABLED` / `OTEL_ENABLED` ne valent pas `true`, rien n’est envoyé (les métriques Alloy fonctionnent indépendamment).

## 3. Architecture détaillée

### 3.1 Côté Chariot — `services/monitoring/`

Un seul service Docker : **Alloy** (`grafana/alloy:v1.11.2`).

| Fichier | Rôle |
| --- | --- |
| `config.alloy` | Jobs de scrape, exporters (Mongo, Redis, Postgres, node, blackbox), `remote_write` |
| `blackbox.yml` | Module HTTP 2xx pour les probes `/ready` |
| `compose.dev.yml` | Dev : UI Alloy `127.0.0.1:12345`, pas de montage `/` (Docker Desktop Mac) |
| `compose.integ.yml` | Integ : réseau `chariot-group-network-integ`, host monté pour le disque |
| `compose.prod.yml` | Prod : réseau `chariot-group-network-prod`, aucun port scrape publié |
| `.env.example` | Secrets Alloy + DSN exporters |

Alloy rejoint le **même réseau Docker** que les microservices (`chariot-group-network` / `-integ` / `-prod`, **external**). Il parle aux containers par leur `container_name`, sans publier 9100, 9216 ou `/metrics` hors du réseau.

### 3.2 Côté Monitoring — `../monitoring`

| Service | Port hôte (défaut) | Rôle |
| --- | --- | --- |
| Grafana | `3005` | Dashboards, Explore, corrélation logs ↔ traces ↔ métriques |
| prometheus-proxy (Caddy) | `9090` | Seul endpoint public : `POST /api/v1/write` + basic auth |
| Prometheus | *non publié* | TSDB 15 j, règles d’alerte, réception remote write |
| Loki | `3100` | Logs, rétention 7 j |
| Tempo | `3200`, OTLP `4317`/`4318` | Traces, rétention 7 j, span metrics → Prometheus |
| Alertmanager | `127.0.0.1:9093` | Email (optionnel) |
| node-exporter | `127.0.0.1:9200` | Host **Monitoring** (`host=monitoring`) |

Prometheus **ne scrape plus** `chariot-backend:9000`. Son template (`services/prometheus.yml.template`) ne cible que la stack Monitoring locale (lui-même, node-exporter, Loki, Tempo). Les séries Chariot arrivent **uniquement** par remote write.

Le proxy Caddy refuse tout le reste (UI Prometheus, queries) avec un 403 : *« Use Grafana. Prometheus write API only. »*

### 3.3 Comment les deux stacks sont liées

```
Chariot process ──metrics──► Alloy ──WireGuard / host.docker.internal──► Caddy ──► Prometheus
Chariot process ──logs─────► Loki (direct)
Chariot process ──traces───► Tempo (direct)
Grafana ──query──► Prometheus + Loki + Tempo
Tempo metrics_generator ──remote_write interne──► Prometheus (span metrics, service graph)
```

En **local**, tout est sur la même machine : Alloy utilise `http://host.docker.internal:9090/api/v1/write`, les APIs `http://host.docker.internal:3100` et `:4318`.

En **integ/prod**, le VPS Monitoring a une IP WireGuard (exemple dans les `.env.example` : `10.8.0.1`). C’est cette IP que Chariot utilise pour Loki, OTLP et remote write. `PROMETHEUS_BIND` côté Monitoring doit être cette IP WireGuard, **pas** `0.0.0.0` public.

Grafana a **deux jeux de datasources** (`prod` / `integ`) et un sélecteur `env` sur les dashboards. En local les deux URLs pointent sur la même stack.

## 4. Transit des données

### 4.1 Métriques applicatives

1. Chaque API Nest enregistre des compteurs / histogrammes (`MetricsInterceptor` + métriques métier).
2. `GET /metrics` sert le format Prometheus (`prom-client`). Middleware **HTTP Basic Auth** (`metricsBasicAuthMiddleware`) :
   - identifiants absents **et** `NODE_ENV` ∈ `{production, integ}` → **503** ;
   - identifiants absents en dev → accès libre ;
   - mauvais identifiants → **401**.
3. Alloy scrape `job=chariot-apis` toutes les 15 s, avec le même basic auth, et pose le label `service` (gateway, adventure, payment, session, media).
4. Alloy envoie le batch vers `ALLOY_REMOTE_WRITE_URL` (user/password = `PROMETHEUS_AUTH_*` du repo Monitoring).
5. Grafana interroge Prometheus (datasources `prometheus-prod` / `prometheus-integ`).

Next.js n’expose **pas** de vrai registre Prometheus : `GET /api/metrics` renvoie un heartbeat texte (`# chariot web scrape`). Alloy scrape `job=chariot-web` pour le `up` uniquement.

Keycloak : interface management port **9000**, chemin `/auth/metrics` (`KC_METRICS_ENABLED=true`, `http-relative-path=/auth`). Job Alloy `keycloak`.

### 4.2 Métriques infra (embarqué Alloy)

Alloy n’a pas besoin d’exporters séparés. Il embarque :

| Exporter Alloy | Source | Labels principaux | Job Prometheus |
| --- | --- | --- | --- |
| `prometheus.exporter.mongodb` | `MONGODB_URI` (Adventure) | `store=mongo`, `service=adventure` | `mongodb` |
| `prometheus.exporter.redis` | `REDIS_ADDR` (Session) | `store=redis`, `service=session` | `redis` |
| `prometheus.exporter.postgres` × 2 | DSN session + payment | `store=session` / `store=payment` | `postgres` |
| `prometheus.exporter.unix` | `/proc`, `/sys`, `/` (ou `/host` en prod) | `host=chariot` | `chariot-node` |
| `prometheus.exporter.blackbox` | URLs `/ready` | `service=…` | `chariot-ready` |

Sur le VPS Monitoring, le **node-exporter** du compose Monitoring a `host=monitoring`. Les alertes infra (`NodeDown`) ciblent `job=~"node-exporter|chariot-node"` : on distingue les deux hôtes par le label `host`.

**MinIO** n’a pas d’exporter Alloy. Les dashboards « Data stores / MinIO » s’appuient sur les métriques **applicatives media** (`chariot_media_*`).

### 4.3 Logs

Le flux actuel :

```
Logger.info / error
  → Winston (Nest) ou logger Next
  → LokiTransport (si LOKI_ENABLED=true et LOKI_URL défini)
  → batch 2 s ou 50 lignes
  → POST /loki/api/v1/push
```

Labels de stream Loki :

- `service` : `gateway` | `adventure` | `payment` | `session` | `media` | `web`
- `environment` : `OTEL_ENVIRONMENT` (sinon `NODE_ENV` / `NEXT_PUBLIC_ENV_NAME`)
- `app` : `chariot`
- `level` : `info` | `warn` | `error` | …

Corps de ligne : JSON `{ message, context?, stack?, trace_id?, span_id?, … }`.

`trace_id` / `span_id` sont lus sur le span OpenTelemetry actif si le SDK est démarré. Grafana Loki a un *derived field* qui ouvre Tempo (« Voir la trace »). Les logs payment extraient aussi `stripeOrderId=` vers le dashboard Stripe.

Échec du push Loki : le batch est **droppé** (pas de retry / backpressure).

Fichiers locaux (`logger/logs/combine.log`, rotation gateway) restent pour le debug hôte ; ils ne nourrissent plus Loki.

Convention stores (dashboards Data stores) : lignes `store_event store=…` / `store_fail store=…` via `store-log.ts`.

### 4.4 Traces

`initTracing(serviceName)` est appelé **avant** `NestFactory.create` dans chaque `main.ts` Nest, et depuis `instrumentation.ts` pour Next :

| Service | `service.name` OTEL | Hook |
| --- | --- | --- |
| gateway | `chariot-gateway` | `main.ts` |
| adventure | `chariot-adventure` | `main.ts` |
| payment | `chariot-payment` | `main.ts` |
| session | `chariot-session` | `main.ts` |
| media | `chariot-media` | `main.ts` |
| web | `chariot-web` | `instrumentation.ts` (`register`) |

Le SDK est chargé en `import()` dynamique. Désactivé si `OTEL_ENABLED !== true`. Export OTLP HTTP vers `{endpoint}/v1/traces` (défaut `http://127.0.0.1:4318`).

Instrumentations auto Node, **sauf** `fs`. Les URLs ops sont ignorées (`/metrics`, `/health`, `/ready`, `/api/metrics`, …) pour ne pas polluer Tempo.

Resource attributes : `service.name`, `service.version`, `deployment.environment` (`OTEL_ENVIRONMENT`).

La Gateway autorise les headers W3C `traceparent`, `tracestate`, `baggage` (CORS) pour propager le contexte depuis le navigateur / d’un service à l’autre.

Tempo génère des **span metrics** et un **service graph** qu’il remote-write vers Prometheus interne (`source=tempo`, `cluster=chariot`). C’est ce qui alimente les panneaux « Carte des services » / « Traces en erreur ». Les logs web (startup, `onRequestError`) partent vers Loki si `LOKI_ENABLED=true`.

## 5. Jobs Alloy et chemins scrape

Tous les scrapes : intervalle **15 s** (timeout APIs 10 s).

| Job | Chemin | Auth | Cibles (dev → noms de containers) |
| --- | --- | --- | --- |
| `chariot-apis` | `/metrics` | Basic | `chariot-gateway:8082`, `chariot-adventure:9000`, `chariot-payment:9003`, `chariot-session:9002`, `chariot-media:9005` |
| `chariot-web` | `/api/metrics` | — | `chariot-web:3000` |
| `keycloak` | `/auth/metrics` | — | `keycloak:9000` |
| `chariot-ready` | probe HTTP 200 | — | `/ready` APIs, `/api/ready` web, `/auth/health/ready` Keycloak |
| `mongodb` | exporter | URI | Mongo Adventure |
| `redis` | exporter | `host:port` | Redis Session |
| `postgres` | exporter | DSN | Session + Payment |
| `chariot-node` | unix | — | CPU, RAM, load, uname (+ filesystem Linux/prod) |

Suffixes integ/prod des `container_name` : `-integ` / `-prod` (web devient `chariot-frontend-integ` / `chariot-frontend-prod`, Keycloak `keycloak-integ` / `keycloak-prod`). Ils sont **codés en dur** dans les compose Alloy, pas dans `config.alloy`.

## 6. Métriques exposées par service

Labels communs Nest (sauf gateway) : `app=chariot`, `service=<nom>`, préfixe `chariot_` sur les default metrics Node (`heap`, `eventloop`, …).

Gateway : **pas** de préfixe `chariot_` sur les default metrics (`nodejs_*`) ni sur le HTTP (`http_requests_total`, label `status` et non `status_code`). Les alertes Monitoring gèrent les deux formes.

### Gateway

- `http_requests_total{method,route,status}`
- `http_request_duration_seconds{method,route}`
- `gateway_proxy_errors_total{backend,error_type}`
- `gateway_rate_limit_exceeded_total{route}`

### Adventure

- `chariot_http_requests_total{method,route,status_code}`
- `chariot_http_request_duration_seconds{method,route}`

### Payment

- `chariot_payment_http_requests_total` / `_duration_seconds`
- `chariot_payment_checkouts_total{flow,status}` — `flow` ∈ payment_intent, embedded, checkout, free_order
- `chariot_stripe_webhooks_total{status,event_type}`
- `chariot_stripe_payments_total{status}`
- `chariot_payment_token_credits_total{status}`
- `chariot_payment_stripe_operation_duration_seconds{operation}`

Alerte Monitoring `PaymentWebhookSilence` : checkouts payants sans webhook `checkout.session.completed` / `payment_intent.succeeded`.

### Session

- `chariot_session_http_requests_total` / `_duration_seconds`
- `chariot_session_open{status=activated|launched}` — jauge refresh 30 s
- `chariot_session_participants{status=gameMaster|connected|disconnected}`
- `chariot_session_active_ws_connections`
- `chariot_session_lifecycle_total{action}` — created, rejoined, joined, left, launched, closed, expired
- `chariot_session_ws_connections_total{event=connect|disconnect|reject}`

### Media

- `chariot_media_http_requests_total` / `_duration_seconds`
- `chariot_media_uploads_total{type,status}`
- `chariot_media_presigned_urls_total{status}`
- `chariot_media_minio_operation_duration_seconds{operation}`
- `chariot_media_image_process_duration_seconds`
- `chariot_media_upstream_duration_seconds{dependency,operation}`
- `chariot_media_stored_bytes{domain,variant}`
- `chariot_media_upload_bytes{domain,stage}`

### Web

Heartbeat scrape uniquement. Observabilité réelle = logs Loki (+ traces quand `initTracing` sera branché dans `instrumentation.ts`).

## 7. Configuration

### 7.1 Variables par microservice Nest / Next

Présentes dans chaque `.env.example` et injectées par `compose.{dev,integ,prod}.yml`.

| Variable | Défaut exemple | Rôle |
| --- | --- | --- |
| `METRICS_BASIC_AUTH_USER` | `prometheus` | Basic auth `/metrics` (APIs Nest uniquement) |
| `METRICS_BASIC_AUTH_PASSWORD` | secret fort | **Doit** matcher Alloy |
| `OTEL_ENABLED` | `false` | Active le SDK traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://10.8.0.1:4318` | Base Tempo OTLP HTTP (sans `/v1/traces`) |
| `OTEL_ENVIRONMENT` | `local` / `integ` / `prod` | Label logs + resource traces |
| `LOKI_ENABLED` | `false` | Active le transport Loki |
| `LOKI_URL` | `http://10.8.0.1:3100` | Base Loki (sans `/loki/api/v1/push`) |
| `LOKI_LOG_LEVEL` | `info` | Seuil du transport Loki |

Web n’a **pas** de `METRICS_BASIC_AUTH_*` (`/api/metrics` est public sur le réseau Docker interne).

### 7.2 Variables Alloy — `services/monitoring/.env`

| Variable | Rôle |
| --- | --- |
| `ALLOY_REMOTE_WRITE_URL` | URL complète d’écriture Prometheus, ex. `http://host.docker.internal:9090/api/v1/write` ou `http://10.8.0.1:9090/api/v1/write` |
| `ALLOY_REMOTE_WRITE_USER` | Identique à `PROMETHEUS_AUTH_USER` (Monitoring), défaut `alloy` |
| `ALLOY_REMOTE_WRITE_PASSWORD` | Identique à `PROMETHEUS_AUTH_PASSWORD` |
| `METRICS_BASIC_AUTH_USER` / `_PASSWORD` | Identiques aux APIs Nest |
| `MONGODB_EXPORTER_URI` | URI Mongo avec auth |
| `REDIS_ADDR` | `host:port` (**pas** `redis://`) |
| `POSTGRES_EXPORTER_DSN` | DSN Postgres Session |
| `POSTGRES_PAYMENT_EXPORTER_DSN` | DSN Postgres Payment |

Les adresses de scrape API sont dans le compose Alloy, pas dans `.env`.

### 7.3 Alignement des secrets (obligatoire)

```
Chariot APIs     METRICS_BASIC_AUTH_*     ==  Alloy METRICS_BASIC_AUTH_*
Alloy            ALLOY_REMOTE_WRITE_*     ==  Monitoring PROMETHEUS_AUTH_*
```

Si le password métriques diverge, Alloy voit `up=0` et l’alerte `ApiDown` part. Si le password remote write diverge, Alloy loggue des 401 et Grafana n’a aucune série Chariot.

### 7.4 Réseau Docker

Les compose microservices déclarent le réseau **external**. Il doit exister **avant** `make up` :

```bash
# Dev
docker network create chariot-group-network

# Integ / prod (sur le VPS correspondant)
docker network create chariot-group-network-integ
docker network create chariot-group-network-prod
```

Le makefile crée `traefik-public` (ingress), **pas** `chariot-group-network`.

## 8. Démarrage — développement local

Prérequis : Docker Desktop (mémoire ≥ 10 GiB, cf. README), Node 22. Les deux repos sont des voisins (`Chariot/` et `monitoring/`).

### 8.1 Stack Monitoring

```bash
cd ../monitoring
cp .env.example .env   # GF_SECURITY_ADMIN_*, PROMETHEUS_AUTH_PASSWORD, ports
docker compose up -d
```

Grafana : <http://localhost:3005> (user/password `.env`).  
Remote write : <http://localhost:9090/api/v1/write> (basic auth).  
Loki : <http://localhost:3100>. Tempo OTLP HTTP : <http://localhost:4318>.

`PROMETHEUS_BIND=0.0.0.0` est correct en local (Alloy joint `host.docker.internal`).

### 8.2 Activer les signaux dans Chariot

Dans **chaque** `services/<svc>/.env` concerné (gateway, adventure, payment, session, media, web) :

```bash
METRICS_BASIC_AUTH_USER=prometheus
METRICS_BASIC_AUTH_PASSWORD=changeme_use_a_strong_secret   # = Alloy
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318
OTEL_ENVIRONMENT=local
LOKI_ENABLED=true
LOKI_URL=http://host.docker.internal:3100
LOKI_LOG_LEVEL=info
```

`10.8.0.1` des `.env.example` est l’IP WireGuard **prod**. En local, `host.docker.internal` (les compose ont déjà `extra_hosts`).

### 8.3 Alloy Chariot

```bash
cp services/monitoring/.env.example services/monitoring/.env
# ALLOY_REMOTE_WRITE_URL=http://host.docker.internal:9090/api/v1/write
# mêmes passwords que ci-dessus + DSN Mongo/Redis/Postgres de ton compose.dev

docker network create chariot-group-network   # si besoin
make up SERVICE=monitoring ENV=dev
# équivalent :
# cd services/monitoring && docker compose -f compose.dev.yml --env-file .env up -d
```

UI Alloy (debug scrape) : <http://127.0.0.1:12345>.

Les autres services : `make up ENV=dev` (ou par `SERVICE=`). Alloy doit démarrer **après** (ou avec) le réseau et les backends, sinon les premiers scrapes sont `up=0` jusqu’au retry.

### 8.4 Vérifications locales

```bash
# Scrape API (dev sans auth si METRICS_* vides)
curl -s http://localhost:8082/metrics | head
curl -s -u prometheus:changeme_use_a_strong_secret http://localhost:9000/metrics | head

# Ready
curl -s http://localhost:8082/ready
curl -s http://localhost:3000/api/ready

# Push Loki (doit répondre 204)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ready

# Grafana Explore → Loki : {app="chariot"}
# Grafana Explore → Tempo : Search service.name=chariot-gateway
# Grafana dashboard "Application Overview", env=prod (en local prod=integ=même stack)
```

### 8.5 Spécificités macOS / Docker Desktop

- `compose.dev.yml` Alloy **ne monte pas** `/` : ça traversait le disque et relançait les watchers Next/Vite. Collectors unix : `cpu,meminfo,loadavg,uname` (pas `filesystem`).
- `pid: host` est présent mais le filesystem host Linux n’est pas celui du Mac : les métriques disque Alloy en dev Mac sont celles de la VM Docker, pas de macOS.
- Ne pas forcer `platform: linux/amd64` sur les services ARM (sauf exceptions déjà dans le repo).

## 9. Integ et production

### 9.1 Topologie

Deux déploiements Chariot (integ / prod), chacun avec **son** Alloy et **son** réseau Docker. Un Grafana Monitoring (souvent sur le VPS prod) avec datasources `*_PROD_URL` / `*_INTEG_URL`.

```
[VPS Chariot prod] Alloy-prod  ──WG──►  [VPS Monitoring] Caddy:9090 → Prometheus
[VPS Chariot integ] Alloy-integ ──WG──►  Prometheus integ  (ou même Grafana, autre URL)
                 APIs ──WG──► Loki / Tempo
```

### 9.2 Variables typiques prod (VPS Chariot)

Services applicatifs :

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://10.8.0.1:4318
OTEL_ENVIRONMENT=prod
LOKI_ENABLED=true
LOKI_URL=http://10.8.0.1:3100
METRICS_BASIC_AUTH_USER=prometheus
METRICS_BASIC_AUTH_PASSWORD=<secret fort, identique Alloy>
```

`services/monitoring/.env` :

```bash
ALLOY_REMOTE_WRITE_URL=http://10.8.0.1:9090/api/v1/write
ALLOY_REMOTE_WRITE_USER=alloy
ALLOY_REMOTE_WRITE_PASSWORD=< = PROMETHEUS_AUTH_PASSWORD Monitoring >
METRICS_BASIC_AUTH_PASSWORD=< = APIs >
MONGODB_EXPORTER_URI=mongodb://user:pass@chariot-mongodb-prod:27017/?authSource=admin
REDIS_ADDR=chariot-session-redis-prod:6379
POSTGRES_EXPORTER_DSN=postgresql://user:pass@chariot-session-postgres-prod:5432/chariot_session?sslmode=disable
POSTGRES_PAYMENT_EXPORTER_DSN=postgresql://user:pass@chariot-payment-postgres-prod:5432/chariot_payment?sslmode=disable
```

Integ : mêmes clés, `OTEL_ENVIRONMENT=integ`, hostnames `*-integ`, réseau `chariot-group-network-integ`, URL remote write / Loki / Tempo de **l’instance Monitoring integ** (ou les `*_INTEG_URL` Grafana).

### 9.3 Démarrage Alloy integ/prod

```bash
make up SERVICE=monitoring ENV=integ   # ou ENV=prod
```

Aucun port scrape n’est publié. Alloy écoute `0.0.0.0:12345` **dans** le réseau Docker seulement (pas de `ports:`). Collectors unix incluent `filesystem` ; volume `/:/host:ro`.

Côté Monitoring prod : `PROMETHEUS_BIND=10.8.0.1` (IP WireGuard), Loki/Tempo/OTLP joignables sur ce tunnel. Ne pas exposer `:9090` / `:3100` / `:4318` sur l’Internet public.

### 9.4 Surface d’attaque volontairement réduite

- Pas de scrape Prometheus distant vers les APIs.
- `/metrics` Nest derrière basic auth (obligatoire en integ/prod).
- Remote write Prometheus derrière basic auth, verbe write uniquement.
- Loki Monitoring a `auth_enabled: false` **aujourd’hui** : la protection repose sur WireGuard / bind. À garder en tête si le port 3100 devient joignable hors tunnel.

## 10. Grafana (Monitoring) — ce que Chariot alimente

Dashboards provisionnés (`../monitoring/services/grafana/dashboards/`) :

| Dashboard | UID / fichier | Signaux Chariot |
| --- | --- | --- |
| Application Overview | `application-overview.json` | `up` APIs + Keycloak, ready, host Chariot vs Monitoring, trafic gateway, traces, logs warn/error |
| Gateway | `gateway.json` | HTTP, proxy errors, logs, traces |
| Adventure | `adventure.json` | HTTP, logs, traces |
| Session | `session.json` | HTTP, jauges live, WS, lifecycle |
| Payment | `payment.json` | HTTP, checkout / webhooks / crédits, latence Stripe |
| Media | `media.json` | HTTP, uploads, MinIO, Sharp, upstream |
| Web | `web.json` | Ready, logs SSR |
| Data stores | `data-stores.json` | Mongo / Postgres / Redis exporters + `store_fail` + MinIO via media |

Sélecteur **Environnement** `prod` | `integ` : switch des UIDs datasource (`prometheus-$env`, `loki-$env`, `tempo-$env`).

Corrélation :

- Loki → Tempo via `trace_id` dans la ligne JSON
- Tempo → Loki : `{service=~"gateway|adventure|…"} |= "<traceId>"`
- Tempo → Prometheus (span metrics)
- Prometheus exemplars → Tempo

## 11. Alertes (définies dans Monitoring, déclenchées par Chariot)

Fichiers : `../monitoring/services/prometheus/alerts/*.yml`.

| Fichier | Exemples | Dépend de |
| --- | --- | --- |
| `backend.yml` | `ApiDown`, `KeycloakDown`, `KeycloakNotReady`, `ApiHigh5xx`, p95, heap, event loop | jobs `chariot-apis`, `keycloak`, `chariot-ready` |
| `payment.yml` | `PaymentWebhookSilence` | `chariot_payment_checkouts_total`, `chariot_stripe_webhooks_total` |
| `mongodb.yml` | `MongoDBDown`, connexions, latence, cache, scans | exporter Alloy Mongo |
| `postgres.yml` | `PostgresDown`, connexions, deadlocks | exporters Alloy PG |
| `redis.yml` | `RedisDown`, evictions, trop de clients | exporter Alloy Redis |
| `infrastructure.yml` | CPU / RAM / disque / `NodeDown` | `chariot-node` **et** node-exporter Monitoring |

Changer un nom de métrique ou un label `service` / `job` côté Chariot **casse** ces règles. Les alertes HTTP distinguent déjà gateway (`http_requests_total`) vs adventure (`chariot_http_*`) vs payment/session/media (`chariot_<svc>_http_*`).

## 12. Fichiers de référence (Chariot)

```
services/monitoring/config.alloy
services/monitoring/blackbox.yml
services/monitoring/compose.{dev,integ,prod}.yml
services/monitoring/.env.example

services/<api>/api/src/observability/tracing.ts
services/<api>/api/src/observability/loki.transport.ts
services/<api>/api/src/observability/metrics-auth.middleware.ts
services/<api>/api/src/metrics/
services/<api>/api/src/logger/winston.logger.ts
services/<api>/api/src/main.ts          # initTracing + middleware /metrics

services/web/client/src/observability/loki.transport.ts
services/web/client/src/observability/tracing.ts   # non branché
services/web/client/src/instrumentation.ts
services/web/client/src/app/api/metrics/route.ts
services/web/client/src/app/api/ready/route.ts
```

Côté Monitoring : `compose.yml`, `services/prometheus.yml.template`, `scripts/prometheus-proxy-entrypoint.sh`, `services/grafana/provisioning/datasources/datasources.yml`.

## 13. Dépannage

| Symptôme | Pistes |
| --- | --- |
| Grafana vide (pas de `up` Chariot) | Alloy down ; mauvais `ALLOY_REMOTE_WRITE_*` ; Monitoring proxy down ; réseau `chariot-group-network*` absent |
| `ApiDown` / `up=0` | Container API down ; basic auth désaligné ; Alloy pas sur le même réseau Docker ; mauvais `container_name` (dev vs `-prod`) |
| `503 Metrics authentication is not configured` | `METRICS_BASIC_AUTH_*` vides en integ/prod |
| Logs absents dans Loki | `LOKI_ENABLED` pas `true` ; `LOKI_URL` injoignable depuis le container (utiliser `host.docker.internal` ou IP WG, pas `localhost`) |
| Traces absentes | `OTEL_ENABLED` pas `true` ; endpoint sans schéma `http://` ; OTEL packages manquants dans l’image |
| Alloy CPU / watchers Next en boucle (Mac) | Ne pas monter `/` dans `compose.dev.yml` (déjà évité) |
| Remote write 403 | Requête hors `/api/v1/write` (UI Prometheus volontairement fermée) |
| Remote write 401 | Password Alloy ≠ `PROMETHEUS_AUTH_PASSWORD` |
| Disque host Chariot manquant en Grafana (dev Mac) | Collectors `filesystem` absents en dev ; normal |
| `probe_success=0` web | `GET /api/ready` 503 si une `NEXT_PUBLIC_*` manque |

Logs Alloy :

```bash
make logs SERVICE=monitoring ENV=dev
```

## 14. Notes de contrat

1. **`docs/technical/LOG_FLOW_DIAGRAM.md`** décrit l’ancien pipeline Promtail → fichiers Winston. Il est **obsolète** pour Loki (conservé comme archive). Le flux réel est le transport HTTP de §4.3.
2. **Noms HTTP hétérogènes** (gateway vs `chariot_*` vs `chariot_<svc>_*`) : voulu, déjà géré dans alertes et dashboards Monitoring. Ne pas les uniformiser sans mettre à jour ce dépôt en même temps.
3. README / runbooks / WireGuard **côté Monitoring** peuvent être absents du clone ; ce document décrit le contrat tel qu’implémenté dans les compose et configs actuels.

## 15. Commandes rapides

```bash
# Réseau + Alloy
docker network create chariot-group-network
make up SERVICE=monitoring ENV=dev

# Stack complète Chariot (dev)
make up ENV=dev

# Prod
make up SERVICE=monitoring ENV=prod
```
