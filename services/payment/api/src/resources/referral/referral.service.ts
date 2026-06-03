import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
    HttpException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IResponse, IPaginatedResponse } from '@/common/dtos/response.dto';
import { Referral, ReferralReferee, ReferralPayment } from '@prisma/client';

const REFEREE_DISCOUNT_PERCENT = 15;
const REFERRER_BASE_DISCOUNT_PERCENT = 10;
const REFERRER_DISCOUNT_INCREMENT_PERCENT = 5;
const REFERRER_MAX_DISCOUNT_PERCENT = 50;

export type ReferralDiscount = {
    discountPercent: number;
    discountType: 'referee' | 'referrer';
    referralId: string;
};

export type ReferralInfo = Referral & {
    refereeCount: number;
    currentDiscountPercent: number;
    pendingReferralsCount: number;
    referees: ReferralReferee[];
    myRefereeDiscount: { available: boolean; discountPercent: number; usedAt?: Date | null } | null;
};

export type ReferralWithStats = Referral & {
    refereeCount: number;
    currentDiscountPercent: number;
    usedDiscountsCount: number;
};

@Injectable()
export class ReferralService {
    private readonly logger = new Logger(ReferralService.name);
    private readonly SERVICE_NAME = ReferralService.name;

    constructor(private readonly prisma: PrismaService) { }

