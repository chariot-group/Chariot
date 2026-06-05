import type { ResolvedCode } from "@/services/PaymentService";

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
