import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
    HttpException,
    GoneException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IResponse, IPaginatedResponse } from '@/common/dtos/response.dto';
import { CreatePromoCodeDto } from '@/resources/promo-code/dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from '@/resources/promo-code/dto/update-promo-code.dto';
import { PromoCode } from '@prisma/client';

@Injectable()
export class PromoCodeService {
    private readonly logger = new Logger(PromoCodeService.name);
    private readonly SERVICE_NAME = PromoCodeService.name;

    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePromoCodeDto): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.promoCode.findUnique({
                where: { code: dto.code },
            });

            if (existing) {
                const message = `PromoCode with code '${dto.code}' already exists`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new ConflictException(message);
            }

            const promoCode = await this.prisma.promoCode.create({
                data: {
                    code: dto.code,
                    name: dto.name,
                    discountType: dto.discountType,
                    discountValue: dto.discountValue,
                    isFirstOrderOnly: dto.isFirstOrderOnly ?? false,
                    minOrderAmount: dto.minOrderAmount ?? null,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                    maxTotalUses: dto.maxTotalUses ?? null,
                    maxUsesPerUser: dto.maxUsesPerUser ?? 1,
                },
            });

            const message = `PromoCode '${dto.code}' created in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: promoCode };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while creating promo code: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findAll(
        page = 1,
        limit = 20,
        includeInactive = false,
    ): Promise<IPaginatedResponse<PromoCode[]>> {
        try {
            const start = Date.now();
            const skip = (page - 1) * limit;

            const where = {
                deletedAt: null,
                ...(includeInactive ? {} : { isActive: true }),
            };

            const [promoCodes, totalItems] = await Promise.all([
                this.prisma.promoCode.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.promoCode.count({ where }),
            ]);

            const message = `${promoCodes.length} promo codes found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return {
                message,
                data: promoCodes,
                pagination: { page, offset: limit, totalItems },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching promo codes: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(id: string): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const promoCode = await this.prisma.promoCode.findFirst({
                where: { id, deletedAt: null },
            });

            if (!promoCode) {
                const message = `PromoCode #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const message = `PromoCode #${id} found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: promoCode };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching promo code #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findByCode(code: string): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const promoCode = await this.prisma.promoCode.findFirst({
                where: { code, deletedAt: null },
            });

            if (!promoCode) {
                const message = `PromoCode '${code}' not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const message = `PromoCode '${code}' found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: promoCode };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while fetching promo code '${code}': ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async update(
        id: string,
        dto: UpdatePromoCodeDto,
    ): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.promoCode.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `PromoCode #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            // Si le code change, vérifier qu'il n'est pas déjà pris
            if (dto.code && dto.code !== existing.code) {
                const conflict = await this.prisma.promoCode.findUnique({
                    where: { code: dto.code },
                });
                if (conflict) {
                    const message = `PromoCode with code '${dto.code}' already exists`;
                    this.logger.warn(message, this.SERVICE_NAME);
                    throw new ConflictException(message);
                }
            }

            const updated = await this.prisma.promoCode.update({
                where: { id },
                data: {
                    ...(dto.code !== undefined && { code: dto.code }),
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.discountType !== undefined && {
                        discountType: dto.discountType,
                    }),
                    ...(dto.discountValue !== undefined && {
                        discountValue: dto.discountValue,
                    }),
                    ...(dto.isFirstOrderOnly !== undefined && {
                        isFirstOrderOnly: dto.isFirstOrderOnly,
                    }),
                    ...(dto.minOrderAmount !== undefined && {
                        minOrderAmount: dto.minOrderAmount,
                    }),
                    ...(dto.expiresAt !== undefined && {
                        expiresAt: dto.expiresAt
                            ? new Date(dto.expiresAt)
                            : null,
                    }),
                    ...(dto.maxTotalUses !== undefined && {
                        maxTotalUses: dto.maxTotalUses,
                    }),
                    ...(dto.maxUsesPerUser !== undefined && {
                        maxUsesPerUser: dto.maxUsesPerUser,
                    }),
                    ...(dto.isActive !== undefined && {
                        isActive: dto.isActive,
                    }),
                },
            });

            const message = `PromoCode #${id} updated in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: updated };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while updating promo code #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async deactivate(id: string): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.promoCode.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `PromoCode #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            if (!existing.isActive) {
                const message = `PromoCode #${id} is already inactive`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const updated = await this.prisma.promoCode.update({
                where: { id },
                data: { isActive: false },
            });

            const message = `PromoCode #${id} deactivated in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: updated };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while deactivating promo code #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async remove(id: string): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const existing = await this.prisma.promoCode.findFirst({
                where: { id, deletedAt: null },
            });

            if (!existing) {
                const message = `PromoCode #${id} not found`;
                this.logger.warn(message, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const deleted = await this.prisma.promoCode.update({
                where: { id },
                data: { deletedAt: new Date(), isActive: false },
            });

            const message = `PromoCode #${id} deleted in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: deleted };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while deleting promo code #${id}: ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    /**
     * Valide un code promo pour un utilisateur donné.
     * Retourne le code promo si valide, lève une exception sinon.
     */
    async validate(
        code: string,
        userId: string,
        orderAmount: number,
        isFirstOrder: boolean,
    ): Promise<IResponse<PromoCode>> {
        try {
            const start = Date.now();

            const promoCode = await this.prisma.promoCode.findFirst({
                where: { code, deletedAt: null },
            });

            if (!promoCode) {
                throw new NotFoundException(`Code promo '${code}' introuvable`);
            }

            if (!promoCode.isActive) {
                throw new GoneException(`Le code promo '${code}' est désactivé`);
            }

            if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
                throw new GoneException(`Le code promo '${code}' a expiré`);
            }

            if (
                promoCode.maxTotalUses !== null &&
                promoCode.currentTotalUses >= promoCode.maxTotalUses
            ) {
                throw new GoneException(
                    `Le code promo '${code}' a atteint son nombre maximum d'utilisations`,
                );
            }

            if (promoCode.isFirstOrderOnly && !isFirstOrder) {
                throw new BadRequestException(
                    `Le code promo '${code}' est réservé à la première commande`,
                );
            }

            if (
                promoCode.minOrderAmount !== null &&
                orderAmount < promoCode.minOrderAmount
            ) {
                const minEuros = (promoCode.minOrderAmount / 100).toFixed(2);
                throw new BadRequestException(
                    `Le code promo '${code}' nécessite un panier minimum de ${minEuros}€`,
                );
            }

            const userUsageCount = await this.prisma.promoCodeUsage.count({
                where: { promoCodeId: promoCode.id, userId },
            });

            if (userUsageCount >= promoCode.maxUsesPerUser) {
                throw new BadRequestException(
                    `Vous avez déjà utilisé le code '${code}' le nombre maximum de fois autorisé`,
                );
            }

            const message = `PromoCode '${code}' validated in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);

            return { message, data: promoCode };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            const message = `Error while validating promo code '${code}': ${error.message}`;
            this.logger.error(message, error.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
