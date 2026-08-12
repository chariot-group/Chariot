import { UnprocessableEntityException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { StripeService } from '@/resources/stripe/stripe.service';

describe('StripeService.resolveCode — FR-stripe-checkout', () => {
    let service: StripeService;

    const paymentServiceMock = {
        hasCompletedPayment: jest.fn(),
    } as any;

    const promoCodeServiceMock = {
        findByCode: jest.fn(),
        countUsageForUser: jest.fn(),
    } as any;

    const affiliationServiceMock = {
        findByCode: jest.fn(),
    } as any;

    const referralServiceMock = {} as any;

    const stripePaymentsCounterMock = {
        inc: jest.fn(),
    };

    const stripeWebhooksCounterMock = {
        inc: jest.fn(),
    };

    beforeAll(() => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    });

    beforeEach(() => {
        jest.clearAllMocks();

        service = new StripeService(
            paymentServiceMock,
            promoCodeServiceMock,
            affiliationServiceMock,
            referralServiceMock,
            stripePaymentsCounterMock as any,
            stripeWebhooksCounterMock as any,
        );
    });

    const firstOrderPromo = {
        id: 'promo-1',
        code: 'WELCOME10',
        isActive: true,
        expiresAt: null,
        maxTotalUses: null,
        currentTotalUses: 0,
        maxUsesPerUser: 1,
        isFirstOrderOnly: true,
        minOrderAmount: null,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
    };

    it('resolves a first-order-only promo for a new customer (nominal)', async () => {
        promoCodeServiceMock.findByCode.mockResolvedValue({ data: firstOrderPromo });
        promoCodeServiceMock.countUsageForUser.mockResolvedValue(0);
        paymentServiceMock.hasCompletedPayment.mockResolvedValue(false);

        const result = await service.resolveCode('WELCOME10', 'user-1', 1000);

        expect(result.data).toEqual({
            type: 'promo',
            discountType: 'PERCENTAGE',
            discountValue: 10,
        });
        expect(paymentServiceMock.hasCompletedPayment).toHaveBeenCalledWith('user-1');
    });

    it('rejects a first-order-only promo when the user already completed a payment (edge)', async () => {
        promoCodeServiceMock.findByCode.mockResolvedValue({ data: firstOrderPromo });
        promoCodeServiceMock.countUsageForUser.mockResolvedValue(0);
        paymentServiceMock.hasCompletedPayment.mockResolvedValue(true);

        await expect(service.resolveCode('WELCOME10', 'user-1', 1000)).rejects.toMatchObject({
            response: {
                errorCode: 'PROMO_FIRST_ORDER_ONLY',
            },
        });
        await expect(service.resolveCode('WELCOME10', 'user-1', 1000)).rejects.toBeInstanceOf(
            UnprocessableEntityException,
        );
    });

    it('does not check first-order constraint for regular promos (failure guard)', async () => {
        promoCodeServiceMock.findByCode.mockResolvedValue({
            data: { ...firstOrderPromo, isFirstOrderOnly: false, code: 'SUMMER10' },
        });
        promoCodeServiceMock.countUsageForUser.mockResolvedValue(0);

        const result = await service.resolveCode('SUMMER10', 'user-1', 1000);

        expect(result.data.type).toBe('promo');
        expect(paymentServiceMock.hasCompletedPayment).not.toHaveBeenCalled();
    });
});
