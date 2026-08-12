import {
    Injectable,
    BadRequestException,
    Logger,
    InternalServerErrorException,
    NotFoundException,
    GoneException,
    UnprocessableEntityException,
} from '@nestjs/common';
import Stripe from 'stripe';
import axios from 'axios';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { PaymentService } from '@/resources/payment/payment.service';
import { PromoCodeService } from '@/resources/promo-code/promo-code.service';
import { AffiliationService } from '@/resources/affiliation/affiliation.service';
import { ReferralService } from '@/resources/referral/referral.service';
import { IResponse } from '@/common/dtos/response.dto';
import { CheckoutDto } from '@/resources/stripe/dto/checkout.dto';
import { UpdatePaymentIntentDto } from '@/resources/stripe/dto/update-payment-intent.dto';
import { EmbeddedCheckoutDto } from '@/resources/stripe/dto/embedded-checkout.dto';
import {
    CheckoutSessionStatus,
    EmbeddedCheckoutResult,
    FreeOrderResult,
    PaymentIntentResult,
    ResolvedCode,
    StripeProductWithPrices,
} from '@/resources/stripe/types/stripe.type';
import {
    isStripeFreeOrder,
    resolveChargeableAmount,
} from '@/resources/stripe/stripe-charge.utils';
import {
    calculateAffiliationDiscount,
    calculateDiscount,
} from '@/resources/payment/PaymentCalculationService';
import { randomUUID } from 'crypto';

@Injectable()
export class StripeService {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly promoCodeService: PromoCodeService,
        private readonly affiliationService: AffiliationService,
        private readonly referralService: ReferralService,
        @InjectMetric('chariot_stripe_payments_total')
        private readonly stripePaymentsCounter: Counter,
        @InjectMetric('chariot_stripe_webhooks_total')
        private readonly stripeWebhooksCounter: Counter,
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
            const { displayName } = dto;
            const start = Date.now();

            const {
                product,
                originalUnitAmount,
                chargeableOrderAmount,
                giftOrderAmount,
                totalDiscountAmount,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = await this.computeDiscount(dto, userId);

            if (isStripeFreeOrder(chargeableOrderAmount)) {
                throw new BadRequestException(
                    'Cette commande ne peut pas être payée via Stripe Checkout. Utilisez le flux de commande gratuite.',
                );
            }

            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        adjustable_quantity: { enabled: true, minimum: 1 },
                        price_data: {
                            currency: product.prices[0].currency,
                            product_data: {
                                name: `${displayName} (${product.metadata?.token_number || '0'} chars)`,
                            },
                            unit_amount: chargeableOrderAmount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/?payment=success`,
                cancel_url: `${process.env.SHOWCASE_URL}`,
                metadata: {
                    userId,
                    packId: dto.packId,
                    tokenAmount: product.metadata?.token_number || '0',
                    originalUnitAmount: String(originalUnitAmount),
                    discountAmountPerUnit: String(totalDiscountAmount + giftOrderAmount),
                    ...(promoCodeId && { promoCode: dto.promoCode!, promoCodeId }),
                    ...(affiliationId && { affiliationCode: dto.affiliationCode!, affiliationId }),
                    ...(referralId && { referralId, referralDiscountType, referralDiscountPercent: String(referralDiscountPercent) }),
                },
            });

            const message = `Stripe checkout session created in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: session.url };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            const errorMessage = `Error creating Stripe checkout session: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Private helper: shared discount/product resolution logic
    // ──────────────────────────────────────────────────────────────────────────────

    private async computeDiscount(dto: CheckoutDto, userId: string): Promise<{
        product: StripeProductWithPrices;
        currency: string;
        quantity: number;
        originalUnitAmount: number;
        originalOrderAmount: number;
        chargeableOrderAmount: number;
        giftOrderAmount: number;
        totalDiscountAmount: number;
        promoCodeId?: string;
        affiliationId?: string;
        referralId?: string;
        referralDiscountType?: 'referee' | 'referrer';
        referralDiscountPercent?: number;
    }> {
        const { packId, promoCode, affiliationCode } = dto;
        const quantity = Math.max(1, dto.quantity ?? 1);

        const product = await this.findProductWithPriceById(packId);
        if (!product) {
            const errorMessage = `Stripe product with ID #${packId} not found`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new BadRequestException(errorMessage);
        }

