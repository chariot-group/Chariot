# � Test Stripe service locally

This guide explains how to test the Stripe integration (Checkout + Webhooks) locally with NestJS, while avoiding polluting the Stripe account.

---

## 🔧 1. Install and configure Stripe CLI

Stripe CLI lets you listen to Webhook events locally.

### Installation

See the official docs: [Stripe CLI install](https://stripe.com/docs/stripe-cli#install)

### Log in to your Stripe account

```bash
stripe login
```

### Start the Stripe listener

In a terminal (keep it open):

```bash
stripe listen --forward-to localhost:{ton port API externe}/stripe/webhook
```

This forwards all Stripe events to your local NestJS backend.

### Update the secrets

Replace the webhook secret in .env with the one printed by the previous command
(whsec_...)

---

## 🚀 3. Launch a Checkout session (custom script)

The project contains a script that creates a Checkout session with a `priceId` (already configured in the Stripe dashboard).

Run this script with:

```bash
npm run stripe:checkout
```

This script will:

- Create a Checkout session (subscription)
- Print a URL in the console

Example output:

```bash
👉 URL Checkout : https://checkout.stripe.com/c/pay/cs_test_1234abcd
```

---

## 🥺 4. Test with Checkout

1. Paste the URL in your browser
2. Make a payment with a test card: `4242 4242 4242 4242`
3. Stripe will automatically trigger:
   - `checkout.session.completed`
   - `customer.subscription.updated`

These events will be captured by Stripe CLI and forwarded to your server via `/webhook/stripe`.

---

## 🧰 Tips

To create a subscription:
1. On the checkout page, fill in the requested info (to test properly, make sure you can access the email)

To modify a subscription:
1. On the checkout page, use the same email as before.
2. The page will tell you that you already have a subscription. Follow the steps.
3. Once logged in, you can change plans.

---

## ✅ Expected result

In your database (collection `users`), you should see:

- A user created automatically from the Stripe email and provided nickname
- A subscription stored in `subscriptions[]` (with `productId`, `priceId`, `started_at`, `expired_at`)
- The full history if the user changes plan later

---

## 📁 Useful files

- `.env.example`: add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- `scripts/createCheckout.ts`: script used by `npm run stripe:checkout`
- `stripe.service.ts`: main logic handling the webhooks

---

🎉 You're ready to test Stripe Checkout locally like in production!

