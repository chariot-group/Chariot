import {
    getStripeMinimumChargeAmount,
    isStripeFreeOrder,
    resolveChargeableAmount,
} from '@/resources/stripe/stripe-charge.utils';

describe('stripe-charge.utils', () => {
    describe('resolveChargeableAmount', () => {
        it('returns zero charge and zero gift for a fully discounted order', () => {
            expect(resolveChargeableAmount(0, 'eur')).toEqual({
                chargeableAmount: 0,
                giftAmount: 0,
            });
        });

        it('returns chargeable amount when above Stripe minimum (nominal)', () => {
            expect(resolveChargeableAmount(500, 'eur')).toEqual({
                chargeableAmount: 500,
                giftAmount: 0,
            });
        });

        it('waives remainder as gift when below Stripe minimum (edge)', () => {
            expect(resolveChargeableAmount(10, 'eur')).toEqual({
                chargeableAmount: 0,
                giftAmount: 10,
            });
        });

        it('treats amount exactly at minimum as chargeable (edge)', () => {
            const minimum = getStripeMinimumChargeAmount('eur');
            expect(resolveChargeableAmount(minimum, 'eur')).toEqual({
                chargeableAmount: minimum,
                giftAmount: 0,
            });
        });

        it('falls back to 50 for unknown currencies (error/failure)', () => {
            expect(resolveChargeableAmount(30, 'xyz')).toEqual({
                chargeableAmount: 0,
                giftAmount: 30,
            });
        });
    });

    describe('isStripeFreeOrder', () => {
        it('returns true when chargeable amount is zero', () => {
            expect(isStripeFreeOrder(0)).toBe(true);
        });

        it('returns false when a Stripe charge is required', () => {
            expect(isStripeFreeOrder(50)).toBe(false);
        });
    });
});