        const originalUnitAmount = product.prices[0].unit_amount!;
        const originalOrderAmount = originalUnitAmount * quantity;
        let totalDiscountAmount = 0;
        let affiliationDiscountTotal = 0;
        let promoCodeId: string | undefined;
        let affiliationId: string | undefined;
        let referralId: string | undefined;
        let referralDiscountType: 'referee' | 'referrer' | undefined;
        let referralDiscountPercent: number | undefined;

        if (affiliationCode) {
            const affiliationResult = await this.affiliationService.findByCode(affiliationCode);
            const affiliation = affiliationResult.data;

            if (!affiliation.isActive) {
                throw new BadRequestException(
                    `Le code d'affiliation '${affiliationCode}' est désactivé`,
                );
            }

            affiliationDiscountTotal = calculateAffiliationDiscount(
                originalOrderAmount,
                affiliation.userDiscountPercent,
            );
            totalDiscountAmount += affiliationDiscountTotal;
            affiliationId = affiliation.id;
        }

        if (promoCode) {
            const isFirstOrder = !(await this.paymentService.hasCompletedPayment(userId));
            const promoResult = await this.promoCodeService.validate(
                promoCode,
                userId,
                originalOrderAmount,
                isFirstOrder,
            );
            const promo = promoResult.data;
            const amountAfterAffiliation = originalOrderAmount - affiliationDiscountTotal;

            totalDiscountAmount += calculateDiscount(
                amountAfterAffiliation,
                promo.discountType,
                promo.discountValue,
            );

            promoCodeId = promo.id;
        }

        // Referral discount applies automatically only when no promo/affiliation code is used
        if (!promoCodeId && !affiliationId) {
            const referralDiscount = await this.referralService.checkUserReferralDiscount(userId);
            if (referralDiscount) {
                totalDiscountAmount += calculateAffiliationDiscount(
                    originalOrderAmount,
                    referralDiscount.discountPercent,
                );
                referralId = referralDiscount.referralId;
                referralDiscountType = referralDiscount.discountType;
                referralDiscountPercent = referralDiscount.discountPercent;
            }
        }

        const currency = product.prices[0].currency;
        const discountedOrderAmount = Math.max(0, originalOrderAmount - totalDiscountAmount);
        const { chargeableAmount, giftAmount } = resolveChargeableAmount(
            discountedOrderAmount,
            currency,
        );

