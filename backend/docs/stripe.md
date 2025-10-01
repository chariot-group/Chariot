# 🚪 Tester le service Stripe en local

Ce guide explique comment tester l’intégration Stripe (Checkout + Webhooks) en local avec NestJS, en évitant toute pollution sur le compte Stripe.

---

## 🔧 1. Installation et configuration de Stripe CLI

Stripe CLI permet d'écouter les événements Webhook localement.

### Installation

Voir la doc officielle : [Stripe CLI install](https://stripe.com/docs/stripe-cli#install)

### Connexion à ton compte Stripe

```bash
stripe login
```

### Lancement du listener Stripe

Dans un terminal (ne le ferme pas) :

```bash
stripe listen --forward-to localhost:{ton port API externe}/stripe/webhook
```

Cela permet de rediriger tous les événements Stripe vers ton backend local NestJS.

### Update les secrets

Changer la secret key du .env par celle donnée dans la commande précédente
(whsec_...)

---

## 🚀 3. Lancer une session Checkout (script personnalisé)

Le projet contient un script qui génère une session Checkout avec `priceId` (déjà présent dans le dashboard Stripe).

Lance ce script avec :

```bash
npm run stripe:checkout
```

Ce script va :

- Créer une session Checkout (abonnement)
- Retourner une URL dans la console

Exemple de sortie :

```bash
👉 URL Checkout : https://checkout.stripe.com/c/pay/cs_test_1234abcd
```

---

## 🥺 4. Tester avec Checkout

1. **Copie-colle l’URL** dans ton navigateur
2. Effectue un paiement avec une carte test : `4242 4242 4242 4242`
3. Stripe déclenchera automatiquement :
   - `checkout.session.completed`
   - `customer.subscription.updated`

Ces événements seront captés par Stripe CLI et transmis à ton serveur via `/webhook/stripe`.

---

## 🧰 Astuces

Pour créer un abonnement: 
1. Sur la page checkout, rempli les infos demandés (pour bien tester, il faut que tu aies accès à l'email)

Pour modifier un abonnement:
1. Sur la page checkout, met le même email que l'étape d'avant.
2. La page va changer en te disant que tu as déjà une abonnement. Suis les étapes.
3. Une fois connecté, tu peux changer d'offres

---

## ✅ Résultat attendu

Dans ta base de données (collection `users`), tu dois voir :

- Un utilisateur créé automatiquement à partir de l’email Stripe et du pseudo renseigné
- Un abonnement stocké dans `subscriptions[]` (avec `productId`, `priceId`, `started_at`, `expired_at`)
- L’historique complet si l’utilisateur change d’offre plus tard

---

## 📁 Fichiers utiles

- `.env.example` : ajoute `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`
- `scripts/createCheckout.ts` : script utilisé par `npm run stripe:checkout`
- `stripe.service.ts` : logique principale de traitement des webhooks

---

🎉 Tu es prêt à tester Stripe Checkout localement comme en production !

