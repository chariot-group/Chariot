import { DiscountType } from '@prisma/client';

export function calculateDiscount(amount: number, discountType: DiscountType, discountValue: number): number {
    if (discountType === DiscountType.PERCENTAGE) {
        return Math.floor((amount * discountValue) / 100);
    }

    // FIXED: la reduction ne peut pas depasser le montant total
    return Math.min(discountValue, amount);
}

export function calculateAffiliationDiscount(amount: number, userDiscountPercent: number): number {
    return Math.floor((amount * userDiscountPercent) / 100);
}

export function calculateCommissionAmount(finalAmount: number, creatorCommissionPercent: number): number {
    return Math.floor((finalAmount * creatorCommissionPercent) / 100);
}
