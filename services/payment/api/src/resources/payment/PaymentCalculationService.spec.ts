import { DiscountType } from '@prisma/client';
import {
    calculateAffiliationDiscount,
    calculateDiscount,
} from '@/resources/payment/PaymentCalculationService';

describe('PaymentCalculationService', () => {
    describe('calculateDiscount', () => {
        it('applies a fixed discount once on the order amount (nominal)', () => {
            expect(calculateDiscount(3000, DiscountType.FIXED, 200)).toBe(200);
        });

        it('applies a percentage discount on the order amount (nominal)', () => {
            expect(calculateDiscount(3000, DiscountType.PERCENTAGE, 10)).toBe(300);
        });

        it('caps fixed discount at order amount (edge)', () => {
            expect(calculateDiscount(150, DiscountType.FIXED, 200)).toBe(150);
        });
    });

    describe('calculateAffiliationDiscount', () => {
        it('computes affiliation discount on order total', () => {
            expect(calculateAffiliationDiscount(3000, 15)).toBe(450);
        });
    });
});
