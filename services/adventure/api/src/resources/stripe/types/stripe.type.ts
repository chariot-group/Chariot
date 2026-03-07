import Stripe from "stripe";

export interface StripeProductWithPrices extends Stripe.Product {
    prices: Stripe.Price[];
}