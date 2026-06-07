/** Stripe minimum charge amounts in the smallest currency unit (centimes for EUR). */
export const STRIPE_MINIMUM_CHARGE_AMOUNT: Readonly<Record<string, number>> = {
    eur: 50,
    usd: 50,
    gbp: 30,
};

export function getStripeMinimumChargeAmount(currency: string): number {
    return STRIPE_MINIMUM_CHARGE_AMOUNT[currency.toLowerCase()] ?? 50;
}

export interface ResolvedChargeAmount {
    /** Amount that can be charged through Stripe (0 when below minimum). */
    chargeableAmount: number;
    /** Remainder waived as a complimentary "Cadeau" when below Stripe minimum. */
    giftAmount: number;
}

/**
 * Splits a discounted amount into a Stripe-chargeable portion and an optional gift waiver.
 * When the discounted amount is positive but below the Stripe minimum, the full remainder
 * becomes a gift so the order can be fulfilled without a card payment.
 */
export function resolveChargeableAmount(
    discountedAmount: number,
    currency: string,
): ResolvedChargeAmount {
    if (discountedAmount <= 0) {
        return { chargeableAmount: 0, giftAmount: 0 };
    }

    const minimum = getStripeMinimumChargeAmount(currency);
    if (discountedAmount < minimum) {
        return { chargeableAmount: 0, giftAmount: discountedAmount };
    }

    return { chargeableAmount: discountedAmount, giftAmount: 0 };
}

export function isStripeFreeOrder(chargeableAmount: number): boolean {
    return chargeableAmount === 0;
}
