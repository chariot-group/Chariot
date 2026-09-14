# Observabilité Chariot

Stack de monitoring : repo séparé `Chariot-Group/Monitoring` (Prometheus, Grafana, Loki, Tempo, Alertmanager).

## Flux

| Signal | Mécanisme |
|--------|-----------|
| Métriques | Alloy scrape en local, `remote_write` vers Prometheus (WireGuard en prod) |
| Logs | Winston → push HTTP Loki (`LOKI_ENABLED=true`) |
| Traces | OpenTelemetry SDK → Tempo OTLP (`OTEL_ENABLED=true`) |
| Infra DB/host | Collecteurs embarqués dans Alloy (`services/monitoring/`) |

Alloy est le **seul** point d’échange métriques avec le VPS Monitoring. Les APIs, Keycloak et les bases ne sont plus scrapées depuis l’extérieur.

## Variables (par service Nest)

Voir `.env.example` de chaque service :

- `METRICS_BASIC_AUTH_USER` / `METRICS_BASIC_AUTH_PASSWORD` (scrape interne Alloy)
- `OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT` (ex. `http://10.8.0.1:4318`)
- `OTEL_ENVIRONMENT` (`local` / `integ` / `prod`)
- `LOKI_ENABLED`, `LOKI_URL` (ex. `http://10.8.0.1:3100`)

## Alloy

```bash
make up SERVICE=monitoring ENV=integ
# ou
cd services/monitoring && docker compose -f compose.integ.yml --env-file .env up -d
```

En prod, `ALLOY_REMOTE_WRITE_URL` pointe vers le proxy Prometheus via WireGuard (ex. `http://10.8.0.1:9090/api/v1/write`), avec `ALLOY_REMOTE_WRITE_USER` / `ALLOY_REMOTE_WRITE_PASSWORD` (même secret que `PROMETHEUS_AUTH_*` côté Monitoring). Aucun port scrape (9100, 9216, `/metrics`) n’a besoin d’être publié hors du réseau Docker Chariot. Le `:9090` hôte n’accepte que `/api/v1/write` (basic auth).

## Docs Monitoring

- Architecture / démarrage : repo Monitoring `README.md`
- WireGuard : `Monitoring/docs/wireguard.md`
- Runbooks : `Monitoring/docs/runbooks.md`
