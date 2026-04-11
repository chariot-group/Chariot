import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, GoneException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);
    private readonly SERVICE_NAME = SessionService.name;

    private static readonly EXPIRATION_HOURS: number = 8;
    private static readonly EXPIRATION_SECONDS: number = (SessionService.EXPIRATION_HOURS) * 60 * 60;

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    async create(createSessionDto: CreateSessionDto, userId: string) {
        try {
            const session = await this.prisma.session.create({
                data: {
                    creatorUserId: userId,
                    creatorCampaignId: createSessionDto.campaignId,
                    status: SessionStatus.activated,
                },
                include: { participants: true },
            });

            return session;
        } catch (error: any) {
            let message: string = `Error creating session for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(id: string) {
        try {
            const session = await this.prisma.session.findFirst({
                where: { id },
                include: { participants: true },
            });

            if (!session) {
                let message: string = `Session #${id} not found`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            if (session.deletedAt !== null) {
                let message: string = `Session #${id} is deleted`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new GoneException(message);
            }

            if (session.status === SessionStatus.closed) {
                let message: string = `Session #${id} is closed`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new GoneException(message);
            }

            return session;
        } catch (error: any) {
            let message: string = `Error retrieving session #${id}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

    }

    async findAllByUser(userId: string) {
        try {
            return this.prisma.session.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        { creatorUserId: userId },
                        { participants: { some: { userId } } },
                    ],
                },
                include: { participants: true },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error: any) {
            let message: string = `Error retrieving sessions for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async launch(id: string, userId: string) {
        try {
            const session = await this.findOne(id);

            if (session.creatorUserId !== userId) {
                let message: string = `User ${userId} is not the creator of session #${id}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            if (session.status !== SessionStatus.activated) {
                let message: string = `Session #${id} cannot be launched from status "${session.status}"`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + SessionService.EXPIRATION_HOURS);

            const updated = await this.prisma.session.update({
                where: { id },
                data: {
                    status: SessionStatus.launched,
                    expiresAt,
                },
                include: { participants: true },
            });

            // Set Redis TTL pour l'expiration automatique
            await this.redisService.setSessionExpiration(id, SessionService.EXPIRATION_SECONDS);

            return updated;
        } catch (error: any) {
            let message: string = `Error launching session #${id}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async join(id: string, joinSessionDto: JoinSessionDto, userId: string) {
        try {
            const session = await this.findOne(id);

            if (session.status === SessionStatus.closed) {
                let message: string = `Session #${id} is closed, cannot join`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const alreadyJoined = session.participants.some(p => p.userId === userId);
            if (alreadyJoined) {
                let message: string = `User ${userId} is already in session #${id}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            await this.prisma.sessionParticipant.create({
                data: {
                    sessionId: id,
                    userId,
                    characterId: joinSessionDto.characterId,
                },
            });

            return await this.findOne(id);
        } catch (error: any) {
            let message: string = `Error joining session #${id} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async leave(id: string, userId: string) {
        try {
            const session = await this.findOne(id);

            const participant = session.participants.find(p => p.userId === userId);
            if (!participant) {
                let message: string = `User ${userId} is not a participant of session #${id}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            await this.prisma.sessionParticipant.delete({
                where: { id: participant.id },
            });

            // Clôturer si la session est vide et le créateur a quitté
            const remaining = session.participants.filter(p => p.userId !== userId);
            if (remaining.length === 0 && session.creatorUserId === userId) {
                return this.close(id, userId);
            }

            return this.findOne(id);
        } catch (error: any) {
            let message: string = `Error leaving session #${id} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

    }

    async close(id: string, userId: string) {
        try {
            const session = await this.findOne(id);

            if (session.creatorUserId !== userId) {
                let message: string = `User ${userId} is not the creator of session #${id}, cannot close`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            if (session.status === SessionStatus.closed) {
                let message: string = `Session #${id} is already closed`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            // Supprimer le timer Redis
            await this.redisService.clearSessionExpiration(id);

            return await this.prisma.session.update({
                where: { id },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: new Date(),
                },
                include: { participants: true },
            });
        } catch (error: any) {
            let message: string = `Error closing session #${id} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findParticipants(id: string) {
        try {
            const session = await this.prisma.session.findFirst({
                where: { id },
                select: {
                    creatorUserId: true,
                    creatorCampaignId: true,
                    participants: true,
                },
            });

            if (!session) {
                let message: string = `Session #${id} not found`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            return {
                author: {
                    userId: session.creatorUserId,
                    campaignId: session.creatorCampaignId,
                },
                participants: session.participants,
            };
        } catch (error: any) {
            let message: string = `Error retrieving participants for session #${id}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    /**
     * Appelé par Redis keyspace notification quand le TTL expire.
     * Ferme la session et retourne les IDs des participants pour éviction WS.
     */
    async expireSession(id: string): Promise<string[]> {
        try {
            const session = await this.prisma.session.findFirst({
                where: { id, deletedAt: null },
                include: { participants: true },
            });

            if (!session || session.status === SessionStatus.closed) {
                return [];
            }

            await this.prisma.session.update({
                where: { id },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: new Date(),
                },
            });

            return session.participants.map(p => p.userId);
        } catch (error: any) {
            let message: string = `Error expiring session #${id}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
