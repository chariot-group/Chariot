import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ReferralService } from '@/resources/referral/referral.service';
import { PrismaService } from '@/prisma/prisma.service';
import { KeycloakAdminService } from '@/common/services/keycloak-admin.service';

describe('ReferralService', () => {
    let service: ReferralService;

    const prismaMock = {
        referral: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        referralReferee: {
            findUnique: jest.fn(),
            create: jest.fn(),
            groupBy: jest.fn(),
        },
        referralPayment: {
            findMany: jest.fn(),
            count: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        payment: {
            updateMany: jest.fn(),
        },
        $transaction: jest.fn(),
    } as any;

    const keycloakAdminServiceMock = {
        getUsersByIds: jest.fn(),
    } as any;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReferralService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: KeycloakAdminService, useValue: keycloakAdminServiceMock },
            ],
        }).compile();

        service = module.get<ReferralService>(ReferralService);
    });

    describe('initForUser', () => {
        it('should create a referral code when the user has none', async () => {
            prismaMock.referral.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            prismaMock.referral.create.mockResolvedValue({
                id: 'ref-1',
                code: 'ABCD1234',
                userId: 'user-1',
                pendingReferralsCount: 0,
            });

            const result = await service.initForUser('user-1');

            expect(result.data.code).toBe('ABCD1234');
            expect(result.data.refereeDiscountApplied).toBe(false);
            expect(prismaMock.referral.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ userId: 'user-1' }),
            });
        });

        it('should reject using the user own referral code', async () => {
            prismaMock.referral.findUnique.mockResolvedValue({
                id: 'ref-1',
                code: 'OWNCODE1',
                userId: 'user-1',
                pendingReferralsCount: 0,
            });

            await expect(service.initForUser('user-1', 'owncode1')).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('should reject when the user is already a referee', async () => {
            prismaMock.referral.findUnique
                .mockResolvedValueOnce({
                    id: 'ref-1',
                    code: 'OWNCODE1',
                    userId: 'user-1',
                    pendingReferralsCount: 0,
                })
                .mockResolvedValueOnce({
                    id: 'ref-2',
                    code: 'PARRAIN1',
                    userId: 'user-2',
                    pendingReferralsCount: 0,
                });
            prismaMock.referralReferee.findUnique.mockResolvedValue({
                id: 'referee-1',
                refereeUserId: 'user-1',
                referralId: 'ref-2',
            });

            await expect(service.initForUser('user-1', 'parrain1')).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('should reject an unknown referral code', async () => {
            prismaMock.referral.findUnique.mockImplementation(({ where }: { where: Record<string, string> }) => {
                if (where.userId) {
                    return Promise.resolve({
                        id: 'ref-1',
                        code: 'OWNCODE1',
                        userId: 'user-1',
                        pendingReferralsCount: 0,
                    });
                }
                if (where.code) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(null);
            });
            prismaMock.referralReferee.findUnique.mockResolvedValue(null);

            await expect(service.initForUser('user-1', 'unknown1')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('getMyReferral', () => {
        it('should auto-create a referral code when the user has none', async () => {
            prismaMock.referral.findUnique.mockImplementation(({ where, include }: { where: Record<string, string>; include?: unknown }) => {
                if (where.userId) {
                    return Promise.resolve(
                        include
                            ? {
                                id: 'ref-1',
                                code: 'NEWCODE1',
                                userId: 'user-1',
                                pendingReferralsCount: 0,
                                createdAt: new Date('2026-01-01'),
                                referees: [],
                            }
                            : null,
                    );
                }
                if (where.code) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(null);
            });
            prismaMock.referral.create.mockResolvedValue({
                id: 'ref-1',
                code: 'NEWCODE1',
                userId: 'user-1',
                pendingReferralsCount: 0,
            });
            prismaMock.referralReferee.findUnique.mockResolvedValue(null);

            const result = await service.getMyReferral('user-1');

            expect(prismaMock.referral.create).toHaveBeenCalled();
            expect(result.data.code).toBe('NEWCODE1');
            expect(result.data.refereeCount).toBe(0);
            expect(result.data.myRefereeDiscount).toBeNull();
        });

        it('should return existing referral info without creating a new record', async () => {
            prismaMock.referral.findUnique
                .mockResolvedValueOnce({
                    id: 'ref-1',
                    code: 'EXISTING',
                    userId: 'user-1',
                    pendingReferralsCount: 2,
                    createdAt: new Date('2026-01-01'),
                })
                .mockResolvedValueOnce({
                    id: 'ref-1',
                    code: 'EXISTING',
                    userId: 'user-1',
                    pendingReferralsCount: 2,
                    createdAt: new Date('2026-01-01'),
                    referees: [
                        {
                            id: 'referee-1',
                            refereeUserId: 'user-2',
                            registeredAt: new Date('2026-02-01'),
                            firstPurchaseValidatedAt: new Date('2026-02-02'),
                            discountUsed: false,
                        },
                    ],
                });
            prismaMock.referralReferee.findUnique.mockResolvedValue(null);

            const result = await service.getMyReferral('user-1');

            expect(prismaMock.referral.create).not.toHaveBeenCalled();
            expect(result.data.code).toBe('EXISTING');
            expect(result.data.refereeCount).toBe(1);
            expect(result.data.currentDiscountPercent).toBe(15);
        });
    });

    describe('checkUserReferralDiscount', () => {
        it('should return null when no discount is available', async () => {
            prismaMock.referralReferee.findUnique.mockResolvedValue(null);
            prismaMock.referral.findUnique.mockResolvedValue({
                id: 'ref-1',
                userId: 'user-1',
                pendingReferralsCount: 0,
            });

            const result = await service.checkUserReferralDiscount('user-1');

            expect(result).toBeNull();
        });

        it('should return the highest discount when user is both referee and referrer', async () => {
            prismaMock.referralReferee.findUnique.mockResolvedValue({
                refereeUserId: 'user-1',
                discountUsed: false,
                referral: { id: 'ref-parrain' },
            });
            prismaMock.referral.findUnique.mockResolvedValue({
                id: 'ref-1',
                userId: 'user-1',
                pendingReferralsCount: 1,
            });

            const result = await service.checkUserReferralDiscount('user-1');

            expect(result).toEqual({
                discountPercent: 15,
                discountType: 'referee',
                referralId: 'ref-parrain',
            });
        });
    });
});
