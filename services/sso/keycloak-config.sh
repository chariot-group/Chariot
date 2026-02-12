#!/bin/sh
set -e

# Script de configuration Keycloak pour Chariot
# Usage: ./keycloak-config.sh <env>
# env: dev, integ, prod

ENV="${1:-dev}"

case "$ENV" in
  dev)
    KEYCLOAK_HOST="keycloak"
    SMTP_SSL="false"
    SMTP_STARTTLS="false"
    DISABLE_SSL_MASTER="true"
    ;;
  integ)
    KEYCLOAK_HOST="keycloak-integ"
    SMTP_SSL="true"
    SMTP_STARTTLS="true"
    DISABLE_SSL_MASTER="false"
    ;;
  prod)
    KEYCLOAK_HOST="keycloak-prod"
    SMTP_SSL="true"
    SMTP_STARTTLS="true"
    DISABLE_SSL_MASTER="false"
    ;;
  *)
    echo "Error: Invalid environment. Use: dev, integ, or prod" >&2
    exit 1
    ;;
esac

echo "Starting Keycloak configuration for environment: $ENV"
echo "Keycloak host: $KEYCLOAK_HOST"

# Attendre que Keycloak soit vraiment disponible
RETRIES=30
COUNT=0
until /opt/keycloak/bin/kcadm.sh config credentials \
  --server "http://${KEYCLOAK_HOST}:8080" \
  --realm master \
  --user "${KEYCLOAK_ADMIN_USER}" \
  --password "${KEYCLOAK_ADMIN_PASSWORD}" 2>&1; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "Timeout waiting for Keycloak authentication" >&2
    exit 1
  fi
  echo "Keycloak not ready yet, retrying... ($COUNT/$RETRIES)"
  sleep 5
done

echo "Keycloak is ready, authenticated successfully!"

# Désactiver l'exigence SSL sur master realm (dev uniquement)
if [ "$DISABLE_SSL_MASTER" = "true" ]; then
  echo "Disabling SSL requirement on master realm..."
  /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE
fi

echo "Getting current realm configuration..."
/opt/keycloak/bin/kcadm.sh get realms/chariot > /tmp/realm.json

echo "Clearing existing SMTP configuration..."
/opt/keycloak/bin/kcadm.sh update realms/chariot -s 'smtpServer={}'

echo "Configuring SMTP for chariot realm..."
/opt/keycloak/bin/kcadm.sh update realms/chariot \
  -s smtpServer.host="${KEYCLOAK_SMTP_HOST}" \
  -s smtpServer.port="${KEYCLOAK_SMTP_PORT}" \
  -s smtpServer.from="${KEYCLOAK_SMTP_FROM}" \
  -s smtpServer.fromDisplayName="${KEYCLOAK_SMTP_FROM_DISPLAY_NAME}" \
  -s smtpServer.replyTo="${KEYCLOAK_SMTP_REPLY_TO}" \
  -s smtpServer.replyToDisplayName="${KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME}" \
  -s smtpServer.auth=true \
  -s smtpServer.user="${KEYCLOAK_SMTP_USER}" \
  -s smtpServer.password="${KEYCLOAK_SMTP_PASSWORD}" \
  -s smtpServer.starttls="$SMTP_STARTTLS" \
  -s smtpServer.ssl="$SMTP_SSL"

echo "SMTP configuration completed"

echo "Enabling user profile for chariot realm..."
/opt/keycloak/bin/kcadm.sh update realms/chariot \
  -s 'attributes.userProfileEnabled=true'

echo "Configuring user profile with custom avatar attribute..."
# Récupérer la configuration actuelle
/opt/keycloak/bin/kcadm.sh get realms/chariot/users/profile > /tmp/current-profile.json 2>/dev/null || echo "No existing profile"

# Créer la nouvelle configuration avec l'attribut avatar
cat > /tmp/user-profile-update.json <<'PROFILE_EOF'
{
  "attributes": [
    {
      "name": "username",
      "displayName": "${username}",
      "validations": {
        "length": { "min": 3, "max": 255 },
        "username-prohibited-characters": {},
        "up-username-not-idn-homograph": {}
      },
      "permissions": {
        "view": ["admin", "user"],
        "edit": ["admin", "user"]
      },
      "multivalued": false
    },
    {
      "name": "email",
      "displayName": "${email}",
      "validations": {
        "email": {},
        "length": { "max": 255 }
      },
      "required": {
        "roles": ["user"]
      },
      "permissions": {
        "view": ["admin", "user"],
        "edit": ["admin", "user"]
      },
      "multivalued": false
    },
    {
      "name": "firstName",
      "displayName": "${firstName}",
      "validations": {
        "length": { "max": 255 },
        "person-name-prohibited-characters": {}
      },
      "required": {
        "roles": ["user"]
      },
      "permissions": {
        "view": ["admin", "user"],
        "edit": ["admin", "user"]
      },
      "multivalued": false
    },
    {
      "name": "lastName",
      "displayName": "${lastName}",
      "validations": {
        "length": { "max": 255 },
        "person-name-prohibited-characters": {}
      },
      "required": {
        "roles": ["user"]
      },
      "permissions": {
        "view": ["admin", "user"],
        "edit": ["admin", "user"]
      },
      "multivalued": false
    },
    {
      "name": "avatar",
      "displayName": "${avatar}",
      "validations": {},
      "annotations": {},
      "permissions": {
        "view": ["admin", "user"],
        "edit": ["admin", "user"]
      },
      "multivalued": false
    }
  ],
  "groups": [
    {
      "name": "user-metadata",
      "displayHeader": "User metadata",
      "displayDescription": "Attributes, which refer to user metadata"
    }
  ]
}
PROFILE_EOF

