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
import { UserService } from '@/resources/user/user.service';
import { IResponse } from '@/common/dtos/reponse.dto';
import { CheckoutDto } from '@/resources/stripe/dto/checkout.dto';
import { StripeProductWithPrices } from '@/resources/stripe/types/stripe.type';

@Injectable()
export class StripeService {
  constructor(
    private readonly userService: UserService,
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

      const start: number = Date.now();

      const product: StripeProductWithPrices =
        await this.findProductWithPriceById(packId);
      if (!product) {
        const errorMessage: string = `Stripe product with ID #${packId} not found`;
        this.logger.error(errorMessage, null, this.SERVICE_NAME);
        throw new BadRequestException(errorMessage);
      }

      this.logger.debug(
        `Showcase URL: ${process.env.SHOWCASE_URL}`,
        this.SERVICE_NAME,
      );

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
        // Redirection directe vers la home page
        success_url: `${process.env.FRONTEND_URL}/?payment=success`,
        cancel_url: `${process.env.SHOWCASE_URL}`,
        metadata: {
          userId,
          packId,
          tokenAmount: product.metadata?.token_number || '0',
        },
      });

      const end: number = Date.now();
      const message: string = `Stripe checkout session created in ${end - start} ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return { message, data: session.url };
    } catch (error) {
      const errorMessage: string = `Error creating Stripe checkout session: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<IResponse<boolean>> {
    try {
      const start: number = Date.now();
      const event: Stripe.Event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.fulfillOrder(session);
      } else {
        const message: string = `Unhandled Stripe event type: ${event.type}`;
        this.logger.warn(message, this.SERVICE_NAME);
      }

      const end: number = Date.now();
      const message: string = `Stripe webhook handled in ${end - start} ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return { message, data: true };
    } catch (error) {
      const errorMessage: string = `Error handling Stripe webhook: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new BadRequestException(errorMessage);
    }
  }

  private async findProductWithPriceById(
    productId: string,
  ): Promise<StripeProductWithPrices> {
    try {
      const products = await this.stripe.products.list({ active: true });
      const prices = await this.stripe.prices.list({ active: true });

      // Associer les prix à chaque produit
      const productsWithPrices: StripeProductWithPrices[] = products.data.map(
        (product) => ({
          ...product,
          prices: prices.data.filter((price) => price.product === product.id),
        }),
      );

      return (
        productsWithPrices.find((product) => product.id === productId) || null
      );
    } catch (error) {
      const errorMessage: string = `Error retrieving products and prices from Stripe: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new BadRequestException(errorMessage);
    }
  }

  async getAllProducts(): Promise<IResponse<StripeProductWithPrices[]>> {
    try {
      const start: number = Date.now();

      const products = await this.stripe.products.list({ active: true });
      const prices = await this.stripe.prices.list({ active: true });

      // Associer les prix à chaque produit
      const productsWithPrices: StripeProductWithPrices[] = products.data.map(
        (product) => ({
          ...product,
          prices: prices.data.filter((price) => price.product === product.id),
        }),
      );

      const end: number = Date.now();
      const message: string = `Stripe products fetched in ${end - start} ms`;
      this.logger.verbose(message, this.SERVICE_NAME);

      return { message, data: productsWithPrices };
    } catch (error) {
      const errorMessage: string = `Error retrieving products and prices from Stripe: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new BadRequestException(errorMessage);
    }
  }

  private async fulfillOrder(session: Stripe.Checkout.Session) {
    try {
      if (!session.metadata) {
        const errorMessage: string =
          'Webhook metadata required to fulfill order';
        this.logger.error(errorMessage, null, this.SERVICE_NAME);
        throw new BadRequestException(errorMessage);
      }

      const { userId, tokenAmount } = session.metadata as Record<
        string,
        string
      >;
      const tokenAmountPerPack = parseInt(tokenAmount, 10);
      if (Number.isNaN(tokenAmountPerPack)) {
        const errorMessage: string = `Invalid token amount in webhook metadata: ${tokenAmount}`;
        this.logger.error(errorMessage, null, this.SERVICE_NAME);
        throw new BadRequestException(errorMessage);
      }

      const purchasedQuantity = await this.getPurchasedQuantity(session);
      const totalTokens = tokenAmountPerPack * purchasedQuantity;
      await this.userService.addTokens(userId, totalTokens);

      this.stripePaymentsCounter.inc({ status: 'success' });

      await this.notifyPaymentService(session, userId);
    } catch (error) {
      this.stripePaymentsCounter.inc({ status: 'failed' });
      const errorMessage: string = `Error fulfilling order: ${error.message}`;
      this.logger.error(errorMessage, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  private async notifyPaymentService(
    session: Stripe.Checkout.Session,
    userId: string,
  ): Promise<void> {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL;
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

    if (!paymentServiceUrl || !internalSecret) {
      this.logger.warn(
        'PAYMENT_SERVICE_URL or INTERNAL_SERVICE_SECRET not set — skipping payment record creation',
        this.SERVICE_NAME,
      );
      return;
    }

    try {
      await axios.post(
        `${paymentServiceUrl}/internal/payments/complete`,
        {
          userId,
          amount: session.amount_total ?? 0,
          currency: session.currency ?? 'eur',
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : null,
        },
        {
          headers: { 'x-internal-service-secret': internalSecret },
          timeout: 5000,
        },
      );

      this.logger.verbose(
        `Payment record created in payment service for session ${session.id}`,
        this.SERVICE_NAME,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify payment service for session ${session.id}: ${error.message}`,
        null,
        this.SERVICE_NAME,
      );
      // Non-blocking: token credit already done, just log the failure
    }
  }

  private async getPurchasedQuantity(
    session: Stripe.Checkout.Session,
  ): Promise<number> {
    if (!session.id) {
      return 1;
    }

    const lineItems = await this.stripe.checkout.sessions.listLineItems(
      session.id,
      {
        limit: 100,
      },
    );

    const quantity = lineItems.data.reduce(
      (total, lineItem) => total + (lineItem.quantity || 0),
      0,
    );
    return quantity > 0 ? quantity : 1;
  }
}
