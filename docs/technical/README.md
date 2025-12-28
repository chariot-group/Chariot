# 🛠️ Technical Documentation

This document provides a concise technical overview and points to the
service-specific documentation available in the repository.

## 📡 API
- **Response conventions**: [API_RESPONSE_CONVENTIONS.md](API_RESPONSE_CONVENTIONS.md)

## 🚀 Deployment
- Deployment configurations are mainly located in `compose.*.yml` files at
  each service level (for example: `services/*/compose.dev.yml`,
  `compose.prod.yml`).

## 🎨 Frontend
- Frontend code: [services/web/client](../../services/web/client)
  - Local documentation: [services/web/client/docs/CONTRIBUTING.md](../../services/web/client/docs/CONTRIBUTING.md)
  - Internationalization: [services/web/client/docs/i18n.md](../../services/web/client/docs/i18n.md)

## ⚙️ Backend / API
- Main API: [services/adventure/api](../../services/adventure/api)
  - Logger, rights and contribution guides:
    - [services/adventure/api/docs/logger.md](../../services/adventure/api/docs/logger.md)
    - [services/adventure/api/docs/rights.md](../../services/adventure/api/docs/rights.md)
    - [services/adventure/api/docs/CONTRIBUTING.md](../../services/adventure/api/docs/CONTRIBUTING.md)

## 🔐 Authentication & SSO
- Keycloak and SSO configuration: [services/sso](../../services/sso)
  - Realm exports: `services/sso/keycloak/realm-export*.json`
  - Custom themes: `services/sso/keycloak/themes/chariot`

## 📊 Observability

- **Logging**: log flow and architecture are described in
  [LOG_FLOW_DIAGRAM.md](LOG_FLOW_DIAGRAM.md)

## 📋 Architecture (overview)

- Monorepo containing multiple services:
  - `services/adventure` — API / backend
  - `services/web` — UI (client)
  - `services/sso` — Keycloak / SSO configuration
- Each service contains its own composition files (`compose.*.yml`) for
  `dev`, `integ`, and `prod` environments.

## 🔎 Where to start
- For authentication questions, see `services/sso` (Keycloak)
- For frontend, see `services/web/client/docs`
- For API and backend configuration, see `services/adventure/api/docs`

