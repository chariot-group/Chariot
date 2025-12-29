#!/bin/sh
set -e

sed -i "s|__NEXT_PUBLIC_API_URL__|${NEXT_PUBLIC_API_URL}|g" /app/public/env-config.js
sed -i "s|__NEXT_PUBLIC_KEYCLOAK_URL__|${NEXT_PUBLIC_KEYCLOAK_URL}|g" /app/public/env-config.js
sed -i "s|__NEXT_PUBLIC_KEYCLOAK_REALM__|${NEXT_PUBLIC_KEYCLOAK_REALM}|g" /app/public/env-config.js
sed -i "s|__NEXT_PUBLIC_KEYCLOAK_CLIENT_ID__|${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}|g" /app/public/env-config.js

echo "Runtime configuration applied:"
cat /public/env-config.js

exec "$@"