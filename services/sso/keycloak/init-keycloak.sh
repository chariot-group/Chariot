#!/bin/bash
set -e

echo "🔄 Attente du démarrage de Keycloak..."
sleep 10

# Attendre que Keycloak soit prêt
until curl -sf http://localhost:8080/health/ready > /dev/null; do
    echo "⏳ Keycloak n'est pas encore prêt, attente..."
    sleep 5
done

echo "✅ Keycloak est prêt, configuration SSL..."

# Obtenir un token admin
echo "🔑 Obtention du token admin..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r .access_token)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Échec de l'authentification admin"
    echo "Réponse: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token admin obtenu"

# Récupérer la configuration actuelle du realm master
echo "📥 Récupération de la configuration du realm master..."
MASTER_REALM=$(curl -s -X GET http://localhost:8080/admin/realms/master \
  -H "Authorization: Bearer $TOKEN")

# Mettre à jour sslRequired à "none"
echo "🔧 Désactivation de SSL sur le realm master..."
UPDATED_REALM=$(echo "$MASTER_REALM" | jq '.sslRequired = "none"')

# Envoyer la mise à jour
curl -s -X PUT http://localhost:8080/admin/realms/master \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_REALM"

echo ""
echo "✅ SSL désactivé sur le realm master"

# Vérifier la configuration
MASTER_SSL=$(curl -s -X GET http://localhost:8080/admin/realms/master \
  -H "Authorization: Bearer $TOKEN" | jq -r .sslRequired)

CHARIOT_SSL=$(curl -s -X GET http://localhost:8080/admin/realms/chariot \
  -H "Authorization: Bearer $TOKEN" | jq -r .sslRequired)

echo ""
echo "📊 Configuration SSL des realms:"
echo "  - Master realm: $MASTER_SSL"
echo "  - Chariot realm: $CHARIOT_SSL"
echo ""
echo "🎉 Configuration terminée !"
