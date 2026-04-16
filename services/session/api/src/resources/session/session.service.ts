import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    GoneException,
    InternalServerErrorException,
    HttpException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionStatus } from '@prisma/client';
import { SessionParticipant, SessionWithParticipants, SessionParticipantsDetails } from '@/resources/session/entities/session.model';
import { IResponse } from '@/common/dtos/response.dto';

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

    private async _findSession(code: string): Promise<SessionWithParticipants> {
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
    }

    async create(createSessionDto: CreateSessionDto, userId: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
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

            const message: string = `Session #${session.id} created in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: session };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error creating session for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findOne(code: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
            const session: SessionWithParticipants = await this._findSession(code);

            const message: string = `Session with code ${code} found in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: session };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error retrieving session with code ${code}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findAllByUser(userId: string): Promise<IResponse<SessionWithParticipants[]>> {
        try {
            const start: number = Date.now();
            const sessions: SessionWithParticipants[] = await this.prisma.session.findMany({
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

            const message: string = `Found ${sessions.length} session(s) for user ${userId} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: sessions };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error retrieving sessions for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async launch(code: string, userId: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
            const session: SessionWithParticipants = await this._findSession(code);

            if (session.creatorUserId !== userId) {
                const message: string = `User ${userId} is not the creator of session with code ${code}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            if (session.status !== SessionStatus.activated) {
                const message: string = `Session with code ${code} cannot be launched from status "${session.status}"`;
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

            await this.redisService.setSessionExpiration(session.id, SessionService.EXPIRATION_SECONDS);

            const message: string = `Session with code ${code} launched in ${Date.now() - start}ms, expires at ${updated.expiresAt.toISOString()}`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: updated };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error launching session with code ${code}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async join(code: string, joinSessionDto: JoinSessionDto, userId: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
            const session: SessionWithParticipants = await this._findSession(code);

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

            const updated: SessionWithParticipants = await this._findSession(code);
            const message: string = `User ${userId} joined session with code ${code} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: updated };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error joining session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async leave(code: string, userId: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
            const session: SessionWithParticipants = await this._findSession(code);

            const participant: SessionParticipant | undefined = session.participants.find(p => p.userId === userId);

            if (!participant) {
                const message: string = `User ${userId} is not a participant of session with code ${code}`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new BadRequestException(message);
            }

            await this.prisma.sessionParticipant.delete({
                where: { id: participant.id },
            });

            const remainingCount: number = session.participants.length - 1;
            const isCreator: boolean = session.creatorUserId === userId;

            // Clôturer si le créateur quitte et qu'il n'y a plus de participants
            if (isCreator && remainingCount === 0) {
                await this.redisService.clearSessionExpiration(session.id);
                const closed: SessionWithParticipants = await this.prisma.session.update({
                    where: { id: session.id },
                    data: { status: SessionStatus.closed, deletedAt: new Date() },
                    include: { participants: true },
                });
                const message: string = `User ${userId} left and closed session with code ${code} in ${Date.now() - start}ms`;
                this.logger.verbose(message, this.SERVICE_NAME);
                return { message, data: closed };
            }

            const updated: SessionWithParticipants = await this._findSession(code);
            const message: string = `User ${userId} left session with code ${code} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: updated };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error leaving session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async close(code: string, userId: string): Promise<IResponse<SessionWithParticipants>> {
        try {
            const start: number = Date.now();
            const session: SessionWithParticipants = await this._findSession(code);

            if (session.creatorUserId !== userId) {
                const message: string = `User ${userId} is not the creator of session with code ${code}, cannot close`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new ForbiddenException(message);
            }

            await this.redisService.clearSessionExpiration(session.id);

            const updated: SessionWithParticipants = await this.prisma.session.update({
                where: { id: session.id },
                data: { status: SessionStatus.closed, deletedAt: new Date() },
                include: { participants: true },
            });

            const message: string = `Session with code ${code} closed in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: updated };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            const message: string = `Error closing session with code ${code} for user ${userId}: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    async findParticipants(code: string): Promise<IResponse<SessionParticipantsDetails>> {
        try {
            const start: number = Date.now();
            const session = await this.prisma.session.findFirst({
                where: { code },
                include: { participants: true },
            });

            if (!session) {
                const message: string = `Session with code ${code} not found`;
                this.logger.error(message, null, this.SERVICE_NAME);
                throw new NotFoundException(message);
            }

            const result: SessionParticipantsDetails = {
                author: {
                    userId: session.creatorUserId,
                    campaignId: session.creatorCampaignId,
                },
                participants: session.participants,
            };

            const message: string = `Found ${result.participants.length} participant(s) for session with code ${code} in ${Date.now() - start}ms`;
            this.logger.verbose(message, this.SERVICE_NAME);
            return { message, data: result };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
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
