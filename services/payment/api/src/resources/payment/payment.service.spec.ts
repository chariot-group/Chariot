import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PaymentService } from '@/resources/payment/payment.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PromoCodeService } from '@/resources/promo-code/promo-code.service';
import { AffiliationService } from '@/resources/affiliation/affiliation.service';
import { KeycloakAdminService } from '@/common/services/keycloak-admin.service';

describe('PaymentService', () => {
    let service: PaymentService;

    const prismaMock = {
        payment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        promoCodeUsage: {
            create: jest.fn(),
        },
        promoCode: {
            update: jest.fn(),
        },
        affiliation: {
            findUnique: jest.fn(),
        },
        affiliationUsage: {
            create: jest.fn(),
        },
        referralPayment: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn(),
    } as any;

    const promoCodeServiceMock = {
        validate: jest.fn(),
    } as any;

    const affiliationServiceMock = {
        findByCode: jest.fn(),
    } as any;

    const keycloakAdminServiceMock = {
        getUsersByIds: jest.fn(),
    } as any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: PromoCodeService, useValue: promoCodeServiceMock },
                { provide: AffiliationService, useValue: affiliationServiceMock },
                { provide: KeycloakAdminService, useValue: keycloakAdminServiceMock },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    it('should create a payment with stacked affiliation and promo discounts', async () => {
        affiliationServiceMock.findByCode.mockResolvedValue({
            data: {
                id: 'aff-1',
                code: 'AFF10',
                isActive: true,
                userDiscountPercent: 10,
            },
        });
        promoCodeServiceMock.validate.mockResolvedValue({
            data: {
                id: 'promo-1',
                code: 'PROMO20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
            },
        });
        prismaMock.payment.create.mockResolvedValue({
            id: 'pay-1',
            userId: 'user-1',
            amount: 10000,
            discountAmount: 2800,
            finalAmount: 7200,
            currency: 'eur',
            stripeSessionId: 'cs_test_1',
            promoCodeId: 'promo-1',
            affiliationId: 'aff-1',
        });

        const result = await service.create({
            userId: 'user-1',
            amount: 10000,
            currency: 'eur',
            stripeSessionId: 'cs_test_1',
            affiliationCode: 'AFF10',
            promoCode: 'PROMO20',
            isFirstOrder: true,
        } as any);

        expect(affiliationServiceMock.findByCode).toHaveBeenCalledWith('AFF10');
        expect(promoCodeServiceMock.validate).toHaveBeenCalledWith(
            'PROMO20',
            'user-1',
            10000,
            true,
        );
        expect(prismaMock.payment.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                amount: 10000,
                discountAmount: 2800,
                finalAmount: 7200,
                currency: 'eur',
                stripeSessionId: 'cs_test_1',
                promoCodeId: 'promo-1',
                affiliationId: 'aff-1',
            },
        });
        expect(result.data).toEqual(
            expect.objectContaining({
                id: 'pay-1',
                appliedDiscount: {
                    promoCode: {
                        code: 'PROMO20',
                        discountType: DiscountType.PERCENTAGE,
                        discountValue: 20,
                    },
                    affiliation: {
                        code: 'AFF10',
                        userDiscountPercent: 10,
                    },
                    discountAmount: 2800,
                    finalAmount: 7200,
                },
            }),
        );
    });

    it('should throw BadRequestException when an affiliation code is disabled', async () => {
        affiliationServiceMock.findByCode.mockResolvedValue({
            data: {
                id: 'aff-1',
                code: 'AFF10',
                isActive: false,
                userDiscountPercent: 10,
            },
        });

        await expect(
            service.create({
                userId: 'user-1',
                amount: 10000,
                affiliationCode: 'AFF10',
            } as any),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it('should update a completed payment and record promo and affiliation usages', async () => {
        prismaMock.payment.findUnique.mockResolvedValue({
            id: 'pay-1',
            userId: 'user-1',
            finalAmount: 7200,
            stripeSessionId: 'cs_test_1',
            promoCodeId: 'promo-1',
            affiliationId: 'aff-1',
        });

        prismaMock.$transaction.mockImplementation(async (callback: any) =>
            callback({
                payment: {
                    update: jest.fn().mockResolvedValue({
                        id: 'pay-1',
                        status: 'COMPLETED',
                        promoCodeId: 'promo-1',
                        affiliationId: 'aff-1',
                        userId: 'user-1',
                        stripeSessionId: 'cs_test_1',
                        finalAmount: 7200,
                    }),
                },
                promoCodeUsage: prismaMock.promoCodeUsage,
                promoCode: prismaMock.promoCode,
                affiliation: {
                    findUnique: jest.fn().mockResolvedValue({
                        id: 'aff-1',
                        creatorCommissionPercent: 15,
                    }),
                },
                affiliationUsage: prismaMock.affiliationUsage,
            }),
        );

        const result = await service.updateStatus('pay-1', { status: 'COMPLETED' } as any);

        expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
            where: { id: 'pay-1' },
        });
        expect(prismaMock.promoCodeUsage.create).toHaveBeenCalledWith({
            data: {
                promoCodeId: 'promo-1',
                userId: 'user-1',
                orderId: 'cs_test_1',
            },
        });
        expect(prismaMock.promoCode.update).toHaveBeenCalledWith({
            where: { id: 'promo-1' },
            data: {
                currentTotalUses: { increment: 1 },
            },
        });
        expect(prismaMock.affiliationUsage.create).toHaveBeenCalledWith({
            data: {
                affiliationId: 'aff-1',
                userId: 'user-1',
                orderId: 'cs_test_1',
                orderAmount: 7200,
                commissionAmount: 1080,
            },
        });
        expect(result.data).toEqual(
            expect.objectContaining({
                status: 'COMPLETED',
            }),
        );
    });

    it('should throw NotFoundException when a payment does not exist', async () => {
        prismaMock.payment.findUnique.mockResolvedValue(null);

        await expect(service.findOne('missing-payment')).rejects.toThrow(NotFoundException);
    });

    it('should return whether a user has completed payments', async () => {
        prismaMock.payment.count.mockResolvedValue(1);

        await expect(service.hasCompletedPayment('user-1')).resolves.toBe(true);

        expect(prismaMock.payment.count).toHaveBeenCalledWith({
            where: { userId: 'user-1', status: 'COMPLETED' },
        });
    });
});