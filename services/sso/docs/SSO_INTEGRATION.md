# SSO Integration Guide

This guide explains the complete SSO (Single Sign-On) implementation for Chariot using Keycloak with a custom theme.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
- [Custom Keycloak Theme](#custom-keycloak-theme)
- [Multi-Language Support](#multi-language-support)
- [Email Templates](#email-templates)
- [Frontend Integration](#frontend-integration)
- [Backend Integration](#backend-integration)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

The Chariot SSO system is built on Keycloak 23.0.7 with a custom theme and integrates with the Next.js frontend and NestJS backend services.

```
┌─────────────────────────────────────────────────────────────┐
│                     Chariot SSO Architecture                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ Next.js │          │  Keycloak  │        │ PostgreSQL│
   │Frontend │◄────────►│   23.0.7   │◄──────►│  Keycloak │
   │  :3000  │   OIDC   │   :8080    │        │    DB     │
   └─────────┘          └─────┬──────┘        └───────────┘
        │                     │
   ┌────▼────┐          ┌─────▼─────┐
   │ NestJS  │          │  Custom    │
   │ Backend │◄────────►│   Theme    │
   │  :3001  │  Bearer  │  Chariot   │
   └─────────┘   Token  └───────────┘
```

### Key Features

- **Custom Theme**: Tailwind CSS v4 based theme with Chariot branding
- **Multi-Language**: Support for French, English, and Spanish
- **Dark Theme**: Modern dark UI with violet/purple gradient accents
- **Custom Email Templates**: Branded password reset emails
- **PKCE Flow**: Secure authorization code flow with PKCE (S256)
- **Token Management**: Automatic token refresh with configurable lifespans
- **Docker Integration**: Internal and external network routing

## Components

### 1. Keycloak Server (Port 8080)

**Version**: 23.0.7

**Responsibilities**:
- User authentication and authorization
- Token generation (access tokens, refresh tokens)
- Role and permission management
- User registration and password reset flows
- Email notifications

**Realm Configuration**:
- **Realm**: `chariot`
- **Client ID**: `chariot-app`
- **Protocol**: OpenID Connect (OIDC)
- **Flow**: Authorization Code with PKCE
- **Roles**: `users` (default), `admin`

**Token Lifespans**:
```json
{
  "accessTokenLifespan": 300,           // 5 minutes
  "ssoSessionIdleTimeout": 1800,        // 30 minutes
  "ssoSessionMaxLifespan": 36000,       // 10 hours
  "accessCodeLifespan": 60,             // 1 minute
  "accessCodeLifespanUserAction": 300,  // 5 minutes
  "accessCodeLifespanLogin": 1800,      // 30 minutes
  "actionTokenGeneratedByAdminLifespan": 43200  // 12 hours
}
```

### 2. PostgreSQL Database (Port 5432)

**Database**: `keycloak`

**Purpose**: Persistent storage for Keycloak data including users, sessions, tokens, and realm configuration.

### 3. Custom Theme

**Location**: `services/sso/keycloak/themes/chariot/`

**Structure**:
```
chariot/
├── login/                      # Login theme (forms, templates)
│   ├── login.ftl               # Login page
│   ├── register.ftl            # Registration page
│   ├── login-reset-password.ftl # Password reset request
│   ├── login-update-password.ftl # Password update form
│   ├── template.ftl            # Base template
│   ├── messages/               # Translation files
│   │   ├── messages_fr.properties
│   │   ├── messages_en.properties
│   │   └── messages_es.properties
│   └── resources/
│       ├── css/
│       │   ├── input.css       # Source Tailwind CSS
│       │   └── output.css      # Compiled CSS
│       └── img/
│           └── background.svg   # Background gradient
│
└── email/                      # Email theme
    ├── html/
    │   └── password-reset.ftl  # Password reset email
    └── messages/               # Email translations
        ├── messages_fr.properties
        ├── messages_en.properties
        └── messages_es.properties
```

## Custom Keycloak Theme

### Design System

**Colors**:
- Background: `#0C0C0C` (dark gray)
- Container: `#19191C` (lighter dark gray)
- Primary: `#AA00FF` → `#7700BB` (violet gradient)
- Text: `#FFFFFF` (white)
- Border: `rgba(255, 255, 255, 0.1)`

**Typography**:
- Font Family: Inter, system-ui, sans-serif
- Font Sizes: 14px (body), 28px (headings)

### Building the Theme

The theme uses Tailwind CSS v4 with custom configuration:

```bash
# Navigate to theme directory
cd services/sso/keycloak/themes/chariot/login/resources/css

# Build CSS (requires Tailwind CLI or npm script)
npx tailwindcss -i input.css -o output.css --minify
```

**Build Script** (in `services/sso/keycloak/package.json`):
```json
{
  "scripts": {
    "build": "cd themes/chariot/login/resources/css && tailwindcss -i input.css -o output.css --minify"
  }
}
```

### Key Features

#### Password Visibility Toggle

Login and registration forms include an eye icon to toggle password visibility:

```html
<div class="password-wrapper">
  <input type="password" id="password" name="password" />
  <button type="button" class="toggle-password" aria-label="${msg('login.togglePasswordLabel')}">
    <!-- SVG eye icon -->
  </button>
</div>
```

JavaScript in `template.ftl` handles the toggle:
```javascript
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', function() {
    const input = this.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
    // Toggle SVG icon
  });
});
```

#### Responsive 2-Column Registration Form

The registration form uses a responsive grid layout:

```css
.form-fields-row {
  display: flex;
  flex-direction: row;
  gap: 2rem;
}

.form-column {
  flex: 1;
}

@media (max-width: 768px) {
  .form-fields-row {
    flex-direction: column;
    gap: 0;
  }
}
```

#### Background Gradient

The theme uses a fixed background SVG with radial gradient:

```css
body {
  background-image: url('../img/background.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
```

#### Chrome Autofill Fix

Custom CSS to prevent white background on autofill:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-background-clip: text;
  -webkit-text-fill-color: #FFFFFF;
  transition: background-color 5000s ease-in-out 0s;
  box-shadow: inset 0 0 20px 20px transparent !important;
  background-color: transparent !important;
}
```

## Multi-Language Support

The SSO system supports three languages with complete translations:

- **French (fr)**: Default language
- **English (en)**
- **Spanish (es)**

### Language Selection

Users can select their language using the `kc_locale` parameter:
- `http://localhost:8080/realms/chariot/protocol/openid-connect/auth?kc_locale=fr`
- `http://localhost:8080/realms/chariot/protocol/openid-connect/auth?kc_locale=en`
- `http://localhost:8080/realms/chariot/protocol/openid-connect/auth?kc_locale=es`

### Translation Files

**Location**: `services/sso/keycloak/themes/chariot/login/messages/`

**Format**: Java properties files with UTF-8 encoding

**Example** (`messages_fr.properties`):
```properties
loginAccountTitle=Connexion
email=Email
password=Mot de passe
doLogIn=Se connecter
login.forgotPasswordText=Vous avez croisé un flageleur mental ?
login.forgotPasswordLink=Mot de passe oublié
login.noAccountText=Pas encore de compte ?
login.registerLink=Inscrivez-vous

# Error messages
invalidUserMessage=Nom d''utilisateur ou mot de passe incorrect.
missingUsernameMessage=Veuillez spécifier un nom d''utilisateur.
```

**Important**: Apostrophes must be escaped with double single quotes (`''`):
- ❌ `d'utilisateur`
- ✅ `d''utilisateur`

### Using Translations in Templates

Replace hard-coded text with `${msg("key")}`:

```html
<!-- Before -->
<h1>Connexion</h1>
<input placeholder="Email" />

<!-- After -->
<h1>${msg("loginAccountTitle")}</h1>
<input placeholder="${msg('email')}" />
```

### Adding New Translations

1. **Add the key to all language files**:
   ```properties
   # messages_fr.properties
   myNewKey=Mon nouveau texte

   # messages_en.properties
   myNewKey=My new text

   # messages_es.properties
   myNewKey=Mi nuevo texto
   ```

2. **Use in FTL template**:
   ```html
   <span>${msg("myNewKey")}</span>
   ```

3. **Restart Keycloak** (or clear cache):
   ```bash
   docker compose restart keycloak
   ```

## Email Templates

### Password Reset Email

**File**: `services/sso/keycloak/themes/chariot/email/html/password-reset.ftl`

**Design**: Dark theme email with Chariot branding

**Structure**:
```html
<!DOCTYPE html>
<html lang="${locale}">
<body style="background-color: #0C0C0C; color: #FFFFFF;">
  <table>
    <tr>
      <td style="background: linear-gradient(135deg, #AA00FF 0%, #7700BB 100%);">
        <h1>Chariot</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #19191C;">
        <p>${msg("passwordResetBodyHtml")?no_esc}</p>
        <a href="${link}" style="background: linear-gradient(135deg, #AA00FF, #7700BB);">
          ${msg("passwordResetButton")}
        </a>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Email Translations

**Location**: `services/sso/keycloak/themes/chariot/email/messages/`

**Example** (`messages_fr.properties`):
```properties
passwordResetSubject=Réinitialisation de votre mot de passe Chariot
passwordResetBodyHtml=Quelqu''un vient de demander une réinitialisation de mot de passe pour votre compte Chariot. Si c''était vous, cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :
passwordResetButton=Réinitialiser mon mot de passe
passwordResetWarning=Attention
passwordResetWarningText=Si vous n''avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
```

### SMTP Configuration

**Environment Variables** (`.env`):
```env
# Development (email disabled)
KEYCLOAK_SMTP_HOST=
KEYCLOAK_SMTP_PORT=
KEYCLOAK_SMTP_FROM=
KEYCLOAK_SMTP_USER=
KEYCLOAK_SMTP_PASSWORD=

# Production (example with Gmail)
KEYCLOAK_SMTP_HOST=smtp.gmail.com
KEYCLOAK_SMTP_PORT=587
KEYCLOAK_SMTP_FROM=noreply@chariot.tools
KEYCLOAK_SMTP_FROM_DISPLAY_NAME=Chariot
KEYCLOAK_SMTP_USER=your-email@gmail.com
KEYCLOAK_SMTP_PASSWORD=your-app-password
KEYCLOAK_SMTP_STARTTLS=true
KEYCLOAK_SMTP_SSL=false
```

**Note**: Email verification is disabled in development (`verifyEmail: false` in `realm-export.json`).

## Frontend Integration

### Technology Stack

- **Framework**: Next.js 15.5.7 with React 19
- **Keycloak Client**: `keycloak-js` 26.2.1
- **PKCE**: S256 code challenge method

### Keycloak Provider

**File**: `services/chariot/frontend/src/providers/KeycloakProvider.tsx`

**Key Configuration**:
```typescript
const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,  // http://localhost:8080
  realm: 'chariot',
  clientId: 'chariot-app',
});

await keycloak.init({
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: false,
});
```

**Token Refresh**:
```typescript
// Check and refresh token every 10 seconds
setInterval(async () => {
  try {
    const refreshed = await keycloak.updateToken(30); // Min validity: 30 seconds
    if (refreshed) {
      console.log('Token refreshed');
    }
  } catch (error) {
    console.error('Token refresh failed', error);
    keycloak.login();
  }
}, 10000);
```

### API Configuration

**File**: `services/chariot/frontend/src/services/apiConfig.ts`

**Bearer Token Injection**:
```typescript
let keycloakTokenGetter: (() => string | undefined) | null = null;

export const setKeycloakTokenGetter = (getter: () => string | undefined) => {
  keycloakTokenGetter = getter;
};

apiClient.interceptors.request.use((config) => {
  const token = keycloakTokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**401 Error Handling**:
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      keycloak.login();
    }
    return Promise.reject(error);
  }
);
```

### Authentication Check

**Pattern**: Wait for authentication before making API calls

```typescript
const { authenticated, authLoading } = useKeycloak();

useEffect(() => {
  if (authLoading) return;
  if (!authenticated) return;

  // Now safe to make API calls
  fetchData();
}, [authenticated, authLoading]);
```

### Locale Support

The frontend passes the user's locale to Keycloak:

```typescript
const locale = localStorage.getItem('locale') || 'fr';

keycloak.login({
  redirectUri: window.location.origin,
  locale: locale, // 'fr', 'en', or 'es'
});
```

## Backend Integration

### Technology Stack

- **Framework**: NestJS 11
- **Strategy**: `passport-keycloak-bearer`
- **Guards**: JWT Bearer token validation

### Keycloak Strategy

**File**: `services/chariot/backend/src/common/strategies/keycloak.strategy.ts`

**Configuration**:
```typescript
export class KeycloakStrategy extends PassportStrategy(KeycloakBearerStrategy, 'keycloak') {
  constructor() {
    super({
      realm: 'chariot',
      url: process.env.KEYCLOAK_INTERNAL_URL,  // http://keycloak:8080
      clientId: 'chariot-app',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  }
}
```

**Important**: Use `KEYCLOAK_INTERNAL_URL` (Docker internal network) instead of `KEYCLOAK_URL` (external localhost) to avoid connection issues.

### Authentication Guard

```typescript
@Controller('campaigns')
@UseGuards(KeycloakAuthGuard)
export class CampaignsController {
  @Get()
  async findAll(@Request() req) {
    const user = req.user; // From Keycloak token
    // user.userId, user.email, user.roles
  }
}
```

### Role-Based Access Control

```typescript
@Controller('admin')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // Only accessible to users with 'admin' role
}
```

## Configuration

### Environment Variables

**Root `.env`** (used by all services):

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_INTERNAL_URL=http://keycloak:8080
KEYCLOAK_REALM=chariot
KEYCLOAK_CLIENT_ID=chariot-app
KEYCLOAK_CLIENT_SECRET=MfFXtKoKgHmKY8hk+ej5wmeX0VHDzD/poVmzLAdCaoY=

# Keycloak Admin
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# Keycloak Database
KEYCLOAK_DB_NAME=keycloak
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=keycloak

# SMTP (disabled in development)
KEYCLOAK_SMTP_HOST=
KEYCLOAK_SMTP_PORT=
KEYCLOAK_SMTP_FROM=
KEYCLOAK_SMTP_USER=
KEYCLOAK_SMTP_PASSWORD=

# Default Admin User
KEYCLOAK_DEFAULT_ADMIN_EMAIL=admin@chariot.tools
KEYCLOAK_DEFAULT_ADMIN_PASSWORD=admin123
KEYCLOAK_DEFAULT_ADMIN_FIRSTNAME=Admin
KEYCLOAK_DEFAULT_ADMIN_LASTNAME=Chariot
```

### Frontend Environment Variables

**`services/chariot/frontend/.env.local`**:
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=chariot
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=chariot-app
```

### Backend Environment Variables

**`services/chariot/backend/.env`**:
```env
KEYCLOAK_INTERNAL_URL=http://keycloak:8080
KEYCLOAK_REALM=chariot
KEYCLOAK_CLIENT_ID=chariot-app
```

### Docker Networks

**Shared Network** (for cross-service communication):
```yaml
networks:
  shared-network:
    name: shared-network
    external: true
```

**Internal Network** (for service isolation):
```yaml
networks:
  chariot-network:
    driver: bridge
```

**Service Configuration**:
```yaml
services:
  keycloak:
    networks:
      - shared-network
      - chariot-network

  frontend:
    networks:
      - shared-network

  backend:
    networks:
      - shared-network
      - chariot-network
```

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- pnpm 9+

### Starting the SSO Service

```bash
# 1. Create shared network (if not exists)
docker network create shared-network

# 2. Start SSO services
cd services/sso
docker compose up -d

# 3. Check logs
docker compose logs -f keycloak

# 4. Wait for Keycloak to start (may take 1-2 minutes)
# Look for: "Keycloak 23.0.7 started"
```

### Building the Custom Theme

```bash
# Navigate to theme directory
cd services/sso/keycloak/themes/chariot/login/resources/css

# Install Tailwind CSS (if not installed)
npm install -g tailwindcss

# Build CSS
tailwindcss -i input.css -o output.css --minify

# Or use npm script (if configured)
cd services/sso/keycloak
npm run build
```

### Accessing Keycloak

- **Admin Console**: http://localhost:8080/admin
  - Username: `admin`
  - Password: `admin`

- **Chariot Realm**: http://localhost:8080/realms/chariot

- **Login Page**: http://localhost:8080/realms/chariot/protocol/openid-connect/auth?client_id=chariot-app&response_type=code&redirect_uri=http://localhost:3000

### Testing Authentication Flow

1. **Start all services**:
   ```bash
   # Root of monorepo
   docker compose up -d
   ```

2. **Open frontend**:
   ```
   http://localhost:3000
   ```

3. **Login with default admin**:
   - Email: `admin@chariot.tools`
   - Password: `admin123`

4. **Check token**:
   Open browser console and inspect localStorage:
   ```javascript
   localStorage.getItem('kc-token')
   ```

### Testing Translations

Change locale with URL parameter:
```
http://localhost:8080/realms/chariot/protocol/openid-connect/auth?client_id=chariot-app&kc_locale=fr
http://localhost:8080/realms/chariot/protocol/openid-connect/auth?client_id=chariot-app&kc_locale=en
http://localhost:8080/realms/chariot/protocol/openid-connect/auth?client_id=chariot-app&kc_locale=es
```

### Modifying Templates

1. **Edit FTL file**:
   ```bash
   vim services/sso/keycloak/themes/chariot/login/login.ftl
   ```

2. **Restart Keycloak** (to clear cache):
   ```bash
   docker compose restart keycloak
   ```

3. **Test changes** in browser

## Troubleshooting

### Issue: "Token refresh loop" or constant re-authentication

**Cause**: Token lifespan configuration mismatch or missing token refresh logic.

**Solution**: 
1. Check `realm-export.json` has proper token lifespans:
   ```json
   {
     "accessTokenLifespan": 300,
     "ssoSessionIdleTimeout": 1800,
     "ssoSessionMaxLifespan": 36000
   }
   ```

2. Ensure frontend has token refresh interval:
   ```typescript
   setInterval(() => keycloak.updateToken(30), 10000);
   ```

### Issue: "Backend cannot connect to Keycloak"

**Cause**: Using localhost URL instead of internal Docker network URL.

**Solution**: Use `KEYCLOAK_INTERNAL_URL=http://keycloak:8080` in backend environment.

```typescript
// ❌ Wrong
url: 'http://localhost:8080'

// ✅ Correct
url: process.env.KEYCLOAK_INTERNAL_URL // http://keycloak:8080
```

### Issue: "SMTP timeout" or email not sending

**Cause**: SMTP server configuration issues or network restrictions.

**Solution** (Development):
1. Disable email verification:
   ```json
   // realm-export.json
   {
     "verifyEmail": false,
     "loginWithEmailAllowed": true
   }
   ```

2. Clear SMTP environment variables in `.env`:
   ```env
   KEYCLOAK_SMTP_HOST=
   KEYCLOAK_SMTP_PORT=
   ```

**Solution** (Production):
Use a reliable SMTP service (Gmail, SendGrid, AWS SES):
```env
KEYCLOAK_SMTP_HOST=smtp.gmail.com
KEYCLOAK_SMTP_PORT=587
KEYCLOAK_SMTP_FROM=noreply@chariot.tools
KEYCLOAK_SMTP_USER=your-email@gmail.com
KEYCLOAK_SMTP_PASSWORD=your-app-password
KEYCLOAK_SMTP_STARTTLS=true
```

### Issue: "White background on autofill in Chrome"

**Cause**: Browser default autofill styling.

**Solution**: Add `-webkit-autofill` CSS overrides in `input.css`:
```css
input:-webkit-autofill {
  -webkit-background-clip: text;
  -webkit-text-fill-color: #FFFFFF;
  transition: background-color 5000s ease-in-out 0s;
  box-shadow: inset 0 0 20px 20px transparent !important;
  background-color: transparent !important;
}
```

### Issue: "Translations not showing" or "Missing translation keys"

**Cause**: 
1. FTL templates still have hard-coded text
2. Translation keys missing in `.properties` files
3. Apostrophes not escaped

**Solution**:
1. Replace all hard-coded text with `${msg("key")}`:
   ```html
   <!-- Before -->
   <h1>Connexion</h1>
   
   <!-- After -->
   <h1>${msg("loginAccountTitle")}</h1>
   ```

2. Ensure key exists in all language files

3. Escape apostrophes with double quotes:
   ```properties
   # ❌ Wrong
   text=C'est un exemple d'apostrophe
   
   # ✅ Correct
   text=C''est un exemple d''apostrophe
   ```

### Issue: "Background SVG not displaying"

**Cause**: Incorrect path or SVG syntax errors.

**Solution**:
1. Check CSS path is relative to `resources/css/`:
   ```css
   body {
     background-image: url('../img/background.svg');
   }
   ```

2. Verify SVG is valid XML:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
     <defs>
       <radialGradient id="gradient">
         <stop offset="0%" style="stop-color:#AA00FF;stop-opacity:0.6" />
         <stop offset="100%" style="stop-color:#7700BB;stop-opacity:0" />
       </radialGradient>
     </defs>
     <ellipse cx="960" cy="540" rx="800" ry="600" fill="url(#gradient)" />
   </svg>
   ```

### Issue: "Frontend API calls fail with 401"

**Cause**: API calls made before authentication completes.

**Solution**: Check authentication state before fetching:
```typescript
const { authenticated, authLoading } = useKeycloak();

useEffect(() => {
  if (authLoading) return; // Still loading
  if (!authenticated) return; // Not logged in

  // Safe to make API calls
  fetchData();
}, [authenticated, authLoading]);
```

### Issue: "Keycloak container keeps restarting"

**Cause**: Database connection issues or invalid realm configuration.

**Solution**:
1. Check logs:
   ```bash
   docker compose logs keycloak
   ```

2. Verify database is running:
   ```bash
   docker compose ps keycloak-db
   ```

3. Check realm-export.json for JSON syntax errors

4. Reset database:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## Security Considerations

### Production Checklist

- [ ] Change default admin password
- [ ] Use strong client secret
- [ ] Enable HTTPS (`KC_HOSTNAME_STRICT_HTTPS: true`)
- [ ] Configure proper CORS origins
- [ ] Enable email verification (`verifyEmail: true`)
- [ ] Set up secure SMTP with TLS/SSL
- [ ] Use environment-specific redirect URIs
- [ ] Enable brute force protection
- [ ] Configure session timeouts appropriately
- [ ] Use secure database passwords
- [ ] Enable audit logging

### Token Security

- Access tokens expire after 5 minutes (configurable)
- Refresh tokens use secure rotation
- PKCE S256 prevents authorization code interception
- Tokens stored in memory (not localStorage) in production
- HTTPOnly cookies for session management (recommended)

### Network Security

- Internal services use Docker networks (no external exposure)
- Backend uses `KEYCLOAK_INTERNAL_URL` for service-to-service
- Frontend uses `KEYCLOAK_URL` for browser-based auth
- Firewall rules restrict Keycloak access in production

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation.html)
- [Keycloak Theme Documentation](https://www.keycloak.org/docs/latest/server_development/#_themes)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

## Support

For issues or questions:
1. Check this documentation first
2. Review Keycloak logs: `docker compose logs keycloak`
3. Check frontend/backend logs for integration issues
4. Consult the [Troubleshooting](#troubleshooting) section
