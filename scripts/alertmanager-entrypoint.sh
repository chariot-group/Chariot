#!/bin/sh
set -e

# Entrypoint script for AlertManager
# Substitutes environment variables into alertmanager.yml from template

# Verify template file exists
if [ ! -f "/etc/alertmanager/alertmanager.yml.template" ]; then
    echo "Error: alertmanager.yml.template not found at /etc/alertmanager/alertmanager.yml.template"
    exit 1
fi

# Verify all required environment variables are set
required_vars="ALERTMANAGER_SMTP_FROM SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_SECURE RECEIVER_EMAIL ALERTMANAGER_TIMEOUT ALERTMANAGER_GROUP_WAIT ALERTMANAGER_GROUP_INTERVAL ALERTMANAGER_REPEAT_INTERVAL ALERTMANAGER_CRITICAL_GROUP_WAIT ALERTMANAGER_CRITICAL_REPEAT_INTERVAL ALERTMANAGER_RESOLVE_TIMEOUT"

for var in $required_vars; do
    eval value=\$$var
    if [ -z "$value" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Use sed for variable substitution (no dependency on envsubst in Alpine)
sed \
  -e "s|\${ALERTMANAGER_SMTP_FROM}|$ALERTMANAGER_SMTP_FROM|g" \
  -e "s|\${SMTP_HOST}|$SMTP_HOST|g" \
  -e "s|\${SMTP_PORT}|$SMTP_PORT|g" \
  -e "s|\${SMTP_USER}|$SMTP_USER|g" \
  -e "s|\${SMTP_PASSWORD}|$SMTP_PASSWORD|g" \
  -e "s|\${SMTP_SECURE}|$SMTP_SECURE|g" \
  -e "s|\${RECEIVER_EMAIL}|$RECEIVER_EMAIL|g" \
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