        return {
            product,
            currency,
            quantity,
            originalUnitAmount,
            originalOrderAmount,
            chargeableOrderAmount: chargeableAmount,
            giftOrderAmount: giftAmount,
            totalDiscountAmount,
            promoCodeId,
            affiliationId,
            referralId,
            referralDiscountType,
            referralDiscountPercent,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Embedded checkout (CHARIOT-hosted checkout page)
    // ──────────────────────────────────────────────────────────────────────────────

    async createEmbeddedCheckoutSession(
        dto: EmbeddedCheckoutDto,
        userId: string,
    ): Promise<IResponse<EmbeddedCheckoutResult>> {
        try {
            const { packId, displayName, promoCode, affiliationCode, locale = 'fr' } = dto;
            const start = Date.now();

            const {
                product,
                originalUnitAmount,
                chargeableOrderAmount,
                giftOrderAmount,
                totalDiscountAmount,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = await this.computeDiscount(dto, userId);

            if (isStripeFreeOrder(chargeableOrderAmount)) {
                throw new BadRequestException(
                    'Cette commande ne peut pas être payée via Stripe Checkout. Utilisez le flux de commande gratuite.',
                );
            }

            const returnUrl = `${process.env.FRONTEND_URL}/${locale}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

            const session = await this.stripe.checkout.sessions.create({
                ui_mode: 'embedded',
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
                            unit_amount: chargeableOrderAmount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                return_url: returnUrl,
                metadata: {
                    userId,
                    packId,
                    tokenAmount: product.metadata?.token_number || '0',
                    originalUnitAmount: String(originalUnitAmount),
                    discountAmountPerUnit: String(totalDiscountAmount + giftOrderAmount),
                    ...(promoCodeId && { promoCode, promoCodeId }),
                    ...(affiliationId && { affiliationCode, affiliationId }),
                    ...(referralId && { referralId, referralDiscountType, referralDiscountPercent: String(referralDiscountPercent) }),
                },
            });

            if (!session.client_secret) {
                throw new InternalServerErrorException('Stripe session client_secret is missing');
            }

            const message = `Embedded checkout session created in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: { clientSecret: session.client_secret } };
        } catch (error) {
            const errorMessage = `Error creating embedded checkout session: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw error instanceof BadRequestException
                ? error
                : new InternalServerErrorException(errorMessage);
        }
    }

    async getCheckoutStatus(
        sessionId: string,
        userId: string,
    ): Promise<IResponse<CheckoutSessionStatus>> {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);

            if (session.metadata?.userId !== userId) {
                throw new BadRequestException('Cette session de paiement ne vous appartient pas');
            }

            const message = `Checkout status retrieved for session ${sessionId}`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return {
                message,
                data: {
                    status: (session.status ?? 'open') as CheckoutSessionStatus['status'],
                    paymentStatus: session.payment_status,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            const errorMessage = `Error retrieving checkout status: ${error.message}`;
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
            } else if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                if (paymentIntent.metadata?.source === 'payment_element') {
                    await this.fulfillPaymentIntentOrder(paymentIntent);
                }
            } else {
                this.logger.warn(
                    `Unhandled Stripe event type: ${event.type}`,
                    this.SERVICE_NAME,
                );
            }

            this.stripeWebhooksCounter.inc({
                status: 'success',
                event_type: event.type,
            });

            const message = `Stripe webhook handled in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: true };
        } catch (error) {
            this.stripeWebhooksCounter.inc({
                status: 'failed',
                event_type: 'unknown',
            });
            const errorMessage = `Error handling Stripe webhook: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new BadRequestException(errorMessage);
        }
    }

    async resolveCode(
        code: string,
        userId: string,
        orderAmount: number,
    ): Promise<IResponse<ResolvedCode>> {
        try {
            const start = Date.now();

            // Essayer d'abord en tant que code promo
            try {
                const promoResult = await this.promoCodeService.findByCode(code);
                const promo = promoResult.data;

                if (
                    promo.isActive &&
                    (!promo.expiresAt || new Date() < new Date(promo.expiresAt))
                ) {
                    if (
                        promo.maxTotalUses !== null &&
                        promo.currentTotalUses >= promo.maxTotalUses
                    ) {
                        throw new GoneException({
                            errorCode: 'PROMO_EXHAUSTED',
                            message: `Le code promo '${code}' a atteint son nombre maximum d'utilisations`,
                        });
                    }

                    const userUsageCount = await this.promoCodeService.countUsageForUser(
                        promo.id,
                        userId,
                    );
                    if (userUsageCount >= promo.maxUsesPerUser) {
                        throw new GoneException({
                            errorCode: 'PROMO_USER_LIMIT_REACHED',
                            message: `Vous avez déjà utilisé le code '${code}' le nombre maximum de fois autorisé`,
                        });
                    }

                    if (
                        promo.minOrderAmount !== null &&
                        orderAmount < promo.minOrderAmount
                    ) {
                        throw new UnprocessableEntityException({
                            errorCode: 'PROMO_MIN_ORDER',
                            minOrderAmount: promo.minOrderAmount,
                            message: `Le code promo '${code}' nécessite un panier minimum de ${(promo.minOrderAmount / 100).toFixed(2)}€`,
                        });
                    }

                    if (promo.isFirstOrderOnly) {
                        const isFirstOrder = !(await this.paymentService.hasCompletedPayment(userId));
                        if (!isFirstOrder) {
                            throw new UnprocessableEntityException({
                                errorCode: 'PROMO_FIRST_ORDER_ONLY',
                                message: `Le code promo '${code}' est réservé à la première commande`,
                            });
                        }
                    }

                    const message = `Code '${code}' resolved as promo in ${Date.now() - start}ms`;
                    this.logger.verbose(message, this.SERVICE_NAME);
                    return {
                        message,
                        data: {
                            type: 'promo',
                            discountType: promo.discountType as 'PERCENTAGE' | 'FIXED',
                            discountValue: promo.discountValue,
                        },
                    };
                }
            } catch (err) {
                if (err instanceof GoneException || err instanceof UnprocessableEntityException) throw err;
                // Pas un code promo, on essaie l'affiliation
            }

            // Essayer en tant que code d'affiliation
            try {
                const affiliationResult = await this.affiliationService.findByCode(code);
                const affiliation = affiliationResult.data;

                if (affiliation.isActive) {
                    const message = `Code '${code}' resolved as affiliation in ${Date.now() - start}ms`;
                    this.logger.verbose(message, this.SERVICE_NAME);
                    return {
                        message,
                        data: {
                            type: 'affiliation',
                            discountType: 'PERCENTAGE',
                            discountValue: affiliation.userDiscountPercent,
                        },
                    };
                }
            } catch {
                // Pas un code d'affiliation non plus
            }

            throw new NotFoundException(`Code '${code}' introuvable ou inactif`);
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof GoneException ||
                error instanceof UnprocessableEntityException
            ) throw error;
            const errorMessage = `Error resolving code '${code}': ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
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

    // ──────────────────────────────────────────────────────────────────────────────
    // PaymentElement flow (single-page checkout)
    // ──────────────────────────────────────────────────────────────────────────────

    async createPaymentIntent(
        dto: CheckoutDto,
        userId: string,
    ): Promise<IResponse<PaymentIntentResult>> {
        try {
            const start = Date.now();
            const result = await this.buildPaymentIntentResult(dto, userId);
            const message = `PaymentIntent created in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: result };
        } catch (error) {
            const errorMessage = `Error creating PaymentIntent: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw error instanceof BadRequestException
                ? error
                : new InternalServerErrorException(errorMessage);
        }
    }

    async updatePaymentIntent(
        piId: string,
        dto: UpdatePaymentIntentDto,
        userId: string,
    ): Promise<IResponse<PaymentIntentResult>> {
        try {
            const start = Date.now();

            const existingPI = await this.stripe.paymentIntents.retrieve(piId);

            if (existingPI.metadata?.userId !== userId) {
                throw new BadRequestException('Ce PaymentIntent ne vous appartient pas');
            }

            const packId = existingPI.metadata?.packId;
            if (!packId) {
                throw new BadRequestException('packId manquant dans les metadata du PaymentIntent');
            }

            const displayName = existingPI.metadata?.displayName ?? existingPI.description?.replace(/ \(.*$/, '') ?? '';

            const checkoutDto: CheckoutDto = {
                packId,
                displayName,
                promoCode: dto.promoCode,
                affiliationCode: dto.affiliationCode,
                quantity: dto.quantity,
            };

            if (existingPI.status === 'canceled') {
                const result = await this.buildPaymentIntentResult(checkoutDto, userId);
                const message = `PaymentIntent recreated in ${Date.now() - start} ms`;
                this.logger.verbose(message, this.SERVICE_NAME);
                return { message, data: result };
            }

            const {
                product,
                originalOrderAmount,
                chargeableOrderAmount,
                giftOrderAmount,
                totalDiscountAmount,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = await this.computeDiscount(checkoutDto, userId);

            const quantity = Math.max(1, dto.quantity ?? 1);
            const tokenAmountPerPack = parseInt(product.metadata?.token_number || '0', 10);
            const orderDiscountTotal = totalDiscountAmount + giftOrderAmount;

            if (isStripeFreeOrder(chargeableOrderAmount)) {
                await this.stripe.paymentIntents.cancel(piId);

                const message = `PaymentIntent ${piId} cancelled for free order in ${Date.now() - start} ms`;
                this.logger.verbose(message, this.SERVICE_NAME);
                return {
                    message,
                    data: {
                        isFreeOrder: true,
                        giftAmountPerUnit: giftOrderAmount,
                    },
                };
            }

            await this.stripe.paymentIntents.update(piId, {
                amount: chargeableOrderAmount,
                description: `${displayName} (${product.metadata?.token_number || '0'} chars) x${quantity}`,
                metadata: {
                    ...existingPI.metadata,
                    tokenAmount: String(tokenAmountPerPack * quantity),
                    originalUnitAmount: String(originalOrderAmount),
                    discountAmountPerUnit: String(orderDiscountTotal),
                    promoCode: promoCodeId ? (dto.promoCode ?? '') : '',
                    promoCodeId: promoCodeId ?? '',
                    affiliationCode: affiliationId ? (dto.affiliationCode ?? '') : '',
                    affiliationId: affiliationId ?? '',
                    referralId: referralId ?? '',
                    referralDiscountType: referralDiscountType ?? '',
                    referralDiscountPercent: referralId ? String(referralDiscountPercent) : '',
                },
            });

            if (!existingPI.client_secret) {
                throw new InternalServerErrorException('PaymentIntent client_secret is missing');
            }

            const message = `PaymentIntent ${piId} updated in ${Date.now() - start} ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return {
                message,
                data: {
                    isFreeOrder: false,
                    clientSecret: existingPI.client_secret,
                    paymentIntentId: piId,
                    giftAmountPerUnit: 0,
                },
            };
        } catch (error) {
            const errorMessage = `Error updating PaymentIntent: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw error instanceof BadRequestException
                ? error
                : new InternalServerErrorException(errorMessage);
        }
    }

    async fulfillFreeOrder(
        dto: CheckoutDto,
        userId: string,
    ): Promise<IResponse<FreeOrderResult>> {
        try {
            const start = Date.now();
            const quantity = Math.max(1, dto.quantity ?? 1);

            const {
                product,
                currency,
                originalOrderAmount,
                chargeableOrderAmount,
                giftOrderAmount,
                totalDiscountAmount,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = await this.computeDiscount(dto, userId);

            if (!isStripeFreeOrder(chargeableOrderAmount)) {
                throw new BadRequestException(
                    'Cette commande nécessite un paiement par carte et ne peut pas être honorée gratuitement',
                );
            }

            const tokenAmountPerPack = parseInt(product.metadata?.token_number || '0', 10);
            const totalTokens = tokenAmountPerPack * quantity;
            const totalDiscountAmountWithGift = totalDiscountAmount + giftOrderAmount;
            const orderId = `free_${randomUUID()}`;

            await this.paymentService.createCompleted({
                userId,
                amount: originalOrderAmount,
                currency,
                stripeSessionId: orderId,
                tokenCount: totalTokens,
                discountAmount: totalDiscountAmountWithGift,
                ...(promoCodeId && { promoCodeId }),
                ...(affiliationId && { affiliationId }),
            });

            if (referralId && referralDiscountType && (referralDiscountType === 'referee' || referralDiscountType === 'referrer')) {
                await this.referralService.markReferralDiscountUsed(
                    userId,
                    referralId,
                    referralDiscountType,
                    orderId,
                    originalOrderAmount,
                    totalDiscountAmountWithGift,
                    parseInt(String(referralDiscountPercent ?? '0'), 10),
                );
            }

            await this.referralService.validateRefereeFirstPurchase(userId);
            await this.creditTokensToUser(userId, totalTokens, orderId);

            this.stripePaymentsCounter.inc({ status: 'success' });

            const message = `Free order fulfilled in ${Date.now() - start} ms`;
            this.logger.verbose(
                `Free order fulfilled: ${totalTokens} tokens for user ${userId}`,
                this.SERVICE_NAME,
            );
            return { message, data: { orderId } };
        } catch (error) {
            this.stripePaymentsCounter.inc({ status: 'failed' });
            if (error instanceof BadRequestException) throw error;
            const errorMessage = `Error fulfilling free order: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    private async buildPaymentIntentResult(
        dto: CheckoutDto,
        userId: string,
    ): Promise<PaymentIntentResult> {
        const { packId, displayName } = dto;
        const quantity = Math.max(1, dto.quantity ?? 1);

        const {
            product,
            originalOrderAmount,
            chargeableOrderAmount,
            giftOrderAmount,
            totalDiscountAmount,
            promoCodeId,
            affiliationId,
            referralId,
            referralDiscountType,
            referralDiscountPercent,
        } = await this.computeDiscount(dto, userId);

        if (isStripeFreeOrder(chargeableOrderAmount)) {
            return {
                isFreeOrder: true,
                giftAmountPerUnit: giftOrderAmount,
            };
        }

        const tokenAmountPerPack = parseInt(product.metadata?.token_number || '0', 10);
        const orderDiscountTotal = totalDiscountAmount + giftOrderAmount;

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: chargeableOrderAmount,
            currency: product.prices[0].currency,
            automatic_payment_methods: { enabled: true },
            description: `${displayName} (${product.metadata?.token_number || '0'} chars) x${quantity}`,
            metadata: {
                source: 'payment_element',
                userId,
                packId,
                displayName,
                tokenAmount: String(tokenAmountPerPack * quantity),
                originalUnitAmount: String(originalOrderAmount),
                discountAmountPerUnit: String(orderDiscountTotal),
                ...(promoCodeId && { promoCode: dto.promoCode!, promoCodeId }),
                ...(affiliationId && { affiliationCode: dto.affiliationCode!, affiliationId }),
                ...(referralId && { referralId, referralDiscountType, referralDiscountPercent: String(referralDiscountPercent) }),
            },
        });

        if (!paymentIntent.client_secret) {
            throw new InternalServerErrorException('PaymentIntent client_secret is missing');
        }

        return {
            isFreeOrder: false,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            giftAmountPerUnit: 0,
        };
    }

    private async fulfillPaymentIntentOrder(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        try {
            if (!paymentIntent.metadata) {
                throw new BadRequestException('Webhook metadata required to fulfill order');
            }

            const {
                userId,
                tokenAmount,
                originalUnitAmount,
                discountAmountPerUnit,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = paymentIntent.metadata as Record<string, string>;

            const tokenAmountPerPack = parseInt(tokenAmount, 10);
            if (Number.isNaN(tokenAmountPerPack)) {
                throw new BadRequestException(
                    `Invalid token amount in webhook metadata: ${tokenAmount}`,
                );
            }

            const originalTotal = parseInt(originalUnitAmount ?? '0', 10);
            const totalDiscountAmount = parseInt(discountAmountPerUnit ?? '0', 10);

            await this.paymentService.createCompleted({
                userId,
                amount: originalTotal || paymentIntent.amount,
                currency: paymentIntent.currency,
                stripeSessionId: paymentIntent.id,
                stripePaymentIntentId: paymentIntent.id,
                tokenCount: tokenAmountPerPack,
                ...(totalDiscountAmount > 0 && { discountAmount: totalDiscountAmount }),
                ...(promoCodeId && { promoCodeId }),
                ...(affiliationId && { affiliationId }),
            });

            // Mark referral discount as used if applicable
            if (referralId && referralDiscountType && (referralDiscountType === 'referee' || referralDiscountType === 'referrer')) {
                await this.referralService.markReferralDiscountUsed(
                    userId,
                    referralId,
                    referralDiscountType,
                    paymentIntent.id,
                    originalTotal || paymentIntent.amount,
                    totalDiscountAmount,
                    parseInt(referralDiscountPercent ?? '0', 10),
                );
            }

            // Validate filleul's first purchase → credit the parrain (idempotent)
            await this.referralService.validateRefereeFirstPurchase(userId);

            await this.creditTokensToUser(userId, tokenAmountPerPack, paymentIntent.id);

            this.stripePaymentsCounter.inc({ status: 'success' });
            this.logger.verbose(
                `Order fulfilled via PaymentIntent: ${tokenAmountPerPack} tokens for user ${userId}`,
                this.SERVICE_NAME,
            );
        } catch (error) {
            this.stripePaymentsCounter.inc({ status: 'failed' });
            const errorMessage = `Error fulfilling PaymentIntent order: ${error.message}`;
            this.logger.error(errorMessage, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    private async fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
        try {
            if (!session.metadata) {
                throw new BadRequestException('Webhook metadata required to fulfill order');
            }

            const {
                userId,
                tokenAmount,
                originalUnitAmount,
                discountAmountPerUnit,
                promoCodeId,
                affiliationId,
                referralId,
                referralDiscountType,
                referralDiscountPercent,
            } = session.metadata as Record<string, string>;

            const tokenAmountPerPack = parseInt(tokenAmount, 10);
            if (Number.isNaN(tokenAmountPerPack)) {
                throw new BadRequestException(
                    `Invalid token amount in webhook metadata: ${tokenAmount}`,
                );
            }

            const purchasedQuantity = await this.getPurchasedQuantity(session);
            const totalTokens = tokenAmountPerPack * purchasedQuantity;

            const originalTotal = parseInt(originalUnitAmount ?? '0', 10) * purchasedQuantity;
            const totalDiscountAmount = parseInt(discountAmountPerUnit ?? '0', 10) * purchasedQuantity;

            // 1. Record the payment in this service's database
            await this.paymentService.createCompleted({
                userId,
                amount: originalTotal || (session.amount_total ?? 0),
                currency: session.currency ?? 'eur',
                stripeSessionId: session.id,
                stripePaymentIntentId:
                    typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : null,
                tokenCount: totalTokens,
                ...(totalDiscountAmount > 0 && { discountAmount: totalDiscountAmount }),
                ...(promoCodeId && { promoCodeId }),
                ...(affiliationId && { affiliationId }),
            });

            // Mark referral discount as used if applicable
            if (referralId && referralDiscountType && (referralDiscountType === 'referee' || referralDiscountType === 'referrer')) {
                await this.referralService.markReferralDiscountUsed(
                    userId,
                    referralId,
                    referralDiscountType,
                    session.id,
                    originalTotal || (session.amount_total ?? 0),
                    totalDiscountAmount,
                    parseInt(referralDiscountPercent ?? '0', 10),
                );
            }

            // Validate filleul's first purchase → credit the parrain (idempotent)
            await this.referralService.validateRefereeFirstPurchase(userId);

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
