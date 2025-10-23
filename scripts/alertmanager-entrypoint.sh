#!/bin/sh
set -e

# Entrypoint script for AlertManager
# Substitutes environment variables into alertmanager.yml from template

# Verify template file exists
if [ ! -f "/etc/alertmanager/alertmanager.yml.template" ]; then
    echo "Error: alertmanager.yml.template not found at /etc/alertmanager/alertmanager.yml.template"
    exit 1
fi

# Set default values for all variables used in template
ALERTMANAGER_SMTP_FROM="${ALERTMANAGER_SMTP_FROM:-alerts@example.com}"
ALERTMANAGER_SMTP_HOST="${ALERTMANAGER_SMTP_HOST:-smtp.example.com}"
ALERTMANAGER_SMTP_PORT="${ALERTMANAGER_SMTP_PORT:-587}"
ALERTMANAGER_SMTP_USER="${ALERTMANAGER_SMTP_USER:-user@example.com}"
ALERTMANAGER_SMTP_PASSWORD="${ALERTMANAGER_SMTP_PASSWORD:-password}"
ALERTMANAGER_SMTP_REQUIRE_TLS="${ALERTMANAGER_SMTP_REQUIRE_TLS:-true}"
ALERTMANAGER_RECEIVER_EMAIL="${ALERTMANAGER_RECEIVER_EMAIL:-contact@example.com}"
ALERTMANAGER_TIMEOUT="${ALERTMANAGER_TIMEOUT:-10s}"
ALERTMANAGER_GROUP_WAIT="${ALERTMANAGER_GROUP_WAIT:-30s}"
ALERTMANAGER_GROUP_INTERVAL="${ALERTMANAGER_GROUP_INTERVAL:-5m}"
ALERTMANAGER_REPEAT_INTERVAL="${ALERTMANAGER_REPEAT_INTERVAL:-3h}"
ALERTMANAGER_CRITICAL_GROUP_WAIT="${ALERTMANAGER_CRITICAL_GROUP_WAIT:-10s}"
ALERTMANAGER_CRITICAL_REPEAT_INTERVAL="${ALERTMANAGER_CRITICAL_REPEAT_INTERVAL:-30m}"
ALERTMANAGER_RESOLVE_TIMEOUT="${ALERTMANAGER_RESOLVE_TIMEOUT:-5m}"

# Use sed for variable substitution (no dependency on envsubst in Alpine)
sed \
  -e "s|\${ALERTMANAGER_SMTP_FROM}|$ALERTMANAGER_SMTP_FROM|g" \
  -e "s|\${ALERTMANAGER_SMTP_HOST}|$ALERTMANAGER_SMTP_HOST|g" \
  -e "s|\${ALERTMANAGER_SMTP_PORT}|$ALERTMANAGER_SMTP_PORT|g" \
  -e "s|\${ALERTMANAGER_SMTP_USER}|$ALERTMANAGER_SMTP_USER|g" \
  -e "s|\${ALERTMANAGER_SMTP_PASSWORD}|$ALERTMANAGER_SMTP_PASSWORD|g" \
  -e "s|\${ALERTMANAGER_SMTP_REQUIRE_TLS}|$ALERTMANAGER_SMTP_REQUIRE_TLS|g" \
  -e "s|\${ALERTMANAGER_RECEIVER_EMAIL}|$ALERTMANAGER_RECEIVER_EMAIL|g" \
  -e "s|\${ALERTMANAGER_TIMEOUT}|$ALERTMANAGER_TIMEOUT|g" \
  -e "s|\${ALERTMANAGER_GROUP_WAIT}|$ALERTMANAGER_GROUP_WAIT|g" \
  -e "s|\${ALERTMANAGER_GROUP_INTERVAL}|$ALERTMANAGER_GROUP_INTERVAL|g" \
  -e "s|\${ALERTMANAGER_REPEAT_INTERVAL}|$ALERTMANAGER_REPEAT_INTERVAL|g" \
  -e "s|\${ALERTMANAGER_CRITICAL_GROUP_WAIT}|$ALERTMANAGER_CRITICAL_GROUP_WAIT|g" \
  -e "s|\${ALERTMANAGER_CRITICAL_REPEAT_INTERVAL}|$ALERTMANAGER_CRITICAL_REPEAT_INTERVAL|g" \
  -e "s|\${ALERTMANAGER_RESOLVE_TIMEOUT}|$ALERTMANAGER_RESOLVE_TIMEOUT|g" \
  /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml

echo "✓ AlertManager configuration generated from template"

# Change to config directory (relative paths require this)
cd /etc/alertmanager

# Execute AlertManager with the provided arguments
exec /bin/alertmanager "$@"
