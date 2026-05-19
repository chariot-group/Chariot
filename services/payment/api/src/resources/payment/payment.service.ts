import {
    Injectable,
    Logger,
    NotFoundException,
    InternalServerErrorException,
    HttpException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IResponse, IPaginatedResponse } from '@/common/dtos/response.dto';
import { CreatePaymentDto } from '@/resources/payment/dto/create-payment.dto';
import { UpdatePaymentStatusDto } from '@/resources/payment/dto/update-payment-status.dto';
import { PromoCodeService } from '@/resources/promo-code/promo-code.service';
import { AffiliationService } from '@/resources/affiliation/affiliation.service';
import { Payment, DiscountType } from '@prisma/client';

export type PaymentWithDiscount = Payment & {
    appliedDiscount: {
        promoCode?: { code: string; discountType: string; discountValue: number } | null;
        affiliation?: { code: string; userDiscountPercent: number } | null;
        discountAmount: number;
        finalAmount: number;
    };
};

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly SERVICE_NAME = PaymentService.name;

    constructor(
        private readonly prisma: PrismaService,
        private readonly promoCodeService: PromoCodeService,
        private readonly affiliationService: AffiliationService,
    ) { }

    /**
     * Calcule le montant de la réduction en centimes.
     */
    private calculateDiscount(
        amount: number,
        discountType: DiscountType,
        discountValue: number,
    ): number {
        if (discountType === DiscountType.PERCENTAGE) {
            return Math.floor((amount * discountValue) / 100);
        }
        // FIXED: la réduction ne peut pas dépasser le montant total
        return Math.min(discountValue, amount);
    }

    async create(
        dto: CreatePaymentDto,
    ): Promise<IResponse<PaymentWithDiscount>> {
        try {
            const start = Date.now();

            let promoCodeId: string | null = null;
            let affiliationId: string | null = null;
            let discountAmount = 0;
            let promoCodeData = null;
            let affiliationData = null;

            // Vérifier et appliquer l'affiliation (priorité basse, appliquée en premier)
            if (dto.affiliationCode) {
                const affiliationResult = await this.affiliationService.findByCode(
                    dto.affiliationCode,
                );
                const affiliation = affiliationResult.data;

                if (!affiliation.isActive) {
                    throw new BadRequestException(
                        `Le code d'affiliation '${dto.affiliationCode}' est désactivé`,
                    );
                }

                const affiliationDiscount = Math.floor(
                    (dto.amount * affiliation.userDiscountPercent) / 100,
                );
                discountAmount += affiliationDiscount;
                affiliationId = affiliation.id;
                affiliationData = affiliation;
            }

            // Vérifier et appliquer le code promo (peut s'ajouter à l'affiliation)
            if (dto.promoCode) {
                const amountAfterAffiliation = dto.amount - discountAmount;
                const promoResult = await this.promoCodeService.validate(
                    dto.promoCode,
                    dto.userId,
                    dto.amount,
                    dto.isFirstOrder ?? false,
                );
                const promoCode = promoResult.data;

                const promoDiscount = this.calculateDiscount(
                    amountAfterAffiliation,
                    promoCode.discountType,
                    promoCode.discountValue,
                );
                discountAmount += promoDiscount;
                promoCodeId = promoCode.id;
                promoCodeData = promoCode;
            }

            const finalAmount = Math.max(0, dto.amount - discountAmount);

            const payment = await this.prisma.payment.create({
                data: {
                    userId: dto.userId,
                    amount: dto.amount,
                    discountAmount,
                    finalAmount,
                    currency: dto.currency ?? 'eur',
                    stripeSessionId: dto.stripeSessionId ?? null,
                    promoCodeId,
                    affiliationId,
                },
            });

            const message = `Payment created for user ${dto.userId} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: {
                    ...payment,
                    appliedDiscount: {
                        promoCode: promoCodeData
                            ? {
                                code: promoCodeData.code,
                                discountType: promoCodeData.discountType,
                                discountValue: promoCodeData.discountValue,
                            }
                            : null,
                        affiliation: affiliationData
                            ? {
                                code: affiliationData.code,
                                userDiscountPercent:
                                    affiliationData.userDiscountPercent,
                            }
                            : null,
                        discountAmount,
                        finalAmount,
                    },
                },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while creating payment: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async updateStatus(
        id: string,
        dto: UpdatePaymentStatusDto,
    ): Promise<IResponse<Payment>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.payment.findUnique({
                where: { id },
            });

            if (!existing) {
                const message = `Payment #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const updated = await this.prisma.$transaction(async (tx) => {
                const payment = await tx.payment.update({
                    where: { id },
                    data: {
                        status: dto.status,
                        ...(dto.stripePaymentIntentId && {
                            stripePaymentIntentId: dto.stripePaymentIntentId,
                        }),
                    },
                });

                // Lorsque le paiement est COMPLETED, enregistrer les usages
                if (dto.status === 'COMPLETED') {
                    if (payment.promoCodeId) {
                        await tx.promoCodeUsage.create({
                            data: {
                                promoCodeId: payment.promoCodeId,
                                userId: payment.userId,
                                orderId: payment.stripeSessionId ?? id,
                            },
                        });

                        await tx.promoCode.update({
                            where: { id: payment.promoCodeId },
                            data: {
                                currentTotalUses: { increment: 1 },
                            },
                        });
                    }

                    if (payment.affiliationId) {
                        const affiliation = await tx.affiliation.findUnique({
                            where: { id: payment.affiliationId },
                        });

                        if (affiliation) {
                            const commissionAmount = Math.floor(
                                (payment.finalAmount *
                                    affiliation.creatorCommissionPercent) /
                                100,
                            );

                            await tx.affiliationUsage.create({
                                data: {
                                    affiliationId: payment.affiliationId,
                                    userId: payment.userId,
                                    orderId: payment.stripeSessionId ?? id,
                                    orderAmount: payment.finalAmount,
                                    commissionAmount,
                                },
                            });
                        }
                    }
                }

                return payment;
            });

            const message = `Payment #${id} status updated to ${dto.status} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: updated };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while updating payment #${id} status: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findAll(
        page = 1,
        limit = 20,
        userId?: string,
        status?: string,
    ): Promise<IPaginatedResponse<Payment[]>> {
        try {
            const start = Date.now();
            const skip = (page - 1) * limit;

            const where: any = {};
            if (userId) where.userId = userId;
            if (status) where.status = status;

            const [payments, totalItems] = await Promise.all([
                this.prisma.payment.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        promoCode: { select: { code: true, discountType: true, discountValue: true } },
                        affiliation: { select: { code: true, userDiscountPercent: true, creatorName: true } },
                    },
                }),
                this.prisma.payment.count({ where }),
            ]);

            const message = `${payments.length} payments found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: payments,
                pagination: { page, offset: limit, totalItems },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching payments: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(id: string): Promise<IResponse<Payment>> {
        try {
            const start = Date.now();

            const payment = await this.prisma.payment.findUnique({
                where: { id },
                include: {
                    promoCode: { select: { code: true, discountType: true, discountValue: true } },
                    affiliation: { select: { code: true, userDiscountPercent: true, creatorName: true } },
                },
            });

            if (!payment) {
                const message = `Payment #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const message = `Payment #${id} found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: payment };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching payment #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findByStripeSession(sessionId: string): Promise<IResponse<Payment>> {
        try {
            const start = Date.now();

            const payment = await this.prisma.payment.findUnique({
                where: { stripeSessionId: sessionId },
            });

            if (!payment) {
                const message = `Payment with Stripe session '${sessionId}' not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const message = `Payment for session '${sessionId}' found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: payment };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching payment by session '${sessionId}': ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
