import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, GoneException, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionStatus } from '@prisma/client';
import { Session, SessionParticipant, SessionWithParticipants, SessionParticipantsDetails } from '@/resources/session/entities/session.model';



@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);
    private readonly SERVICE_NAME = SessionService.name;

    private static readonly EXPIRATION_HOURS: number = 8;
    private static readonly EXPIRATION_SECONDS: number = (SessionService.EXPIRATION_HOURS) * 60 * 60;

    private static readonly CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    private static readonly CODE_LENGTH = 6;

    private generateCode(): string {
        const alphabet = SessionService.CODE_ALPHABET;
        const bytes = randomBytes(SessionService.CODE_LENGTH);
        return Array.from(bytes)
            .map((b) => alphabet[b % alphabet.length])
            .join('');
    }

    private async generateUniqueCode(): Promise<string> {
        let code: string;
        let exists: boolean;
        do {
            code = this.generateCode();
            exists = !!(await this.prisma.session.findFirst({ where: { code } }));
        } while (exists);
        return code;
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    async create(createSessionDto: CreateSessionDto, userId: string): Promise<SessionWithParticipants> {
        try {
            const code = await this.generateUniqueCode();

            const session: SessionWithParticipants = await this.prisma.session.create({
                data: {
                    code,
                    creatorUserId: userId,
                    creatorCampaignId: createSessionDto.campaignId,
                    status: SessionStatus.activated,
                },
                include: { participants: true },
            });

            return session;
        } catch (error: any) {
            const message: string = `Error creating session for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(code: string): Promise<SessionWithParticipants> {
        try {
            const session: SessionWithParticipants | null = await this.prisma.session.findFirst({
                where: { code },
                include: { participants: true },
            });

            if (!session) {
                const message: string = `Session with code ${code} not found`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            if (session.deletedAt !== null) {
                const message: string = `Session with code ${code} is deleted`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new GoneException(message);
            }

            if (session.status === SessionStatus.closed) {
                const message: string = `Session with code ${code} is closed`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new GoneException(message);
            }

            return session;
        } catch (error: any) {
            const message: string = `Error retrieving session with code ${code}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

    }

    async findAllByUser(userId: string): Promise<SessionWithParticipants[]> {
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
            const message: string = `Error retrieving sessions for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async launch(code: string, userId: string): Promise<SessionWithParticipants> {
        try {
            const session: SessionWithParticipants = await this.findOne(code);

            if (session.creatorUserId !== userId) {
                let message: string = `User ${userId} is not the creator of session with code ${code}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            if (session.status !== SessionStatus.activated) {
                let message: string = `Session with code ${code} cannot be launched from status "${session.status}"`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const expiresAt: Date = new Date();
            expiresAt.setHours(expiresAt.getHours() + SessionService.EXPIRATION_HOURS);

            const updated: SessionWithParticipants = await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    status: SessionStatus.launched,
                    expiresAt,
                },
                include: { participants: true },
            });

            // Set Redis TTL pour l'expiration automatique
            await this.redisService.setSessionExpiration(session.id, SessionService.EXPIRATION_SECONDS);

            return updated;
        } catch (error: any) {
            const message: string = `Error launching session with code ${code}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async join(code: string, joinSessionDto: JoinSessionDto, userId: string): Promise<SessionWithParticipants> {
        try {
            const session: SessionWithParticipants = await this.findOne(code);

            if (session.status === SessionStatus.closed) {
                const message: string = `Session with code ${code} is closed, cannot join`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            const alreadyJoined: boolean = session.participants.some(p => p.userId === userId);
            if (alreadyJoined) {
                const message: string = `User ${userId} is already in session with code ${code}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            await this.prisma.sessionParticipant.create({
                data: {
                    sessionId: session.id,
                    userId,
                    characterId: joinSessionDto.characterId,
                },
            });

            return await this.findOne(code);
        } catch (error: any) {
            const message: string = `Error joining session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async leave(code: string, userId: string): Promise<SessionWithParticipants> {
        try {
            const session: SessionWithParticipants = await this.findOne(code);

            const participant: SessionParticipant | undefined = session.participants.find(p => p.userId === userId);
            if (!participant) {
                const message: string = `User ${userId} is not a participant of session with code ${code}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            await this.prisma.sessionParticipant.delete({
                where: { id: participant.id },
            });

            // Clôturer si la session est vide et le créateur a quitté
            const remaining: SessionParticipant[] = session.participants.filter(p => p.userId !== userId);
            if (remaining.length === 0 && session.creatorUserId === userId) {
                return this.close(code, userId);
            }

            return this.findOne(code);
        } catch (error: any) {
            const message: string = `Error leaving session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }

    }

    async close(code: string, userId: string): Promise<SessionWithParticipants> {
        try {
            const session: SessionWithParticipants = await this.findOne(code);

            if (session.creatorUserId !== userId) {
                const message: string = `User ${userId} is not the creator of session with code ${code}, cannot close`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            if (session.status === SessionStatus.closed) {
                const message: string = `Session with code ${code} is already closed`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            // Supprimer le timer Redis
            await this.redisService.clearSessionExpiration(session.id);

            return await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: new Date(),
                },
                include: { participants: true },
            });
        } catch (error: any) {
            const message: string = `Error closing session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findParticipants(code: string): Promise<SessionParticipantsDetails> {
        try {
            const session: {
                creatorUserId: string;
                creatorCampaignId: string;
                participants: SessionParticipant[];
            } | null = await this.prisma.session.findFirst({
                where: { code },
                select: {
                    creatorUserId: true,
                    creatorCampaignId: true,
                    participants: true,
                },
            });

            if (!session) {
                const message: string = `Session with code ${code} not found`;
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
            const message: string = `Error retrieving participants for session with code ${code}: ${error.message}`;
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
            const session: SessionWithParticipants | null = await this.prisma.session.findFirst({
                where: { id, deletedAt: null },
                include: { participants: true },
            });

            if (!session) {
                this.logger.warn(`Session #${id} already processed or deleted.`, this.SERVICE_NAME);
                return [];
            }

            const updatedSession: SessionWithParticipants = await this.prisma.session.update({
                where: { id },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: new Date(),
                },
                include: { participants: true },
            });

            this.logger.log(`Session #${id} expired and closed.`, this.SERVICE_NAME);

            return updatedSession.participants.map((p: SessionParticipant) => p.userId);
        } catch (error: any) {
            const message: string = `Error expiring session #${id}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }
}
