#!/bin/bash

# Script to replace environment variables in realm-export.json
# This creates a processed version with actual values from environment variables

set -e

TEMPLATE_FILE="/opt/keycloak/data/import/realm-export.json"
OUTPUT_FILE="/tmp/realm-import-processed.json"

echo "Processing realm configuration with environment variables..."

# Read the template and replace environment variable placeholders
envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Realm configuration processed successfully"
echo "Output file: $OUTPUT_FILE"

# Copy processed file back to import directory
cp "$OUTPUT_FILE" "$TEMPLATE_FILE"

echo "Ready for import"
