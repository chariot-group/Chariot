import Stripe from 'stripe';

export interface StripeProductWithPrices extends Stripe.Product {
    prices: Stripe.Price[];
}

export interface ResolvedCode {
    type: 'promo' | 'affiliation';
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
}

export interface CheckoutSessionStatus {
    status: 'complete' | 'expired' | 'open';
    paymentStatus: string;
}

export interface EmbeddedCheckoutResult {
    clientSecret: string;
}

export interface PaymentIntentResult {
    clientSecret: string;
    paymentIntentId: string;
}