echo "Updating user profile with avatar attribute..."
/opt/keycloak/bin/kcadm.sh update realms/chariot/users/profile -f /tmp/user-profile-update.json

echo "User profile configuration completed!"

echo "Configuring OpenID Connect client scope..."
# Vérifier si le client scope openid existe
if /opt/keycloak/bin/kcadm.sh get client-scopes -r chariot | grep -q '"name" : "openid"'; then
  echo "OpenID client scope already exists"
  OPENID_SCOPE_ID=$(/opt/keycloak/bin/kcadm.sh get client-scopes -r chariot | grep -B2 '"name" : "openid"' | grep '"id"' | cut -d'"' -f4)
else
  echo "Creating OpenID client scope..."
  /opt/keycloak/bin/kcadm.sh create client-scopes -r chariot \
    -s name=openid \
    -s protocol=openid-connect \
    -s 'attributes={"include.in.token.scope":"true","display.on.consent.screen":"true"}' \
    -s 'description=OpenID Connect built-in scope: openid'
  
  OPENID_SCOPE_ID=$(/opt/keycloak/bin/kcadm.sh get client-scopes -r chariot | grep -B2 '"name" : "openid"' | grep '"id"' | cut -d'"' -f4)
  echo "OpenID client scope created with ID: $OPENID_SCOPE_ID"
fi

echo "Configuring 'sub' mapper for OpenID scope..."
# Vérifier si le mapper sub existe déjà
if /opt/keycloak/bin/kcadm.sh get client-scopes/${OPENID_SCOPE_ID}/protocol-mappers/models -r chariot | grep -q '"name" : "sub"'; then
  echo "Sub mapper already exists in OpenID scope"
else
  echo "Creating sub mapper..."
  /opt/keycloak/bin/kcadm.sh create client-scopes/${OPENID_SCOPE_ID}/protocol-mappers/models -r chariot \
    -s name=sub \
    -s protocol=openid-connect \
    -s protocolMapper=oidc-sub-mapper \
    -s 'config={"claim.name":"sub","jsonType.label":"String","id.token.claim":"true","access.token.claim":"true","userinfo.token.claim":"true"}'
  echo "Sub mapper created successfully"
fi

echo "Assigning OpenID scope to chariot-app client..."
# Récupérer l'ID du client chariot-app
CLIENT_ID=$(/opt/keycloak/bin/kcadm.sh get clients -r chariot -q clientId=chariot-app | grep '"id"' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  echo "Warning: chariot-app client not found"
else
  echo "Found chariot-app client with ID: $CLIENT_ID"
  
  # Vérifier si openid est déjà dans les default scopes
  if /opt/keycloak/bin/kcadm.sh get clients/${CLIENT_ID}/default-client-scopes -r chariot | grep -q '"name" : "openid"'; then
    echo "OpenID scope already assigned to chariot-app as default"
  else
    echo "Assigning OpenID scope as default..."
    /opt/keycloak/bin/kcadm.sh update clients/${CLIENT_ID}/default-client-scopes/${OPENID_SCOPE_ID} -r chariot
    echo "OpenID scope assigned successfully"
  fi
fi

echo "OpenID Connect configuration completed!"

echo "Creating default admin user if needed..."
if /opt/keycloak/bin/kcadm.sh get users -r chariot -q email="${KEYCLOAK_ADMIN_EMAIL}" | grep -q '"id"'; then
  echo "Admin user already exists"
else
  echo "Creating admin user..."
  /opt/keycloak/bin/kcadm.sh create users -r chariot \
    -s username="${KEYCLOAK_ADMIN_USER}" \
    -s email="${KEYCLOAK_ADMIN_EMAIL}" \
    -s firstName="${KEYCLOAK_ADMIN_FIRSTNAME}" \
    -s lastName="${KEYCLOAK_ADMIN_LASTNAME}" \
    -s enabled=true \
    -s emailVerified=true
  
  USER_ID=$(/opt/keycloak/bin/kcadm.sh get users -r chariot -q email="${KEYCLOAK_ADMIN_EMAIL}" | grep -o '"id" : "[^"]*"' | cut -d'"' -f4)
  /opt/keycloak/bin/kcadm.sh update users/${USER_ID}/reset-password -r chariot -s type=password -s value="${KEYCLOAK_ADMIN_PASSWORD}" -s temporary=false -n
  echo "Admin user created successfully"
fi

echo "Configuration completed successfully for environment: $ENV"
