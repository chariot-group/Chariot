import {
    Injectable,
    BadRequestException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import axios from 'axios';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { PaymentService } from '@/resources/payment/payment.service';
import { IResponse } from '@/common/dtos/response.dto';
import { CheckoutDto } from '@/resources/stripe/dto/checkout.dto';
import { StripeProductWithPrices } from '@/resources/stripe/types/stripe.type';

@Injectable()
export class StripeService {
    constructor(
        private readonly paymentService: PaymentService,
        @InjectMetric('chariot_stripe_payments_total')
        private readonly stripePaymentsCounter: Counter,
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-02-25.clover',
        });
    }

    private stripe: Stripe;
    private readonly SERVICE_NAME = StripeService.name;
    private readonly logger = new Logger(this.SERVICE_NAME);

    async createCheckoutSession(
        dto: CheckoutDto,
        userId: string,
    ): Promise<IResponse<string>> {
        try {
            const { packId, displayName } = dto;
            const start = Date.now();

            const product = await this.findProductWithPriceById(packId);
            if (!product) {
                const errorMessage = `Stripe product with ID #${packId} not found`;
                this.logger.error(errorMessage, null, this.SERVICE_NAME);
                throw new BadRequestException(errorMessage);
            }

            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        adjustable_quantity: {
                            enabled: true,
                            minimum: 1,
                        },
                        price_data: {
                            currency: product.prices[0].currency,
                            product_data: {
                                name: `${displayName} (${product.metadata?.token_number || '0'} chars)`,
                            },
                            unit_amount: product.prices[0].unit_amount!,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/?payment=success`,
                cancel_url: `${process.env.SHOWCASE_URL}`,
                metadata: {
                    userId,
                    packId,
                    tokenAmount: product.metadata?.token_number || '0',
                },
            });

            const message = `Stripe checkout session created in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: session.url };
        } catch (error) {
            const errorMessage = `Error creating Stripe checkout session: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    async handleWebhook(
        payload: Buffer,
        signature: string,
    ): Promise<IResponse<boolean>> {
        try {
            const start = Date.now();
            const event: Stripe.Event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!,
            );

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session;
                await this.fulfillOrder(session);
            } else {
                this.logger.warn(
                    `Unhandled Stripe event type: ${event.type}`,
                    this.SERVICE_NAME,
                );
            }

            const message = `Stripe webhook handled in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: true };
        } catch (error) {
            const errorMessage = `Error handling Stripe webhook: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new BadRequestException(errorMessage);
        }
    }

    async getAllProducts(): Promise<IResponse<StripeProductWithPrices[]>> {
        try {
            const start = Date.now();
            const products = await this.stripe.products.list({ active: true });
            const prices = await this.stripe.prices.list({ active: true });

            const productsWithPrices: StripeProductWithPrices[] = products.data.map(
                (product) => ({
                    ...product,
                    prices: prices.data.filter((price) => price.product === product.id),
                }),
            );

            const message = `Stripe products fetched in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: productsWithPrices };
        } catch (error) {
            const errorMessage = `Error retrieving products from Stripe: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new BadRequestException(errorMessage);
        }
    }

    private async findProductWithPriceById(
        productId: string,
    ): Promise<StripeProductWithPrices | null> {
        try {
            const products = await this.stripe.products.list({ active: true });
            const prices = await this.stripe.prices.list({ active: true });

            const productsWithPrices: StripeProductWithPrices[] = products.data.map(
                (product) => ({
                    ...product,
                    prices: prices.data.filter((price) => price.product === product.id),
                }),
            );

            return productsWithPrices.find((p) => p.id === productId) ?? null;
        } catch (error) {
            const errorMessage = `Error retrieving products from Stripe: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new BadRequestException(errorMessage);
        }
    }

    private async fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
        try {
            if (!session.metadata) {
                throw new BadRequestException('Webhook metadata required to fulfill order');
            }

            const { userId, tokenAmount } = session.metadata as Record<string, string>;
            const tokenAmountPerPack = parseInt(tokenAmount, 10);
            if (Number.isNaN(tokenAmountPerPack)) {
                throw new BadRequestException(
                    `Invalid token amount in webhook metadata: ${tokenAmount}`,
                );
            }

            const purchasedQuantity = await this.getPurchasedQuantity(session);
            const totalTokens = tokenAmountPerPack * purchasedQuantity;

            // 1. Record the payment in this service's database
            await this.paymentService.createCompleted({
                userId,
                amount: session.amount_total ?? 0,
                currency: session.currency ?? 'eur',
                stripeSessionId: session.id,
                stripePaymentIntentId:
                    typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : null,
                tokenCount: totalTokens,
            });

            // 2. Call adventure service to credit tokens to the user
            await this.creditTokensToUser(userId, totalTokens, session.id);

            this.stripePaymentsCounter.inc({ status: 'success' });
            this.logger.verbose(
                `Order fulfilled: ${totalTokens} tokens for user ${userId}`,
                this.SERVICE_NAME,
            );
        } catch (error) {
            this.stripePaymentsCounter.inc({ status: 'failed' });
            const errorMessage = `Error fulfilling order: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    private async creditTokensToUser(
        userId: string,
        amount: number,
        sessionId: string,
    ): Promise<void> {
        const adventureUrl = process.env.ADVENTURE_SERVICE_URL;
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

        if (!adventureUrl || !internalSecret) {
            this.logger.warn(
                'ADVENTURE_SERVICE_URL or INTERNAL_SERVICE_SECRET not set — skipping token credit',
                this.SERVICE_NAME,
            );
            return;
        }

        try {
            await axios.post(
                `${adventureUrl}/user/internal/tokens`,
                { userId, amount },
                {
                    headers: { 'x-internal-service-secret': internalSecret },
                    timeout: 5000,
                },
            );
            this.logger.verbose(
                `Credited ${amount} tokens for user ${userId} (session ${sessionId})`,
                this.SERVICE_NAME,
            );
        } catch (error) {
            this.logger.error(
                `Failed to credit tokens for user ${userId} (session ${sessionId}): ${error.message}`,
                null,
                this.SERVICE_NAME,
            );
            // Non-blocking: payment is already recorded, token credit failure is logged
        }
    }

    private async getPurchasedQuantity(session: Stripe.Checkout.Session): Promise<number> {
        if (!session.id) return 1;

        const lineItems = await this.stripe.checkout.sessions.listLineItems(session.id, {
            limit: 100,
        });

        const quantity = lineItems.data.reduce(
            (total, item) => total + (item.quantity || 0),
            0,
        );
        return quantity > 0 ? quantity : 1;
    }
}
