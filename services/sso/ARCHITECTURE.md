# Architecture du Service SSO

## Vue d'ensemble

Le service SSO (Single Sign-On) de Chariot est basé sur **Keycloak**, une solution open-source robuste pour la gestion des identités et des accès. Il fournit une interface utilisateur personnalisée en Vue.js pour l'authentification.

```
┌─────────────────────────────────────────────────────────────┐
│                     Service SSO Chariot                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ Frontend│          │  Keycloak  │        │ PostgreSQL│
   │ Vue.js  │◄────────►│   Server   │◄──────►│    DB     │
   │  :5173  │          │   :8180    │        │   :5432   │
   └─────────┘          └────────────┘        └───────────┘
        │                     │
        │              ┌──────┴──────┐
        │              │             │
        │         Realm: chariot     │
        │         Roles: users, admin│
        │              │             │
        └──────────────┼─────────────┘
                       │
              OAuth2 / OpenID Connect
```

## Composants

### 1. Frontend Vue.js (Port 5173)

**Responsabilités :**
- Interface utilisateur pour l'authentification
- Gestion des formulaires (login, signup, forgot password)
- Internationalisation (fr/en/es)
- Communication avec l'API Keycloak

**Technologies :**
- Vue.js 3 (Composition API)
- Vue Router (navigation)
- Vue I18n (traductions)
- Axios (requêtes HTTP)
- Vite (build tool)

**Pages :**
- `/login` : Connexion utilisateur
- `/signup` : Création de compte (username, firstName, lastName, email, password)
- `/forgot-password` : Réinitialisation du mot de passe

### 2. Keycloak Server (Port 8180)

**Responsabilités :**
- Authentification et autorisation des utilisateurs
- Gestion des tokens OAuth2 / OpenID Connect
- Gestion des rôles et permissions
- Support de la fédération d'identités
- API REST pour la gestion des utilisateurs

**Configuration Realm "chariot" :**
```json
{
  "realm": "chariot",
  "enabled": true,
  "registrationAllowed": true,
  "resetPasswordAllowed": true,
  "internationalizationEnabled": true,
  "supportedLocales": ["fr", "en", "es"],
  "defaultRoles": ["users"]
}
```

**Rôles :**
- `users` : Rôle par défaut pour tous les nouveaux utilisateurs
- `admin` : Rôle administrateur avec privilèges étendus

**Client "chariot-app" :**
- Type : Public client
- Protocol : OpenID Connect
- Standard Flow : Activé
- Direct Access Grants : Activé (pour login username/password)

### 3. PostgreSQL Database (Port 5432)

**Responsabilités :**
- Stockage persistant des données Keycloak
- Utilisateurs, sessions, tokens
- Configuration du realm et des clients

**Base de données :** `keycloak`

## Flux d'authentification

### 1. Inscription (Signup)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Keycloak │         │PostgreSQL│
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Formulaire      │                     │
     │    inscription     │                     │
     ├────────────────────┤                     │
     │                    │                     │
     │ 2. POST /users     │                     │
     │    (admin API)     │                     │
     ├───────────────────►│                     │
     │                    │                     │
     │                    │ 3. Créer user       │
     │                    ├────────────────────►│
     │                    │                     │
     │                    │ 4. User créé        │
     │                    │◄────────────────────┤
     │                    │                     │
     │ 5. Succès          │                     │
     │◄───────────────────┤                     │
     │                    │                     │
     │ 6. Redirect login  │                     │
     │                    │                     │
```

**Étapes :**
1. L'utilisateur remplit le formulaire (username, firstName, lastName, email, password)
2. Le frontend obtient un token admin et crée l'utilisateur via l'API admin Keycloak
3. Keycloak enregistre l'utilisateur dans PostgreSQL avec le rôle `users`
4. Redirection vers la page de login

### 2. Connexion (Login)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Keycloak │         │PostgreSQL│
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Email/Password  │                     │
     ├────────────────────┤                     │
     │                    │                     │
     │ 2. POST /token     │                     │
     │    grant_type=     │                     │
     │    password        │                     │
     ├───────────────────►│                     │
     │                    │                     │
     │                    │ 3. Vérifier user    │
     │                    ├────────────────────►│
     │                    │                     │
     │                    │ 4. User valide      │
     │                    │◄────────────────────┤
     │                    │                     │
     │                    │ 5. Générer tokens   │
     │                    │    (access, refresh)│
     │                    │                     │
     │ 6. Tokens JWT      │                     │
     │◄───────────────────┤                     │
     │                    │                     │
     │ 7. Stocker tokens  │                     │
     │    localStorage    │                     │
     │                    │                     │
```

**Étapes :**
1. L'utilisateur entre son email et mot de passe
2. Le frontend envoie une requête au endpoint `/token` avec `grant_type=password`
3. Keycloak vérifie les credentials dans PostgreSQL
4. Si valide, Keycloak génère un access_token et refresh_token JWT
5. Les tokens sont stockés dans le localStorage du navigateur

