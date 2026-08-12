# Observabilité Chariot

Stack de monitoring : repo séparé `Chariot-Group/Monitoring` (Prometheus, Grafana, Loki, Tempo, Alertmanager, Blackbox).

## Flux

| Signal | Mécanisme |
|--------|-----------|
| Métriques | Prometheus scrape `/metrics` via WireGuard + basic auth |
| Logs | Winston → push HTTP Loki (`LOKI_ENABLED=true`) |
| Traces | OpenTelemetry SDK → Tempo OTLP (`OTEL_ENABLED=true`) |
| Infra DB/host | Exporters dans `services/monitoring/` (pull) |

## Variables (par service Nest)

Voir `.env.example` de chaque service :

- `METRICS_BASIC_AUTH_USER` / `METRICS_BASIC_AUTH_PASSWORD`
- `OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT` (ex. `http://10.8.0.1:4318`)
- `OTEL_ENVIRONMENT` (`local` / `integ` / `prod`)
- `LOKI_ENABLED`, `LOKI_URL` (ex. `http://10.8.0.1:3100`)

## Exporters

```bash
make up SERVICE=monitoring ENV=integ
# ou
cd services/monitoring && docker compose -f compose.integ.yml --env-file .env up -d
```

Firewall : ports 9100, 9216, 9121, 9187 et ports API metrics (8082, 9000, 9002, 9003, 9005) **uniquement** depuis l’IP WireGuard Monitoring.

Si **integ et prod cohabitent sur le même VPS**, ne pas publier les mêmes ports host deux fois : séparer les hosts WireGuard, utiliser des ports distincts, ou n’exposer qu’un environnement à la fois et adapter les targets Prometheus.

## Docs Monitoring

- Architecture / démarrage : repo Monitoring `README.md`
- WireGuard : `Monitoring/docs/wireguard.md`
- Runbooks : `Monitoring/docs/runbooks.md`
