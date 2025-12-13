# SSO Microservice

Service d'authentification unique (Single Sign-On) pour Chariot utilisant Keycloak.

## 🏗️ Architecture

Le service SSO est composé de trois composants principaux :

### 1. Keycloak (Port 8180)
- Serveur d'authentification et d'autorisation
- Gestion des utilisateurs et des rôles
- Support OpenID Connect et OAuth2
- Realm : `chariot`

### 2. PostgreSQL
- Base de données dédiée pour Keycloak
- Stockage des utilisateurs, sessions, et configurations

### 3. Frontend Vue.js (Port 5173)
- Interface utilisateur personnalisée
- Pages : Login, Signup, Forgot Password
- Support multi-langue : Français, Anglais, Espagnol

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour développement local)

### Lancement avec Docker

```bash
# À la racine du service sso
cd services/sso

# Démarrer tous les services
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

Les services seront disponibles sur :
- Frontend : http://localhost:5173
- Keycloak Admin : http://localhost:8180
- Keycloak Admin credentials : admin / admin

### Développement local (sans Docker)

```bash
# Frontend
cd frontend
npm install
npm run dev

# Keycloak doit être lancé via Docker
cd ..
docker compose up keycloak keycloak-db -d
```

## 👥 Rôles utilisateurs

Le système définit deux rôles :

- **users** (par défaut) : Utilisateurs standards
- **admin** : Administrateurs avec privilèges étendus

Tous les nouveaux utilisateurs reçoivent automatiquement le rôle `users`.

## 🔐 Configuration Keycloak

### Realm Configuration
Le realm `chariot` est automatiquement configuré au démarrage avec :
- Support multi-langue (fr, en, es)
- Enregistrement des utilisateurs activé
- Réinitialisation de mot de passe activée
- Protection contre le brute force

### Client Configuration
- **Client ID** : `chariot-app`
- **Type** : Public client
- **Protocol** : OpenID Connect
- **Flux activés** : Standard Flow, Direct Access Grants

### Utilisateur admin par défaut
```
Email: admin@chariot.tools
Password: admin123
Rôles: admin, users
```

## 🌍 Internationalisation

Le frontend supporte trois langues :
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol

La langue est sauvegardée dans le localStorage du navigateur.

## 📁 Structure du projet

```
sso/
├── compose.yml                 # Configuration Docker Compose
├── keycloak/
│   ├── realm-export.json      # Configuration du realm Chariot
│   └── themes/                # Thèmes personnalisés (optionnel)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── main.js
    │   ├── App.vue
    │   ├── router/
    │   │   └── index.js
    │   ├── views/
    │   │   ├── Login.vue
    │   │   ├── Signup.vue
    │   │   └── ForgotPassword.vue
    │   ├── components/
    │   │   └── LanguageSwitcher.vue
    │   ├── services/
    │   │   └── keycloak.js
    │   ├── i18n/
    │   │   ├── index.js
    │   │   └── locales/
    │   │       ├── fr.json
    │   │       ├── en.json
    │   │       └── es.json
    │   └── assets/
    │       ├── main.css
    │       └── auth.css
    └── README.md
```

## 🔌 API Keycloak

Le service utilise l'API REST de Keycloak :

### Login
```javascript
POST /realms/chariot/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
client_id=chariot-app
username={email}
password={password}
```

### Création d'utilisateur
```javascript
POST /admin/realms/chariot/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "username": "user@example.com",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "enabled": true,
  "credentials": [{
    "type": "password",
    "value": "password123",
    "temporary": false
  }],
  "realmRoles": ["users"]
}
```

### Réinitialisation de mot de passe
```javascript
PUT /admin/realms/chariot/users/{userId}/execute-actions-email
Authorization: Bearer {admin_token}
Content-Type: application/json

["UPDATE_PASSWORD"]
```

## 🔧 Variables d'environnement

Les variables sont définies dans le fichier `.env` à la racine du projet :

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8180
KEYCLOAK_REALM=chariot
KEYCLOAK_CLIENT_ID=chariot-app
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_PORT=8180
KEYCLOAK_HOSTNAME=localhost

# Keycloak Database
KEYCLOAK_DB_NAME=keycloak
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=keycloak
KEYCLOAK_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak
```

## 🧪 Tests

Pour tester le service :

1. **Créer un compte** : http://localhost:5173/signup
2. **Se connecter** : http://localhost:5173/login
3. **Réinitialiser le mot de passe** : http://localhost:5173/forgot-password

### ⚠️ Note sur la réinitialisation de mot de passe en développement

La fonctionnalité de réinitialisation par email nécessite un serveur SMTP fonctionnel. En développement :

- **Option 1** : Les emails sont envoyés à `contact@chariot.tools` (configuré dans le `.env`)
- **Option 2** : Utilisez un serveur SMTP de test comme MailHog ou Mailpit
- **Option 3** : Réinitialisez manuellement via l'admin console Keycloak :
  1. Accédez à http://localhost:8180/admin
  2. Connectez-vous avec `admin` / `admin`
  3. Sélectionnez le realm `chariot`
  4. Allez dans Users > sélectionnez l'utilisateur > onglet Credentials
  5. Cliquez sur "Reset password"

