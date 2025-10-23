#!/bin/sh
set -e

# Script d'entrée pour Prometheus
# Charge les variables du .env et substitue les valeurs dans prometheus.yml

# Vérifier que le fichier template existe
if [ ! -f "/etc/prometheus/prometheus.yml.template" ]; then
    echo "Error: prometheus.yml.template not found"
    exit 1
fi

#!/bin/sh
set -e

# Script d'entrée pour Prometheus
# Substitue les valeurs dans prometheus.yml à partir des variables d'environnement

# Vérifier que le fichier template existe
if [ ! -f "/etc/prometheus/prometheus.yml.template" ]; then
    echo "Error: prometheus.yml.template not found"
    exit 1
fi

# Set default Prometheus environment variables
PROMETHEUS_ENVIRONMENT="${PROMETHEUS_ENVIRONMENT:-development}"
PROMETHEUS_MONITOR_NAME="${PROMETHEUS_MONITOR_NAME:-chariot-monitor}"
PROMETHEUS_RETENTION_TIME="${PROMETHEUS_RETENTION_TIME:-15d}"
PROMETHEUS_RETENTION_SIZE="${PROMETHEUS_RETENTION_SIZE:-0}"
PROMETHEUS_SCRAPE_INTERVAL="${PROMETHEUS_SCRAPE_INTERVAL:-15s}"
PROMETHEUS_EVALUATION_INTERVAL="${PROMETHEUS_EVALUATION_INTERVAL:-15s}"
PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL="${PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL:-10s}"
PROMETHEUS_MONGODB_SCRAPE_INTERVAL="${PROMETHEUS_MONGODB_SCRAPE_INTERVAL:-15s}"
PROMETHEUS_CADVISOR_SCRAPE_INTERVAL="${PROMETHEUS_CADVISOR_SCRAPE_INTERVAL:-15s}"
PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL="${PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL:-15s}"

PROMETHEUS_SELF_TARGET="${PROMETHEUS_SELF_TARGET:-localhost:9090}"
PROMETHEUS_BACKEND_TARGET="${PROMETHEUS_BACKEND_TARGET:-backend:9000}"
PROMETHEUS_BACKEND_METRICS_PATH="${PROMETHEUS_BACKEND_METRICS_PATH:-/metrics}"
PROMETHEUS_CADVISOR_TARGET="${PROMETHEUS_CADVISOR_TARGET:-cadvisor:8080}"
PROMETHEUS_NODE_EXPORTER_TARGET="${PROMETHEUS_NODE_EXPORTER_TARGET:-node-exporter:9100}"
PROMETHEUS_MONGODB_EXPORTER_TARGET="${PROMETHEUS_MONGODB_EXPORTER_TARGET:-mongodb-exporter:9216}"
PROMETHEUS_ALERTMANAGER_TARGET="${PROMETHEUS_ALERTMANAGER_TARGET:-alertmanager:9093}"

# Set default AlertManager environment variables (used in prometheus.yml template)
ALERTMANAGER_TIMEOUT="${ALERTMANAGER_TIMEOUT:-10s}"

# Use sed to substitute variables in the template
# This avoids dependency on envsubst which may not be available in Alpine-based images
sed \
  -e "s|\${PROMETHEUS_ENVIRONMENT}|$PROMETHEUS_ENVIRONMENT|g" \
  -e "s|\${PROMETHEUS_MONITOR_NAME}|$PROMETHEUS_MONITOR_NAME|g" \
  -e "s|\${PROMETHEUS_RETENTION_TIME}|$PROMETHEUS_RETENTION_TIME|g" \
  -e "s|\${PROMETHEUS_RETENTION_SIZE}|$PROMETHEUS_RETENTION_SIZE|g" \
  -e "s|\${PROMETHEUS_SCRAPE_INTERVAL}|$PROMETHEUS_SCRAPE_INTERVAL|g" \
  -e "s|\${PROMETHEUS_EVALUATION_INTERVAL}|$PROMETHEUS_EVALUATION_INTERVAL|g" \
  -e "s|\${PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL}|$PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL|g" \
  -e "s|\${PROMETHEUS_MONGODB_SCRAPE_INTERVAL}|$PROMETHEUS_MONGODB_SCRAPE_INTERVAL|g" \
  -e "s|\${PROMETHEUS_CADVISOR_SCRAPE_INTERVAL}|$PROMETHEUS_CADVISOR_SCRAPE_INTERVAL|g" \
  -e "s|\${PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL}|$PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL|g" \
  -e "s|\${PROMETHEUS_SELF_TARGET}|$PROMETHEUS_SELF_TARGET|g" \
  -e "s|\${PROMETHEUS_BACKEND_TARGET}|$PROMETHEUS_BACKEND_TARGET|g" \
  -e "s|\${PROMETHEUS_BACKEND_METRICS_PATH}|$PROMETHEUS_BACKEND_METRICS_PATH|g" \
  -e "s|\${PROMETHEUS_CADVISOR_TARGET}|$PROMETHEUS_CADVISOR_TARGET|g" \
  -e "s|\${PROMETHEUS_NODE_EXPORTER_TARGET}|$PROMETHEUS_NODE_EXPORTER_TARGET|g" \
  -e "s|\${PROMETHEUS_MONGODB_EXPORTER_TARGET}|$PROMETHEUS_MONGODB_EXPORTER_TARGET|g" \
  -e "s|\${PROMETHEUS_ALERTMANAGER_TARGET}|$PROMETHEUS_ALERTMANAGER_TARGET|g" \
  -e "s|\${ALERTMANAGER_TIMEOUT}|$ALERTMANAGER_TIMEOUT|g" \
  /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml

echo "✓ Prometheus configuration generated from template"

# Change to /etc/prometheus so relative paths in config work
cd /etc/prometheus

# Execute Prometheus with the provided arguments
exec /bin/prometheus "$@"
export PROMETHEUS_SELF_TARGET="${PROMETHEUS_SELF_TARGET:-localhost:9090}"
export PROMETHEUS_BACKEND_TARGET="${PROMETHEUS_BACKEND_TARGET:-backend:9000}"
export PROMETHEUS_BACKEND_METRICS_PATH="${PROMETHEUS_BACKEND_METRICS_PATH:-/metrics}"
export PROMETHEUS_CADVISOR_TARGET="${PROMETHEUS_CADVISOR_TARGET:-cadvisor:8080}"
export PROMETHEUS_NODE_EXPORTER_TARGET="${PROMETHEUS_NODE_EXPORTER_TARGET:-node-exporter:9100}"
export PROMETHEUS_MONGODB_EXPORTER_TARGET="${PROMETHEUS_MONGODB_EXPORTER_TARGET:-mongodb-exporter:9216}"
export PROMETHEUS_ALERTMANAGER_TARGET="${PROMETHEUS_ALERTMANAGER_TARGET:-alertmanager:9093}"

# Substituer les variables dans le template et écrire le fichier final
envsubst < /etc/prometheus/prometheus.yml.template > /etc/prometheus/prometheus.yml

echo "✓ Prometheus configuration generated from template"

# Exécuter Prometheus avec les arguments fournis
exec /bin/prometheus "$@"