**Structure du JWT :**
```json
{
  "exp": 1733160000,
  "iat": 1733153000,
  "jti": "uuid",
  "iss": "http://localhost:8180/realms/chariot",
  "sub": "user-id",
  "typ": "Bearer",
  "azp": "chariot-app",
  "session_state": "uuid",
  "realm_access": {
    "roles": ["users"]
  },
  "email": "user@example.com",
  "name": "John Doe",
  "preferred_username": "user@example.com",
  "given_name": "John",
  "family_name": "Doe"
}
```

### 3. Mot de passe oublié

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │ Keycloak │         │PostgreSQL│
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Email           │                     │
     ├────────────────────┤                     │
     │                    │                     │
     │ 2. GET /users      │                     │
     │    ?email=...      │                     │
     ├───────────────────►│                     │
     │                    │                     │
     │                    │ 3. Chercher user    │
     │                    ├────────────────────►│
     │                    │                     │
     │                    │ 4. User trouvé      │
     │                    │◄────────────────────┤
     │                    │                     │
     │ 5. PUT execute-    │                     │
     │    actions-email   │                     │
     │    [UPDATE_        │                     │
     │     PASSWORD]      │                     │
     ├───────────────────►│                     │
     │                    │                     │
     │                    │ 6. Envoyer email    │
     │                    │    reset password   │
     │                    │                     │
     │ 7. Succès          │                     │
     │◄───────────────────┤                     │
     │                    │                     │
```

**Étapes :**
1. L'utilisateur entre son email
2. Le frontend cherche l'utilisateur via l'API admin
3. Si trouvé, déclenche l'action `UPDATE_PASSWORD` qui envoie un email
4. L'utilisateur reçoit un email avec un lien pour réinitialiser son mot de passe

## Sécurité

### 1. Protection des mots de passe
- Keycloak utilise bcrypt pour hasher les mots de passe
- Salage automatique de chaque mot de passe
- Pas de stockage en clair

### 2. Tokens JWT
- Signés avec RS256 (RSA + SHA256)
- Durée de vie configurable (défaut : 2h pour access_token)
- Refresh token pour renouvellement sans re-login

### 3. Brute Force Protection
```json
{
  "bruteForceProtected": true,
  "failureFactor": 5,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60
}
```
- Blocage temporaire après 5 tentatives échouées
- Délai croissant entre les tentatives
- Protection contre les attaques par dictionnaire

### 4. CORS
- Configuration stricte des origines autorisées
- Headers de sécurité configurés

### 5. HTTPS (Production)
- TLS/SSL obligatoire en production
- Configuration `KC_HOSTNAME_STRICT=true`
- Certificats valides requis

## Intégration avec d'autres services

### Pour authentifier un utilisateur dans un autre service Chariot :

```javascript
// 1. Vérifier le token JWT
const axios = require('axios')

async function verifyToken(accessToken) {
  const response = await axios.get(
    'http://keycloak:8080/realms/chariot/protocol/openid-connect/userinfo',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )
  return response.data // Contient email, name, roles, etc.
}

// 2. Vérifier les rôles
function hasRole(userInfo, role) {
  return userInfo.realm_access.roles.includes(role)
}

// Utilisation
const userInfo = await verifyToken(req.headers.authorization.split(' ')[1])
if (hasRole(userInfo, 'admin')) {
  // Autoriser l'action admin
}
```

## Scalabilité

### Keycloak clustering (pour production)
- Support du clustering avec plusieurs instances Keycloak
- Session replication via Infinispan
- Load balancing recommandé

### Base de données
- PostgreSQL supporte la réplication
- Possibilité de mettre en place un master-slave
- Backups réguliers recommandés

## Monitoring

### Health Checks
- Keycloak : `GET /health/ready`
- PostgreSQL : `pg_isready`

### Métriques importantes à surveiller
- Temps de réponse des endpoints d'authentification
- Nombre de sessions actives
- Taux d'échec de login
- Utilisation de la base de données

## Configuration avancée

### Email personnalisé
Configurer SMTP dans Keycloak pour les emails de réinitialisation :

```json
{
  "smtpServer": {
    "host": "smtp.example.com",
    "port": "587",
    "from": "noreply@chariot.tools",
    "auth": true,
    "user": "smtp-user",
    "password": "smtp-password"
  }
}
```

### Personnalisation du thème
Les thèmes Keycloak peuvent être personnalisés en plaçant des fichiers dans `/opt/keycloak/themes/`.

### Fédération d'identités
Keycloak supporte :
- Google OAuth2
- GitHub
- Facebook
- LDAP / Active Directory
- SAML 2.0

## Ressources supplémentaires

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Specification](https://openid.net/connect/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
