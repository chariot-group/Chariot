import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { UserService } from '@/resources/user/user.service';
import { generateRandomPassword } from '@/utils/utils.tools';

@Injectable()
export class StripeService {

    constructor(
        private readonly userService: UserService,
    ) { }

    private readonly SERVICE_NAME = StripeService.name;
    private readonly logger = new Logger(this.SERVICE_NAME);

    private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-05-28.basil',
    });

    /**
   * Vérifie la signature Stripe du webhook entrant.
   */
    verifySignature(payload: Buffer, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    }

    /**
   * Gère les événements reçus depuis Stripe.
   */
    async handleEvent(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed':
                return this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);

            case 'customer.subscription.updated':
                return this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

            default:
                this.logger.error(`📦 Event non géré : ${event.type}`, null, this.SERVICE_NAME);
        }
    }

    /**
   * Gère l'événement `checkout.session.completed`.
   * Crée l'utilisateur s'il n'existe pas et ajoute un abonnement dans son historique.
   */
    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        if (session.mode !== 'subscription') return;

        const customerId: string = session.customer as string;
        const subscriptionId: string = session.subscription as string;

        // Récupération du client Stripe
        const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;

        // Recherche ou création de l'utilisateur via l'email du client
        let user = await this.userService.findByEmail(customer.email);
        if (!user) {
            let name = customer.name;
            // Récupération du champ personnalisé s'il existe (ex: nom choisi en frontend)
            if (session.custom_fields && session.custom_fields.length > 0) {
                name = session.custom_fields[0].text.value;
            }

            // Création de l'utilisateur
            user = await this.userService.create({
                email: customer.email,
                username: name,
                campaigns: [],
                password: generateRandomPassword(),
            }).then((user) => user.data);

            this.logger.log(`👤 Nouvel utilisateur créé depuis Stripe : ${user.email}`, this.SERVICE_NAME);
        }

        // Récupération de l'abonnement
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const item = subscription.items.data[0];

        // Ajout de l'abonnement à l'historique
        user.subscriptions.push({
            id: subscription.id,
            productId: item.price.product as string,
            priceId: item.price.id,
            started_at: new Date(item.current_period_start * 1000),
            expired_at: new Date(item.current_period_end * 1000),
        });

        this.logger.log(`📦 Abonnement ajouté à ${user.email} : ${subscription.id}`, this.SERVICE_NAME);

        await user.save();
    }

    /**
     * Gère l'événement `customer.subscription.updated`.
     * Met à jour la date d'expiration si même abonnement, ou ajoute un nouvel abonnement dans l'historique.
     */
    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        const customerId: string = subscription.customer as string;

        // Récupération du client + de l'utilisateur
        const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
        const user = await this.userService.findByEmail(customer.email);
        if (!user) {
            this.logger.error(`Utilisateur introuvable pour ${customer.email}`, null, this.SERVICE_NAME);
            return;
        }

        const item = subscription.items.data[0];
        const newSubId = subscription.id;
        const newProductId = item.price.product as string;
        const newPriceId = item.price.id;
        const startedAt = new Date(item.current_period_start * 1000);
        const expiredAt = new Date(item.current_period_end * 1000);

        // Récupère tous les abonnements encore actifs
        const now = new Date();
        const activeSubscriptions = user.subscriptions.filter((s) => s.expired_at > now);

        // On cherche s'il y a un abonnement actif avec une offre différente
        const conflictingActive = activeSubscriptions.find(
            (s) => s.productId !== newProductId || s.priceId !== newPriceId,
        );

        // On cherche s’il y a un abonnement actif avec la même offre (productId + priceId)
        const matchingActive = activeSubscriptions.find(
            (s) => s.productId === newProductId && s.priceId === newPriceId,
        );

        if (matchingActive) {
            // 🔁 Même offre encore active → on met juste à jour la date de fin
            matchingActive.expired_at = expiredAt;

            this.logger.log(
                `📦 Prolongation de l'abonnement actif : ${newSubId} → ${expiredAt.toISOString()}`,
                this.SERVICE_NAME,
            );
        } else {
            if (conflictingActive) {
                // 🔁 Offre différente encore active → on clôture immédiatement
                conflictingActive.expired_at = now;

                this.logger.log(
                    `🔁 Changement d'offre détecté. Ancienne offre (${conflictingActive.priceId}) clôturée.`,
                    this.SERVICE_NAME,
                );
            }

            // ➕ Ajoute une nouvelle entrée, même si c'est une ancienne offre
            user.subscriptions.push({
                id: newSubId,
                productId: newProductId,
                priceId: newPriceId,
                started_at: startedAt,
                expired_at: expiredAt,
            });

            this.logger.log(
                `📦 Nouvelle souscription enregistrée pour ${user.email} : ${newSubId}`,
                this.SERVICE_NAME,
            );
        }

        await user.save();
    }
}