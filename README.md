# Chariot - Microservices Architecture

> Modern microservices-based platform built with NestJS, Next.js, and Docker

## 🏗️ Architecture

This project follows a microservices architecture with the following structure:

```
Chariot/
├── services/               # Microservices
│   ├── adventure/          # NestJS 11 API (Backend)
│   ├── gateway/            # API Gateway (NestJS 10)
│   ├── sso/                # Keycloak (Authentication)
│   └── web/                # NextJS 15 Frontend
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 11.0.0
- **Docker** & **Docker Compose** v2

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chariot-group/Chariot.git
   cd Chariot
   ```

2. **Install dependencies**
   ```bash
   cd services/adventure/api/
   npm install
   ```
   ```bash
   cd services/sso/keycloak/themes/chariot/
   npm install
   ```
   ```bash
   cd services/web/client/
   npm install
   ```

3. **Configure environment**
   Edit .env with your configuration
   ```bash
   cd services/adventure/
   cp .env.example .env
   ```
   ```bash
   cd services/sso/
   cp .env.example .env
   ```
   ```bash
   cd services/web/
   cp .env.example .env
   ```

4. **Start all services**
   
   **Development** (with hot-reload):
   ```bash
   make up
   ```

   **Integration** (production build, testing):
   ```bash
   make up ENV=integ
   ```

   **Production** (optimized, resource limits):
   ```bash
   make up ENV=prod
   ```

   Or start specific services:
   ```bash
   make up SERVICE=[adventure | sso | web]
   ```

## 📦 Microservices

### Chariot Services
- **Gateway**: `http://localhost:8082` (API Gateway)
- **Adventure**: `http://localhost:9000` (Backend API - internal)
- **Frontend**: `http://localhost:3000` (Web Client)
- **SSO**: `http://localhost:8180` (Keycloak)

## 🛠️ Development

### Workspace Commands

```bash
# Show all commands
make help

# Lint all application services and get per-service status
make lint

# Explicit lint status report across services
make lint-status

# Lint one service only
make lint SERVICE=adventure
make lint SERVICE=gateway
make lint SERVICE=web

# Auto-fix lint on one service
make lint-fix SERVICE=adventure
make lint-fix SERVICE=gateway
make lint-fix SERVICE=web
```