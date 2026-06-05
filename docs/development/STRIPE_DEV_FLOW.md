# Stripe in Development (Checkout + Webhook)

This document explains the Stripe flow in Chariot and how to test it locally.

## Goal

- Describe the full flow between the frontend, the gateway, and the payment service
- Provide a testing procedure for the `dev` environment
- Clarify that the frontend triggering checkout is **the Chariot web app** (not the showcase)

## Architecture

Stripe is handled exclusively by the **payment service** (`services/payment`), which runs on port `9003`.  
The gateway proxies `/payment/*` routes to this service (port `8082`).

```
Frontend → Gateway (/payment/stripe/...) → Payment service (port 9003) → Stripe
```

> **Path prefix**: payment routes use `/payment`, not `/api`. Adventure routes use `/api`.

## Functional Flow

### 1) Frontend → checkout (PaymentElement — current web app flow)

The Chariot web app uses a **single-page PaymentElement checkout** (`/[locale]/checkout`):

1. User opens the shop dialog and selects a pack → navigates to `/[locale]/checkout?packId=...&displayName=...`
2. Frontend loads products via `GET /payment/stripe/products`
3. Frontend creates a PaymentIntent via `POST /payment/stripe/payment-intent`
4. Stripe PaymentElement is rendered in-app with the returned `clientSecret`
5. Quantity or promo/affiliation code changes trigger `PATCH /payment/stripe/payment-intent/:id`
6. User confirms payment via `stripe.confirmPayment()` (redirect only if required by the payment method)
7. On success, user is redirected to `/[locale]/checkout/return?redirect_status=succeeded`

**Alternative checkout modes** (still available in the payment API, not used by the current web frontend):

| Mode | Endpoint | Behaviour |
|------|----------|-----------|
| Standard checkout (redirect) | `POST /payment/stripe/checkout` | Redirects to Stripe-hosted checkout; success URL: `FRONTEND_URL/?payment=success` |
| Embedded checkout | `POST /payment/stripe/checkout/embedded` | Returns a `clientSecret` for Stripe Embedded Checkout; return URL: `FRONTEND_URL/{locale}/checkout/return?session_id={CHECKOUT_SESSION_ID}` |

### 2) Discount resolution

Before creating any checkout session or PaymentIntent, the payment service resolves discounts in this order:

1. **Affiliation code** (`affiliationCode` in body) — applied first
2. **Promo code** (`promoCode` in body) — applied on top of affiliation discount
3. **Referral discount** — applied automatically **only when no promo or affiliation code is provided**  
   (see FR-013 for referral system rules)

The frontend previews referral discounts via `GET /payment/referral/me` and resolves manual codes via `GET /payment/stripe/resolve-code/:code`.

### 3) Stripe payment → webhook

- Stripe calls the webhook at `POST /payment/stripe/webhook` (through gateway: `http://localhost:8082/payment/stripe/webhook`)
- The webhook endpoint is public but validated with Stripe signature (`stripe-signature`)
- Payment service processes two event types:
  - **`payment_intent.succeeded`** (current web app flow) — fulfilled when `metadata.source === 'payment_element'`
  - **`checkout.session.completed`** (legacy redirect/embedded checkout flows)
- On fulfillment: payment recorded, tokens credited to the user via the adventure service (`POST /user/internal/tokens`)
- Post-payment side effects: referral discount marked as used, referee's first purchase validated

### 4) User return flow

**PaymentElement flow (current)**:
- After payment, user lands on `/[locale]/checkout/return` with `redirect_status=succeeded` (or `processing`)
- A success/failure screen is displayed; user can return to the app via the provided button

**Legacy redirect checkout flow**:
- Stripe redirects to `FRONTEND_URL/?payment=success`
- The home page displays a token reload confirmation toast and redirects using post-login logic

## Available Endpoints (via gateway)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/payment/stripe/payment-intent` | Required | Create a PaymentIntent (PaymentElement flow) |
| `PATCH` | `/payment/stripe/payment-intent/:id` | Required | Update a PaymentIntent (quantity / promo code change) |
| `POST` | `/payment/stripe/checkout` | Required | Create a standard checkout session (redirect) |
| `POST` | `/payment/stripe/checkout/embedded` | Required | Create an embedded checkout session |
| `GET` | `/payment/stripe/checkout/status/:sessionId` | Required | Get checkout session status (embedded flow) |
| `POST` | `/payment/stripe/webhook` | Public (Stripe sig) | Stripe webhook handler |
| `GET` | `/payment/stripe/products` | Public | List active Stripe products |
| `GET` | `/payment/stripe/resolve-code/:code` | Required | Resolve a promo or affiliation code |
| `GET` | `/payment/referral/me` | Required | Get current user's referral discount info |
| `POST` | `/payment/referral/init` | Required | Initialize a referral link |

