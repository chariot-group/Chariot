# 🛠️ Technical Documentation

## 📡 API
- [API Response Conventions](API_RESPONSE_CONVENTIONS.md) - API response standards

## 🎨 Frontend
See [frontend/docs/](../../frontend/docs/) for:
- [Internationalization](../../frontend/docs/i18n.md) - i18n configuration
- [Frontend Contribution](../../frontend/docs/CONTRIBUTING.md) - Development standards

## ⚙️ Backend
See [backend/docs/](../../backend/docs/) for:
- [Logger](../../backend/docs/LOGGER.md) - Log configuration
- [Stripe](../../backend/docs/STRIPE.md) - Payments integration
- [Access rights](../../backend/docs/RIGHTS.md) - Permission system
- [Backend Contribution](../../backend/docs/CONTRIBUTING.md) - Development standards

## 📋 Architecture
- **Monorepo**: Frontend (Next.js) + Backend (NestJS)
- **Database**: Configured via Docker Compose
- **Authentication**: Integrated system with permission management
- **Payments**: Stripe
- **Logs**: Winston