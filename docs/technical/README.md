# 🛠️ Documentation technique

Ce document donne une vue d'ensemble technique et oriente vers la documentation spécifique
présente dans le dépôt.

## 📡 API
- **Conventions de réponse** : [API_RESPONSE_CONVENTIONS.md](API_RESPONSE_CONVENTIONS.md)

## 🚀 Déploiement
- Les configurations de déploiement se trouvent principalement dans les fichiers `compose.*.yml`
  au niveau des services (par ex. `services/*/compose.dev.yml`, `compose.prod.yml`).

## 🎨 Frontend
- Code du frontend : [services/web/client](../../services/web/client)
  - Documentation locale : [services/web/client/docs/CONTRIBUTING.md](../../services/web/client/docs/CONTRIBUTING.md)
  - Internationalisation : [services/web/client/docs/i18n.md](../../services/web/client/docs/i18n.md)

## ⚙️ Backend / API
- API principale : [services/adventure/api](../../services/adventure/api)
  - Logger, droits et contributions :
    - [services/adventure/api/docs/logger.md](../../services/adventure/api/docs/logger.md)
    - [services/adventure/api/docs/rights.md](../../services/adventure/api/docs/rights.md)
    - [services/adventure/api/docs/CONTRIBUTING.md](../../services/adventure/api/docs/CONTRIBUTING.md)

## 🔐 Authentification & SSO
- Keycloak et configuration SSO : [services/sso](../../services/sso)
  - Realm exports : `services/sso/keycloak/realm-export*.json`
  - Thèmes personnalisés : `services/sso/keycloak/themes/chariot`

## 📊 Observabilité

- **Logging** : flux et architecture de logs décrits dans
  [LOG_FLOW_DIAGRAM.md](LOG_FLOW_DIAGRAM.md)

## 📋 Architecture (vue d'ensemble)

- Monorepo contenant plusieurs services :
  - `services/adventure` — API / backend
  - `services/web` — UI (client)
  - `services/sso` — Keycloak / SSO configuration
- Chaque service contient ses propres fichiers de composition (`compose.*.yml`) pour
  les environnements `dev`, `integ`, `prod`.

## 🔎 Où commencer
- Pour des questions d'authentification, voir `services/sso` (Keycloak)
- Pour le frontend, voir `services/web/client/docs`
- Pour l'API et la configuration backend, voir `services/adventure/api/docs`

