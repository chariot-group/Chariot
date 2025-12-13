# Configuration SSO/Keycloak

## Variables d'environnement

Toutes les informations sensibles ont été déplacées vers des variables d'environnement. Copiez le fichier `.env.example` vers `.env` à la racine du projet et configurez les valeurs suivantes :

### Base de données Keycloak
```env
KEYCLOAK_DB_NAME=keycloak
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=votre_mot_de_passe_securise
KEYCLOAK_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak
```

### Configuration Admin Keycloak
```env
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=votre_mot_de_passe_admin
KEYCLOAK_HOSTNAME=localhost
KEYCLOAK_PORT=8080
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=chariot
KEYCLOAK_CLIENT_ID=chariot-app
```

### Configuration SMTP
```env
KEYCLOAK_SMTP_HOST=smtp.votreserveur.com
KEYCLOAK_SMTP_PORT=587
KEYCLOAK_SMTP_FROM=contact@votredomaine.com
KEYCLOAK_SMTP_FROM_DISPLAY_NAME=Chariot SSO
KEYCLOAK_SMTP_REPLY_TO=contact@votredomaine.com
KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME=Chariot Support
KEYCLOAK_SMTP_USER=contact@votredomaine.com
KEYCLOAK_SMTP_PASSWORD=votre_mot_de_passe_smtp
KEYCLOAK_SMTP_STARTTLS=true
KEYCLOAK_SMTP_SSL=false
```

### Utilisateur par défaut
```env
KEYCLOAK_DEFAULT_ADMIN_EMAIL=admin@chariot.tools
KEYCLOAK_DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe_utilisateur
KEYCLOAK_DEFAULT_ADMIN_FIRSTNAME=Admin
KEYCLOAK_DEFAULT_ADMIN_LASTNAME=Chariot
```

## Fichier realm-export.json

Le fichier `realm-export.json` utilise maintenant des placeholders pour les informations sensibles :
- `${env.VARIABLE_NAME}` pour les variables d'environnement

Les placeholders sont automatiquement remplacés par les valeurs des variables d'environnement au démarrage du container.

## Résolution du problème HTTPS

Le problème "HTTPS required" a été résolu en ajoutant les configurations suivantes dans `compose.yml` :

```yaml
KC_HOSTNAME_STRICT_HTTPS: false
KC_HTTP_ENABLED: true
KC_HEALTH_ENABLED: true
KC_PROXY: edge
```

Cela permet d'utiliser Keycloak en HTTP pour le développement local.

## Démarrage

1. Créez votre fichier `.env` à la racine du projet avec les bonnes valeurs
2. Démarrez les services :
```bash
cd services/sso
docker compose --env-file ../../.env up -d
```

## Accès

- Console Admin Keycloak : http://localhost:8080
- Realm Chariot : http://localhost:8080/realms/chariot

## Sécurité

⚠️ **Important** : 
- Ne commitez JAMAIS le fichier `.env`
- Le fichier `realm-export.json` ne contient plus d'informations sensibles
- Utilisez des mots de passe forts en production
- En production, utilisez HTTPS avec `KC_HOSTNAME_STRICT_HTTPS: true`