    // ─────────────────────────────────────────────────────────────────
    // Compute referrer discount from pending referrals count
    // 1 filleul → 10%, 2 → 15%, ... capped at 50%
    // ─────────────────────────────────────────────────────────────────
    static computeReferrerDiscount(pendingCount: number): number {
        if (pendingCount <= 0) return 0;
        return Math.min(
            REFERRER_BASE_DISCOUNT_PERCENT + (pendingCount - 1) * REFERRER_DISCOUNT_INCREMENT_PERCENT,
            REFERRER_MAX_DISCOUNT_PERCENT,
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Generate a unique referral code (8 chars, no ambiguous chars)
    // ─────────────────────────────────────────────────────────────────
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    private async generateUniqueCode(): Promise<string> {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = this.generateCode();
            const existing = await this.prisma.referral.findUnique({ where: { code } });
            if (!existing) return code;
        }
        throw new InternalServerErrorException('Failed to generate a unique referral code');
    }

    // ─────────────────────────────────────────────────────────────────
    // Init referral for a user on first login
    // Creates the user's referral code and optionally links them as filleul
    // ─────────────────────────────────────────────────────────────────
    async initForUser(
        userId: string,
        referralCode?: string,
    ): Promise<IResponse<{ code: string; refereeDiscountApplied: boolean }>> {
        try {
            const start = Date.now();

            // Create the user's own referral record if it doesn't exist
            let referral = await this.prisma.referral.findUnique({ where: { userId } });
            if (!referral) {
                const code = await this.generateUniqueCode();
                referral = await this.prisma.referral.create({
                    data: { code, userId },
                });
            }

            let refereeDiscountApplied = false;

            if (referralCode) {
                const normalizedCode = referralCode.toUpperCase().trim();

                if (normalizedCode === referral.code) {
                    throw new BadRequestException('Vous ne pouvez pas utiliser votre propre code de parrainage');
                }

                const alreadyReferee = await this.prisma.referralReferee.findUnique({
                    where: { refereeUserId: userId },
                });
                if (alreadyReferee) {
                    throw new ConflictException('Vous êtes déjà inscrit via un code de parrainage');
                }

                const referrerReferral = await this.prisma.referral.findUnique({
                    where: { code: normalizedCode },
                });
                if (!referrerReferral) {
                    throw new NotFoundException(`Code de parrainage '${normalizedCode}' introuvable`);
                }

                await this.prisma.$transaction([
                    this.prisma.referralReferee.create({
                        data: {
                            refereeUserId: userId,
                            referralId: referrerReferral.id,
                        },
                    }),
                    this.prisma.referral.update({
                        where: { id: referrerReferral.id },
                        data: { pendingReferralsCount: { increment: 1 } },
                    }),
                ]);

                refereeDiscountApplied = true;
            }

            const message = `Referral initialized for user ${userId} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: { code: referral.code, refereeDiscountApplied } };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while initializing referral: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Get current user's referral info (parrain + filleul perspective)
    // ─────────────────────────────────────────────────────────────────
    async getMyReferral(userId: string): Promise<IResponse<ReferralInfo>> {
        try {
            const referral = await this.prisma.referral.findUnique({
                where: { userId },
                include: {
                    referees: { orderBy: { registeredAt: 'desc' } },
                },
            });

            if (!referral) {
                throw new NotFoundException('Aucun code de parrainage trouvé pour cet utilisateur');
            }

            const refereeCount = referral.referees.length;
            const currentDiscountPercent = ReferralService.computeReferrerDiscount(
                referral.pendingReferralsCount,
            );

            // Also check if this user is a filleul (has referee discount)
            const myRefereeEntry = await this.prisma.referralReferee.findUnique({
                where: { refereeUserId: userId },
            });
            const myRefereeDiscount = myRefereeEntry
                ? {
                    available: !myRefereeEntry.discountUsed,
                    discountPercent: REFEREE_DISCOUNT_PERCENT,
                    usedAt: myRefereeEntry.discountUsedAt,
                }
                : null;

            const message = `Referral info retrieved for user ${userId}`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return {
                message,
                data: {
                    ...referral,
                    refereeCount,
                    currentDiscountPercent,
                    pendingReferralsCount: referral.pendingReferralsCount,
                    myRefereeDiscount,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error retrieving referral info: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Check if a user has an active referral discount (filleul or parrain)
    // Returns null if no discount available (fails gracefully)
    // ─────────────────────────────────────────────────────────────────
    async checkUserReferralDiscount(userId: string): Promise<ReferralDiscount | null> {
        try {
            // Check filleul discount first (15% unused)
            const referee = await this.prisma.referralReferee.findUnique({
                where: { refereeUserId: userId },
                include: { referral: true },
            });

            if (referee && !referee.discountUsed) {
                return {
                    discountPercent: REFEREE_DISCOUNT_PERCENT,
                    discountType: 'referee',
                    referralId: referee.referral.id,
                };
            }

            // Check parrain discount
            const referral = await this.prisma.referral.findUnique({
                where: { userId },
            });

            if (referral && referral.pendingReferralsCount > 0) {
                return {
                    discountPercent: ReferralService.computeReferrerDiscount(
                        referral.pendingReferralsCount,
                    ),
                    discountType: 'referrer',
                    referralId: referral.id,
                };
            }

            return null;
        } catch (error) {
            this.logger.error(
                `Error checking referral discount for user ${userId}: ${error.message}`,
                error.stack,
                this.SERVICE_NAME,
            );
            return null; // Fail gracefully — don't block checkout
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Mark referral discount as used after a successful payment
    // ─────────────────────────────────────────────────────────────────
    async markReferralDiscountUsed(
        userId: string,
        referralId: string,
        discountType: 'referee' | 'referrer',
        orderId: string,
        orderAmount: number,
        discountAmount: number,
        discountPercent: number,
    ): Promise<void> {
        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.referralPayment.create({
                    data: {
                        userId,
                        referralId,
                        discountType,
                        discountPercent,
                        orderId,
                        orderAmount,
                        discountAmount,
                    },
                });

                if (discountType === 'referee') {
                    await tx.referralReferee.update({
                        where: { refereeUserId: userId },
                        data: {
                            discountUsed: true,
                            discountUsedAt: new Date(),
                            discountOrderId: orderId,
                        },
                    });
                    // Link the Payment record to this referral
                    await tx.payment.updateMany({
                        where: {
                            OR: [
                                { stripeSessionId: orderId },
                                { stripePaymentIntentId: orderId },
                            ],
                        },
                        data: { referralId },
                    });
                } else {
                    // Reset parrain's pending count
                    await tx.referral.update({
                        where: { id: referralId },
                        data: { pendingReferralsCount: 0 },
                    });
                    await tx.payment.updateMany({
                        where: {
                            OR: [
                                { stripeSessionId: orderId },
                                { stripePaymentIntentId: orderId },
                            ],
                        },
                        data: { referralId },
                    });
                }
            });

            this.logger.verbose(
                `Referral discount marked as used: ${discountType} for user ${userId}, order ${orderId}`,
                this.SERVICE_NAME,
            );
        } catch (error) {
            // Don't throw — payment is already completed, this is a post-payment side effect
            this.logger.error(
                `Error marking referral discount as used: ${error.message}`,
                error.stack,
                this.SERVICE_NAME,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Admin: list all referrals with stats
    // ─────────────────────────────────────────────────────────────────
    async findAll(
        page = 1,
        limit = 20,
    ): Promise<IPaginatedResponse<ReferralWithStats[]>> {
        try {
            const start = Date.now();
            const skip = (page - 1) * limit;

            const [referrals, totalItems] = await Promise.all([
                this.prisma.referral.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: { select: { referees: true, payments: true } },
                    },
                }),
                this.prisma.referral.count(),
            ]);

            const data: ReferralWithStats[] = referrals.map((r) => ({
                ...r,
                refereeCount: r._count.referees,
                currentDiscountPercent: ReferralService.computeReferrerDiscount(r.pendingReferralsCount),
                usedDiscountsCount: r._count.payments,
            }));

            const message = `${referrals.length} referrals found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data, pagination: { page, offset: limit, totalItems } };
        } catch (error) {
            const message = `Error fetching referrals: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Admin: list all referral payments
    // ─────────────────────────────────────────────────────────────────
    async findAllPayments(
        page = 1,
        limit = 20,
    ): Promise<IPaginatedResponse<(ReferralPayment & { referralCode: string })[]>> {
        try {
            const start = Date.now();
            const skip = (page - 1) * limit;

            const [payments, totalItems] = await Promise.all([
                this.prisma.referralPayment.findMany({
                    skip,
                    take: limit,
                    orderBy: { usedAt: 'desc' },
                    include: { referral: { select: { code: true } } },
                }),
                this.prisma.referralPayment.count(),
            ]);

            const data = payments.map((p) => ({
                ...p,
                referralCode: p.referral.code,
            }));

            const message = `${payments.length} referral payments found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data, pagination: { page, offset: limit, totalItems } };
        } catch (error) {
            const message = `Error fetching referral payments: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
