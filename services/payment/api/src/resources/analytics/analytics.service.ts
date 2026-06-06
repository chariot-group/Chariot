import {
    Injectable,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

export type Period = 'daily' | 'weekly' | 'monthly';

export interface DashboardKpis {
    totalRevenue: number;
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    refundedPayments: number;
    completionRate: number;
    avgOrderValue: number;
    totalDiscounts: number;
    totalCommissions: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    payments: number;
    discounts: number;
}

export interface AffiliationStat {
    id: string;
    code: string;
    name: string;
    creatorName: string;
    creatorUserId: string | null;
    totalUsages: number;
    totalCommission: number;
    totalRevenue: number;
    isActive: boolean;
}

export interface PromoCodeStat {
    id: string;
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    totalUsages: number;
    totalDiscount: number;
    isActive: boolean;
}

export interface ChannelPerformance {
    revenue: number;
    loss: number;
}

export interface AffiliationPerformance extends ChannelPerformance {
    commissionLoss: number;
    discountLoss: number;
}

export interface AcquisitionPerformance {
    promoCodes: ChannelPerformance;
    affiliations: AffiliationPerformance;
    referrals: ChannelPerformance;
}

export interface DashboardData {
    kpis: DashboardKpis;
    revenueOverTime: RevenueDataPoint[];
    topAffiliations: AffiliationStat[];
    topPromoCodes: PromoCodeStat[];
    paymentStatusBreakdown: Record<PaymentStatus, number>;
    acquisitionPerformance: AcquisitionPerformance;
}

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private readonly SERVICE_NAME = AnalyticsService.name;

    constructor(private readonly prisma: PrismaService) { }

    async getDashboard(
        period: Period,
        from?: Date,
        to?: Date,
    ): Promise<DashboardData> {
        try {
            const start = Date.now();

            const dateFrom = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const dateTo = to ?? new Date();

            const [kpis, revenueOverTime, topAffiliations, topPromoCodes, statusBreakdown, acquisitionPerformance] =
                await Promise.all([
                    this.computeKpis(dateFrom, dateTo),
                    this.computeRevenueOverTime(period, dateFrom, dateTo),
                    this.computeTopAffiliations(dateFrom, dateTo),
                    this.computeTopPromoCodes(dateFrom, dateTo),
                    this.computeStatusBreakdown(dateFrom, dateTo),
                    this.computeAcquisitionPerformance(dateFrom, dateTo),
                ]);

            this.logger.verbose(
                `Dashboard computed in ${Date.now() - start}ms`,
                this.SERVICE_NAME,
            );

            return {
                kpis,
                revenueOverTime,
                topAffiliations,
                topPromoCodes,
                paymentStatusBreakdown: statusBreakdown,
                acquisitionPerformance,
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const message = `Error while computing dashboard: ${err.message}`;
            this.logger.error(message, err.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    private async computeKpis(from: Date, to: Date): Promise<DashboardKpis> {
        const payments = await this.prisma.payment.findMany({
            where: { createdAt: { gte: from, lte: to } },
            select: {
                finalAmount: true,
                discountAmount: true,
                status: true,
            },
        });

        const completed = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
        const totalRevenue = completed.reduce((sum, p) => sum + p.finalAmount, 0);
        const totalDiscounts = completed.reduce((sum, p) => sum + p.discountAmount, 0);

        const commissionSum = await this.prisma.affiliationUsage.aggregate({
            where: { usedAt: { gte: from, lte: to } },
            _sum: { commissionAmount: true },
        });

        return {
            totalRevenue,
            totalPayments: payments.length,
            completedPayments: completed.length,
            failedPayments: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
            refundedPayments: payments.filter((p) => p.status === PaymentStatus.REFUNDED).length,
            completionRate: payments.length > 0 ? Math.round((completed.length / payments.length) * 100) : 0,
            avgOrderValue: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
            totalDiscounts,
            totalCommissions: commissionSum._sum.commissionAmount ?? 0,
        };
    }

    private async computeRevenueOverTime(
        period: Period,
        from: Date,
        to: Date,
    ): Promise<RevenueDataPoint[]> {
        const payments = await this.prisma.payment.findMany({
            where: {
                status: PaymentStatus.COMPLETED,
                createdAt: { gte: from, lte: to },
            },
            select: { finalAmount: true, discountAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        const buckets = new Map<string, { revenue: number; payments: number; discounts: number }>();

        for (const payment of payments) {
            const key = this.getBucketKey(payment.createdAt, period);
            const existing = buckets.get(key) ?? { revenue: 0, payments: 0, discounts: 0 };
            buckets.set(key, {
                revenue: existing.revenue + payment.finalAmount,
                payments: existing.payments + 1,
                discounts: existing.discounts + payment.discountAmount,
            });
        }

        return Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data }));
    }

    private getBucketKey(date: Date, period: Period): string {
        if (period === 'daily') {
            return date.toISOString().slice(0, 10);
        } else if (period === 'weekly') {
            const d = new Date(date);
            const day = d.getUTCDay();
            const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
            d.setUTCDate(diff);
            return d.toISOString().slice(0, 10);
        } else {
            return date.toISOString().slice(0, 7);
        }
    }

    private async computeTopAffiliations(from: Date, to: Date): Promise<AffiliationStat[]> {
        const affiliations = await this.prisma.affiliation.findMany({
            where: { deletedAt: null },
            include: {
                usages: {
                    where: { usedAt: { gte: from, lte: to } },
                    select: { commissionAmount: true, orderAmount: true },
                },
            },
        });

        return affiliations
            .map((a) => ({
                id: a.id,
                code: a.code,
                name: a.name,
                creatorName: a.creatorName,
                creatorUserId: a.creatorUserId,
                totalUsages: a.usages.length,
                totalCommission: a.usages.reduce((sum, u) => sum + u.commissionAmount, 0),
                totalRevenue: a.usages.reduce((sum, u) => sum + u.orderAmount, 0),
                isActive: a.isActive,
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    private async computeTopPromoCodes(from: Date, to: Date): Promise<PromoCodeStat[]> {
        const promoCodes = await this.prisma.promoCode.findMany({
            where: { deletedAt: null },
            include: {
                payments: {
                    where: {
                        status: PaymentStatus.COMPLETED,
                        createdAt: { gte: from, lte: to },
                    },
                    select: { discountAmount: true },
                },
            },
        });

        return promoCodes
            .map((p) => ({
                id: p.id,
                code: p.code,
                name: p.name,
                discountType: p.discountType,
                discountValue: p.discountValue,
                totalUsages: p.payments.length,
                totalDiscount: p.payments.reduce((sum, pay) => sum + pay.discountAmount, 0),
                isActive: p.isActive,
            }))
            .sort((a, b) => b.totalUsages - a.totalUsages);
    }

    private async computeStatusBreakdown(
        from: Date,
        to: Date,
    ): Promise<Record<PaymentStatus, number>> {
        const groups = await this.prisma.payment.groupBy({
            by: ['status'],
            where: { createdAt: { gte: from, lte: to } },
            _count: { status: true },
        });

        const result: Record<PaymentStatus, number> = {
            PENDING: 0,
            COMPLETED: 0,
            FAILED: 0,
            REFUNDED: 0,
        };

        for (const g of groups) {
            result[g.status] = g._count.status;
        }

        return result;
    }

    private async computeAcquisitionPerformance(
        from: Date,
        to: Date,
    ): Promise<AcquisitionPerformance> {
        const [completedPayments, affiliationCommissions] = await Promise.all([
            this.prisma.payment.findMany({
                where: {
                    status: PaymentStatus.COMPLETED,
                    createdAt: { gte: from, lte: to },
                },
                select: {
                    finalAmount: true,
                    discountAmount: true,
                    promoCodeId: true,
                    affiliationId: true,
                    referralId: true,
                },
            }),
            this.prisma.affiliationUsage.aggregate({
                where: { usedAt: { gte: from, lte: to } },
                _sum: { commissionAmount: true },
            }),
        ]);

        const promoCodes: ChannelPerformance = { revenue: 0, loss: 0 };
        const affiliations: AffiliationPerformance = {
            revenue: 0,
            loss: 0,
            discountLoss: 0,
            commissionLoss: affiliationCommissions._sum.commissionAmount ?? 0,
        };
        const referrals: ChannelPerformance = { revenue: 0, loss: 0 };

        for (const payment of completedPayments) {
            if (payment.promoCodeId) {
                promoCodes.revenue += payment.finalAmount;
                promoCodes.loss += payment.discountAmount;
            }

            if (payment.affiliationId) {
                affiliations.revenue += payment.finalAmount;
                affiliations.discountLoss += payment.discountAmount;
            }

            if (payment.referralId) {
                referrals.revenue += payment.finalAmount;
                referrals.loss += payment.discountAmount;
            }
        }

        affiliations.loss = affiliations.discountLoss + affiliations.commissionLoss;

        return {
            promoCodes,
            affiliations,
            referrals,
        };
    }
}