## Related Functional Rules

- Reference: `FR-013` in `docs/functional-rules.md`
- Checkout requires authentication (user from Keycloak context)
- Webhook is public + Stripe signature validation is mandatory
- Referral discount rules defined in `FR-013`

## Dev Prerequisites

### Payment service (`services/payment/.env`)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL` (e.g. `http://localhost:3000`)
- `SHOWCASE_URL` (cancel URL for legacy redirect checkout)
- `PAYMENT_DATABASE_URL` (PostgreSQL on host port `5434`)
- `ADVENTURE_SERVICE_URL` (e.g. `http://chariot-adventure:9000`) — required for token credit
- `INTERNAL_SERVICE_SECRET` — must match adventure service secret
- Keycloak variables (`KEYCLOAK_INTERNAL_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, etc.)

### Web client (`services/web/.env`)

- `NEXT_PUBLIC_API_URL` — gateway URL (e.g. `http://localhost:8082`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (test mode)
- Keycloak variables (`NEXT_PUBLIC_KEYCLOAK_URL`, etc.)

### Gateway (`services/gateway/.env`)

- `FRONTEND_URL` must include **all** allowed frontend origins (CSV format)
- example: `FRONTEND_URL=http://localhost:3000,http://localhost:3001`

### Tools

- Stripe CLI installed locally
- Services started through Makefile only

## Test Commands (dev)

### 1) Start required services

Payment depends on PostgreSQL (started automatically with the payment compose).  
Token credit requires adventure; authentication requires SSO (Keycloak).

```bash
make up SERVICE=sso ENV=dev
make up SERVICE=adventure ENV=dev
make up SERVICE=payment ENV=dev
make up SERVICE=gateway ENV=dev
make up SERVICE=web ENV=dev
```

### 2) Authenticate Stripe CLI

```bash
make stripe-login
```

### 3) Listen for Stripe webhooks

Recommended option (direct payment service debug):

```bash
WEBHOOK_FORWARD_URL=http://localhost:9003/stripe/webhook make stripe-listen
```

Gateway option (default):

```bash
make stripe-listen
```

> When forwarding through the gateway, the target is `http://localhost:8082/payment/stripe/webhook`.

### 4) Configure webhook secret

- Copy the `whsec_...` shown by Stripe CLI
- Update `STRIPE_WEBHOOK_SECRET` in `services/payment/.env`
- Restart payment service:

```bash
make restart SERVICE=payment ENV=dev
```

### 5) Run full flow from the web app

- Log in to the Chariot web app
- Open the shop (token purchase dialog) and select a pack
- Complete payment on the checkout page with a Stripe test card (e.g. `4242 4242 4242 4242`)
- Confirm you land on the checkout return page with a success message

## Expected Validation

- In payment logs (`make logs SERVICE=payment`):
  - webhook processed without `Stripe webhook request body is missing`
  - Stripe processing log present (`Stripe webhook handled in ... ms`)
  - fulfillment log for PaymentIntent (`Order fulfilled via PaymentIntent: ... tokens for user ...`)
- In adventure logs (if token credit fails, payment logs a warning):
  - token credit request received on `/user/internal/tokens`
- In frontend:
  - checkout return page shows success (`redirect_status=succeeded`)
  - token balance reflects the purchase after navigating to profile or refreshing user data

## Quick Troubleshooting

### Stripe CLI `api_key_expired` error

- Re-authenticate CLI:

```bash
make stripe-login
```

### `Stripe webhook request body is missing` error

- Verify services are running versions with `rawBody` support
- Restart gateway + payment:

```bash
make restart SERVICE=gateway ENV=dev
make restart SERVICE=payment ENV=dev
```

### Tokens not credited

- Verify webhook received `payment_intent.succeeded` (not only `checkout.session.completed`)
- Verify `ADVENTURE_SERVICE_URL` and `INTERNAL_SERVICE_SECRET` are set in payment `.env`
- Verify adventure service is running (`make up SERVICE=adventure ENV=dev`)

### Tokens not updated in UI

- The PaymentElement flow does not auto-refresh balance on the return page
- Navigate to profile or reload user data to see updated balance
- For legacy redirect checkout, verify redirect returns to `FRONTEND_URL/?payment=success`

### CORS error from frontend

- Verify frontend URL is included in gateway `FRONTEND_URL` (allowed origins)
- Restart gateway after changes:

```bash
make restart SERVICE=gateway ENV=dev
```

### `make stripe-trigger-checkout` has no effect on PaymentElement flow

- `stripe-trigger-checkout` fires a `checkout.session.completed` event (legacy flow only)
- The current web app requires a real `payment_intent.succeeded` event with `metadata.source = payment_element`