### Accès à la console admin Keycloak

- URL : http://localhost:8180/admin
- Realm : `master` (pour l'admin) ou `chariot` (pour le service)
- Credentials admin : `admin` / `admin`

## 🛠️ Commandes utiles

```bash
# Démarrer les services
docker compose up -d keycloak-db keycloak sso-frontend

# Redémarrer les services (conserve les données)
docker compose restart keycloak
docker compose restart sso-frontend

# Arrêter les services (conserve les données)
docker compose stop keycloak keycloak-db sso-frontend

# Arrêter et supprimer les conteneurs (conserve les données)
docker compose down

# ⚠️ ATTENTION : Supprimer les volumes (PERD TOUTES LES DONNÉES)
docker compose down -v

# Voir les logs d'un service spécifique
docker compose logs -f keycloak
docker compose logs -f sso-frontend
docker compose logs -f keycloak-db

# Reconstruire le frontend
docker compose up --build sso-frontend

# Accéder au shell du conteneur frontend
docker compose exec sso-frontend sh

# Accéder à la base PostgreSQL
docker compose exec keycloak-db psql -U keycloak -d keycloak
```

### ⚠️ Important : Conservation des données

Les données des utilisateurs sont stockées dans un volume Docker nommé `chariot_keycloak-db-data`.

- ✅ **Pour conserver les données** : Utilisez `docker compose restart`, `stop` ou `down` (sans `-v`)
- ❌ **Pour supprimer les données** : Utilisez `docker compose down -v` (supprime les volumes)

Si vous avez besoin de réinitialiser complètement Keycloak avec la configuration d'origine, utilisez :
```bash
docker compose down keycloak keycloak-db -v
docker compose up -d keycloak-db keycloak
```

## 📊 Health Checks

Les services incluent des health checks :

- **PostgreSQL** : Vérifie la disponibilité de la base
- **Keycloak** : Vérifie `/health/ready` endpoint

## 🔒 Sécurité

### En production

1. **Modifier les secrets** :
   - Changer `KEYCLOAK_ADMIN_PASSWORD`
   - Utiliser des mots de passe forts pour la base de données

2. **HTTPS** :
   - Activer HTTPS sur Keycloak
   - Configurer `KC_HOSTNAME_STRICT=true`
   - Utiliser un certificat SSL valide

3. **CORS** :
   - Restreindre `webOrigins` aux domaines autorisés
   - Mettre à jour `redirectUris` avec les URLs de production

4. **Variables sensibles** :
   - Utiliser des secrets Docker ou un gestionnaire de secrets
   - Ne jamais commiter le fichier `.env`

## 🐛 Dépannage

### Erreur "HTTPS required" sur la console admin

Si vous recevez l'erreur "HTTPS required" lors de l'accès à la console admin, c'est que le realm master requiert SSL. Cette erreur peut survenir après un redémarrage ou une réinitialisation.

**Solution automatique** : Le service `keycloak-config` s'exécute automatiquement au démarrage et désactive SSL sur les realms.

**Solution manuelle** :
```bash
# Désactiver SSL directement dans la base de données
docker exec -it keycloak-db psql -U keycloak -d keycloak -c "UPDATE realm SET ssl_required = 'NONE' WHERE name = 'master';"

# Redémarrer Keycloak
docker compose restart keycloak
```

### Emails de réinitialisation de mot de passe non reçus

Les emails de réinitialisation ne fonctionnent pas en développement car :
1. Le serveur SMTP nécessite des identifiants valides
2. Les emails doivent provenir d'un domaine vérifié

**Solution temporaire** : Utilisez la console admin pour réinitialiser les mots de passe :
1. Accédez à http://localhost:8180/admin
2. Allez dans Chariot → Users
3. Sélectionnez l'utilisateur
4. Onglet "Credentials" → "Reset Password"

**Solution production** : Configurez un serveur SMTP valide dans les variables d'environnement et dans la console admin (Realm Settings → Email).

### Keycloak ne démarre pas
```bash
# Vérifier les logs
docker compose logs keycloak

# Vérifier que PostgreSQL est prêt
docker compose ps
```

### Frontend ne se connecte pas à Keycloak
```bash
# Vérifier les variables d'environnement
docker compose exec sso-frontend env | grep VITE

# Vérifier la connectivité réseau
docker compose exec sso-frontend ping keycloak
```

### Erreur "User already exists"
L'email est unique dans Keycloak. Utilisez un autre email ou supprimez l'utilisateur existant via l'admin console.

## 📚 Ressources

- [Documentation Keycloak](https://www.keycloak.org/documentation)
- [Vue.js Guide](https://vuejs.org/guide/)
- [Vue Router](https://router.vuejs.org/)
- [Vue I18n](https://vue-i18n.intlify.dev/)

## 🤝 Contribution

Pour contribuire au service SSO, consultez le guide de contribution principal du projet Chariot.

## 📝 License

Ce projet est sous licence MIT - voir le fichier LICENSE à la racine du projet.
