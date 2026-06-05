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
import { CreateAffiliationDto } from '@/resources/affiliation/dto/create-affiliation.dto';
import { UpdateAffiliationDto } from '@/resources/affiliation/dto/update-affiliation.dto';
import { Affiliation, AffiliationUsage } from '@prisma/client';

export type AffiliationWithStats = Affiliation & {
    totalUsages: number;
    totalCommissionAmount: number;
};

@Injectable()
export class AffiliationService {
    private readonly logger = new Logger(AffiliationService.name);
    private readonly SERVICE_NAME = AffiliationService.name;

    constructor(private readonly prisma: PrismaService) { }

    async create(
        dto: CreateAffiliationDto,
    ): Promise<IResponse<Affiliation>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.affiliation.findUnique({
                where: { code: dto.code },
            });

            if (existing) {
                const message = `Affiliation with code '${dto.code}' already exists`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new ConflictException(message);
            }

            const affiliation = await this.prisma.affiliation.create({
                data: {
                    code: dto.code,
                    name: dto.name,
                    creatorUserId: dto.creatorUserId,
                    creatorName: dto.creatorName,
                    creatorCommissionPercent: dto.creatorCommissionPercent,
                    userDiscountPercent: dto.userDiscountPercent,
                },
            });

            const message = `Affiliation '${dto.code}' created in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: affiliation };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while creating affiliation: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findAll(
        page = 1,
        limit = 20,
        includeInactive = false,
    ): Promise<IPaginatedResponse<AffiliationWithStats[]>> {
        try {
            const start = Date.now();
            const skip = (page - 1) * limit;

            const where = {
                deletedAt: null,
                ...(includeInactive ? {} : { isActive: true }),
            };

            const [affiliations, totalItems] = await Promise.all([
                this.prisma.affiliation.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: { _count: { select: { usages: true } } },
                }),
                this.prisma.affiliation.count({ where }),
            ]);

            const affiliationsWithStats: AffiliationWithStats[] = await Promise.all(
                affiliations.map(async (affiliation) => {
                    const commissionSum = await this.prisma.affiliationUsage.aggregate({
                        where: { affiliationId: affiliation.id },
                        _sum: { commissionAmount: true },
                    });

                    return {
                        ...affiliation,
                        totalUsages: affiliation._count.usages,
                        totalCommissionAmount:
                            commissionSum._sum.commissionAmount ?? 0,
                    };
                }),
            );

            const message = `${affiliations.length} affiliations found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: affiliationsWithStats,
                pagination: { page, offset: limit, totalItems },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching affiliations: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(id: string): Promise<IResponse<AffiliationWithStats>> {
        try {
            const start = Date.now();

            const affiliation = await this.prisma.affiliation.findFirst({
                where: { id, deletedAt: null },
            });

            if (!affiliation) {
                const message = `Affiliation #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const commissionSum = await this.prisma.affiliationUsage.aggregate({
                where: { affiliationId: id },
                _sum: { commissionAmount: true },
            });

            const totalUsages = await this.prisma.affiliationUsage.count({
                where: { affiliationId: id },
            });

            const message = `Affiliation #${id} found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: {
                    ...affiliation,
                    totalUsages,
                    totalCommissionAmount: commissionSum._sum.commissionAmount ?? 0,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching affiliation #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findByCode(code: string): Promise<IResponse<Affiliation>> {
        try {
            const start = Date.now();

            const affiliation = await this.prisma.affiliation.findFirst({
                where: { code, deletedAt: null },
            });

            if (!affiliation) {
                const message = `Affiliation '${code}' not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const message = `Affiliation '${code}' found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: affiliation };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching affiliation '${code}': ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async getUsages(
        id: string,
        page = 1,
        limit = 20,
    ): Promise<IPaginatedResponse<AffiliationUsage[]>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.affiliation.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `Affiliation #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const skip = (page - 1) * limit;

            const [usages, totalItems] = await Promise.all([
                this.prisma.affiliationUsage.findMany({
                    where: { affiliationId: id },
                    skip,
                    take: limit,
                    orderBy: { usedAt: 'desc' },
                }),
                this.prisma.affiliationUsage.count({ where: { affiliationId: id } }),
            ]);

            const message = `${usages.length} usages for affiliation #${id} found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: usages,
                pagination: { page, offset: limit, totalItems },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching usages for affiliation #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async update(
        id: string,
        dto: UpdateAffiliationDto,
    ): Promise<IResponse<Affiliation>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.affiliation.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `Affiliation #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            if (dto.code && dto.code !== existing.code) {
                const conflict = await this.prisma.affiliation.findUnique({
                    where: { code: dto.code },
                });
                if (conflict) {
                    const message = `Affiliation with code '${dto.code}' already exists`;
                    this.logger.warn(message, this.SERVICE_NAME);
                    throw new ConflictException(message);
                }
            }

            const updated = await this.prisma.affiliation.update({
                where: { id },
                data: {
                    ...(dto.code !== undefined && { code: dto.code }),
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.creatorUserId !== undefined && {
                        creatorUserId: dto.creatorUserId,
                    }),
                    ...(dto.creatorName !== undefined && {
                        creatorName: dto.creatorName,
                    }),
                    ...(dto.creatorCommissionPercent !== undefined && {
                        creatorCommissionPercent: dto.creatorCommissionPercent,
                    }),
                    ...(dto.userDiscountPercent !== undefined && {
                        userDiscountPercent: dto.userDiscountPercent,
                    }),
                    ...(dto.isActive !== undefined && {
                        isActive: dto.isActive,
                    }),
                },
            });

            const message = `Affiliation #${id} updated in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: updated };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while updating affiliation #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async deactivate(id: string): Promise<IResponse<Affiliation>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.affiliation.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `Affiliation #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            if (!existing.isActive) {
                const message = `Affiliation #${id} is already inactive`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const updated = await this.prisma.affiliation.update({
                where: { id },
                data: { isActive: false },
            });

            const message = `Affiliation #${id} deactivated in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: updated };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while deactivating affiliation #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async remove(id: string): Promise<IResponse<Affiliation>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.affiliation.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `Affiliation #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const deleted = await this.prisma.affiliation.update({
                where: { id },
                data: { deletedAt: new Date(), isActive: false },
            });

            const message = `Affiliation #${id} deleted in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: deleted };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while deleting affiliation #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
