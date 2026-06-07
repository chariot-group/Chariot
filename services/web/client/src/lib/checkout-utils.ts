import type { ResolvedCode } from "@/services/PaymentService";

/** Stripe minimum charge amounts in the smallest currency unit (centimes for EUR). */
const STRIPE_MINIMUM_CHARGE_AMOUNT: Record<string, number> = {
    eur: 50,
    usd: 50,
    gbp: 30,
};

export function formatPrice(amount: number, currency: string): string {
    return `${(amount / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`;
}

export function formatDiscount(resolved: ResolvedCode): string {
    if (resolved.discountType === "PERCENTAGE") return `-${resolved.discountValue} %`;
    return `-${(resolved.discountValue / 100).toFixed(2).replace(".", ",")} €`;
}

export function computeDiscountedAmount(originalAmount: number, resolved: ResolvedCode): number {
    if (resolved.discountType === "PERCENTAGE") {
        return Math.max(0, originalAmount - Math.floor((originalAmount * resolved.discountValue) / 100));
    }
    return Math.max(0, originalAmount - resolved.discountValue);
}

export function computeReferralDiscountedAmount(originalAmount: number, discountPercent: number): number {
    return Math.max(0, originalAmount - Math.floor((originalAmount * discountPercent) / 100));
}

/**
 * Waives the remainder as a complimentary gift when below the Stripe minimum.
 */
export function computeGiftAmount(discountedAmount: number, currency: string): number {
    if (discountedAmount <= 0) return 0;
    const minimum = STRIPE_MINIMUM_CHARGE_AMOUNT[currency.toLowerCase()] ?? 50;
    if (discountedAmount < minimum) return discountedAmount;
    return 0;
}

export function isFreeCheckout(chargeableAmountPerUnit: number): boolean {
    return chargeableAmountPerUnit === 0;
}
