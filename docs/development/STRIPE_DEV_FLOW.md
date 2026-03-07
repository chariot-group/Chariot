# Stripe in Development (Checkout + Webhook)

This document explains the Stripe flow in Chariot and how to test it locally.

## Goal

- Describe the full flow between the frontend, the gateway, and the adventure service
- Provide a testing procedure for the `dev` environment
- Clarify that the frontend triggering checkout is **the showcase website**

## Functional Flow

### 1) Showcase frontend → checkout

- Stripe checkout is triggered from **the showcase website** (frontend)
- The frontend calls the gateway at `POST /api/stripe/checkout`
- The gateway proxies to adventure (`POST /stripe/checkout`)
- Adventure creates the Stripe session and returns the checkout URL

### 2) Stripe payment → webhook

- Stripe calls the webhook at `POST /stripe/webhook` (locally through gateway: `/api/stripe/webhook`)
- The webhook endpoint is public but validated with Stripe signature (`stripe-signature`)
- Adventure processes `checkout.session.completed` and credits user tokens

### 3) User return flow

- After payment, Stripe redirects to the Chariot frontend (`FRONTEND_URL`)
- The frontend displays a token reload confirmation toast
- Then it redirects using post-login logic (first character found, otherwise welcome)

## Related Functional Rules

- Reference: `FR-011` in `docs/functional-rules.md`
- Checkout requires authentication (user from Keycloak context)
- Webhook is public + Stripe signature validation is mandatory

## Dev Prerequisites

- Environment variables configured in `services/adventure/.env`:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `FRONTEND_URL`
  - `SHOWCASE_URL`
- Environment variables configured in `services/gateway` for CORS:
  - `FRONTEND_URL` must include **all** allowed frontend origins (CSV format)
  - the showcase website URL must be included
  - example: `FRONTEND_URL=http://localhost:3000,http://localhost:3001`
- Stripe CLI installed locally
- Services started through Makefile only

## Test Commands (dev)

### 1) Start required services

```bash
make up SERVICE=adventure ENV=dev
make up SERVICE=gateway ENV=dev
make up SERVICE=web ENV=dev
```

### 2) Authenticate Stripe CLI

```bash
make stripe-login
```

### 3) Listen for Stripe webhooks

Recommended option (direct adventure debug):

```bash
WEBHOOK_FORWARD_URL=http://localhost:9000/stripe/webhook make stripe-listen
```

Gateway option:

```bash
make stripe-listen
```

### 4) Configure webhook secret

- Copy the `whsec_...` shown by Stripe CLI
- Update `STRIPE_WEBHOOK_SECRET` in `services/adventure/.env`
- Restart adventure:

```bash
make restart SERVICE=adventure ENV=dev
```

### 5) Run full flow from showcase website

- From the showcase website, start checkout
- On Stripe Checkout page, adjust quantity if needed
- Complete payment with a Stripe test card (e.g. `4242 4242 4242 4242`)

## Expected Validation

- In adventure logs (`make logs SERVICE=adventure`):
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
- Restart gateway + adventure:

```bash
make restart SERVICE=gateway ENV=dev
make restart SERVICE=adventure ENV=dev
```

### Tokens not updated in UI

- Verify webhook received `checkout.session.completed`
- Verify redirect returns to expected frontend URL (`FRONTEND_URL`)

### CORS error from showcase website

- Verify showcase website URL is included in gateway `FRONTEND_URL` (allowed origins)
- Restart gateway after changes:

```bash
make restart SERVICE=gateway ENV=dev
```
