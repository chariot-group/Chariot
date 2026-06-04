# Stripe in Development (Checkout + Webhook)

This document explains the Stripe flow in Chariot and how to test it locally.

## Goal

- Describe the full flow between the frontend, the gateway, and the payment service
- Provide a testing procedure for the `dev` environment
- Clarify that the frontend triggering checkout is **the Chariot web app** (not the showcase)

## Architecture

Stripe is handled exclusively by the **payment service** (`services/payment`), which runs on port `9003`.  
The gateway proxies `/payment/*` routes to this service.

```
Frontend → Gateway (/api/payment/stripe/...) → Payment service (port 9003) → Stripe
```

## Functional Flow

### 1) Frontend → checkout

Two checkout modes are available:

**Standard checkout (redirect)**:
- The frontend calls `POST /api/payment/stripe/checkout`
- The gateway proxies to payment service (`POST /payment/stripe/checkout`)
- Payment service creates a Stripe session and returns the checkout URL
- User is redirected to Stripe-hosted checkout page

**Embedded checkout (in-app)**:
- The frontend calls `POST /api/payment/stripe/checkout/embedded`
- Payment service creates an embedded session and returns a `clientSecret`
- Checkout is rendered directly within the Chariot app

**PaymentIntent flow (single-page element)**:
- The frontend calls `POST /api/payment/stripe/payment-intent` to create a PaymentIntent
- Amount can be updated with `PATCH /api/payment/stripe/payment-intent/:id` (quantity or promo code change)

### 2) Discount resolution

Before creating any checkout session, the payment service resolves discounts in this order:

1. **Affiliation code** (`affiliationCode` in body) — applied first
2. **Promo code** (`promoCode` in body) — applied on top of affiliation discount
3. **Referral discount** — applied automatically **only when no promo or affiliation code is provided**  
   (see FR-011 for referral system rules)

### 3) Stripe payment → webhook

- Stripe calls the webhook at `POST /payment/stripe/webhook` (through gateway: `/api/payment/stripe/webhook`)
- The webhook endpoint is public but validated with Stripe signature (`stripe-signature`)
- Payment service processes `checkout.session.completed` and credits user tokens
- Post-payment side effects: referral discount marked as used, referee's first purchase validated

### 4) User return flow

- After payment, Stripe redirects to the Chariot frontend (`FRONTEND_URL`)
- The frontend displays a token reload confirmation toast
- Then it redirects using post-login logic (first character found, otherwise welcome)

## Available Endpoints (via gateway)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/payment/stripe/payment-intent` | Required | Create a PaymentIntent |
| `PATCH` | `/api/payment/stripe/payment-intent/:id` | Required | Update a PaymentIntent |
| `POST` | `/api/payment/stripe/checkout` | Required | Create a standard checkout session |
| `POST` | `/api/payment/stripe/checkout/embedded` | Required | Create an embedded checkout session |
| `GET` | `/api/payment/stripe/checkout/status/:sessionId` | Required | Get checkout session status |
| `POST` | `/api/payment/stripe/webhook` | Public (Stripe sig) | Stripe webhook handler |
| `GET` | `/api/payment/stripe/products` | Public | List active Stripe products |
| `GET` | `/api/payment/stripe/resolve-code/:code` | Required | Resolve a promo or affiliation code |

## Related Functional Rules

- Reference: `FR-011` in `docs/functional-rules.md`
- Checkout requires authentication (user from Keycloak context)
- Webhook is public + Stripe signature validation is mandatory
- Referral discount rules defined in `FR-011`

## Dev Prerequisites

- Environment variables configured in `services/payment/.env`:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `FRONTEND_URL`
  - `SHOWCASE_URL`
  - `PAYMENT_DATABASE_URL` (PostgreSQL on port 5434)
- Environment variables configured in `services/gateway` for CORS:
  - `FRONTEND_URL` must include **all** allowed frontend origins (CSV format)
  - example: `FRONTEND_URL=http://localhost:3000,http://localhost:3001`
- Stripe CLI installed locally
- Services started through Makefile only

## Test Commands (dev)

### 1) Start required services

```bash
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
WEBHOOK_FORWARD_URL=http://localhost:9003/payment/stripe/webhook make stripe-listen
```

Gateway option:

```bash
make stripe-listen
```

### 4) Configure webhook secret

- Copy the `whsec_...` shown by Stripe CLI
- Update `STRIPE_WEBHOOK_SECRET` in `services/payment/.env`
- Restart payment service:

```bash
make restart SERVICE=payment ENV=dev
```

### 5) Run full flow from the web app

- From the Chariot web app, navigate to the token purchase page
- Select a pack and optionally enter a promo or affiliation code
- Complete payment with a Stripe test card (e.g. `4242 4242 4242 4242`)

## Expected Validation

- In payment logs (`make logs SERVICE=payment`):
  - webhook processed without `Stripe webhook request body is missing`
  - Stripe processing log present (`Stripe webhook handled in ... ms`)
- In frontend:
  - confirmation toast after payment return
  - token balance updated without logout/login

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

### Tokens not updated in UI

- Verify webhook received `checkout.session.completed`
- Verify redirect returns to expected frontend URL (`FRONTEND_URL`)

### CORS error from frontend

- Verify frontend URL is included in gateway `FRONTEND_URL` (allowed origins)
- Restart gateway after changes:

```bash
make restart SERVICE=gateway ENV=dev
```
