import { Test, TestingModule } from '@nestjs/testing';
import {
    InternalServerErrorException,
    NotFoundException,
    GoneException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { SessionService } from '@/resources/session/session.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSession(overrides: Record<string, any> = {}) {
    return {
        id: 'sess-uuid-1',
        creatorUserId: 'user-uuid-1',
        creatorCampaignId: 'camp-uuid-1',
        status: SessionStatus.activated,
        deletedAt: null,
        expiresAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        participants: [],
        ...overrides,
    };
}

function makeParticipant(overrides: Record<string, any> = {}) {
    return {
        id: 'part-uuid-1',
        sessionId: 'sess-uuid-1',
        userId: 'user-uuid-2',
        characterId: 'char-uuid-1',
        createdAt: new Date('2024-01-01'),
        ...overrides,
    };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrismaSession = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
};

const mockPrismaParticipant = {
    create: jest.fn(),
    delete: jest.fn(),
};

const mockRedis = {
    setSessionExpiration: jest.fn(),
    clearSessionExpiration: jest.fn(),
    onSessionExpired: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SessionService', () => {
    let service: SessionService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: PrismaService,
                    useValue: {
                        session: mockPrismaSession,
                        sessionParticipant: mockPrismaParticipant,
                    },
                },
                {
                    provide: RedisService,
                    useValue: mockRedis,
                },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe('create', () => {
        it('should create and return a wrapped session response', async () => {
            const session = makeSession();
            mockPrismaSession.findFirst.mockResolvedValueOnce(null); // unique code check
            mockPrismaSession.create.mockResolvedValue(session);

            const result = await service.create({ campaignId: 'camp-uuid-1' }, 'user-uuid-1');

            expect(result.data).toBe(session);
            expect(result.message).toContain('Session #sess-uuid-1 created');
            expect(mockPrismaSession.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        creatorUserId: 'user-uuid-1',
                        creatorCampaignId: 'camp-uuid-1',
                        status: SessionStatus.activated,
                    }),
                    include: { participants: true },
                }),
            );
        });

        it('should throw InternalServerErrorException when prisma fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValueOnce(null);
            mockPrismaSession.create.mockRejectedValue(new Error('DB error'));

            await expect(service.create({ campaignId: 'camp-1' }, 'user-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('should return a wrapped session response when found and active', async () => {
            const session = makeSession();
            mockPrismaSession.findFirst.mockResolvedValue(session);

            const result = await service.findOne('CODE123');

            expect(result.data).toBe(session);
            expect(result.message).toContain('CODE123 found');
            expect(mockPrismaSession.findFirst).toHaveBeenCalledWith({
                where: { code: 'CODE123' },
                include: { participants: true },
            });
        });

        it('should throw NotFoundException when session is null', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.findOne('CODE123')).rejects.toThrow(NotFoundException);
        });

        it('should throw GoneException when session is deleted', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ deletedAt: new Date() }));

            await expect(service.findOne('CODE123')).rejects.toThrow(GoneException);
        });

        it('should throw GoneException when session is closed', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ status: SessionStatus.closed }),
            );

            await expect(service.findOne('CODE123')).rejects.toThrow(GoneException);
        });

        it('should throw InternalServerErrorException on prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB error'));

            await expect(service.findOne('CODE123')).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ── findAllByUser ─────────────────────────────────────────────────────────

    describe('findAllByUser', () => {
        it('should return a wrapped sessions list response', async () => {
            const sessions = [makeSession()];
            mockPrismaSession.findMany.mockResolvedValue(sessions);

            const result = await service.findAllByUser('user-uuid-1');

            expect(result.data).toBe(sessions);
            expect(result.message).toContain('Found 1 session(s)');
            expect(mockPrismaSession.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { creatorUserId: 'user-uuid-1' },
                        { participants: { some: { userId: 'user-uuid-1' } } },
                    ],
                },
                include: { participants: true },
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should throw InternalServerErrorException on synchronous prisma error', async () => {
            mockPrismaSession.findMany.mockImplementation(() => {
                throw new Error('sync DB error');
            });

            await expect(service.findAllByUser('user-1')).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ── launch ────────────────────────────────────────────────────────────────

    describe('launch', () => {
        it('should launch the session and set Redis expiration', async () => {
            const session = makeSession({ creatorUserId: 'user-uuid-1' });
            const launched = makeSession({ status: SessionStatus.launched, expiresAt: new Date() });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockPrismaSession.update.mockResolvedValue(launched);
            mockRedis.setSessionExpiration.mockResolvedValue(undefined);

            const result = await service.launch('CODE123', 'user-uuid-1');

            expect(result.data).toBe(launched);
            expect(result.message).toContain('CODE123 launched');
            expect(mockPrismaSession.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'sess-uuid-1' },
                    data: expect.objectContaining({ status: SessionStatus.launched }),
                }),
            );
            expect(mockRedis.setSessionExpiration).toHaveBeenCalledWith('sess-uuid-1', 28800);
        });

        it('should throw NotFoundException when session does not exist', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.launch('CODE123', 'user-uuid-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the creator', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'other-user' }),
            );

            await expect(service.launch('CODE123', 'user-uuid-1')).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when session is not activated', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1', status: SessionStatus.launched }),
            );

            await expect(service.launch('CODE123', 'user-uuid-1')).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException when prisma update fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1' }),
            );
            mockPrismaSession.update.mockRejectedValue(new Error('DB error'));

            await expect(service.launch('CODE123', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── join ──────────────────────────────────────────────────────────────────

    describe('join', () => {
        it('should add the user to the session and return a wrapped response', async () => {
            const session = makeSession({ participants: [] });
            const updated = makeSession({ participants: [makeParticipant({ userId: 'user-uuid-2' })] });
            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.create.mockResolvedValue({});

            const result = await service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2');

            expect(result.data).toBe(updated);
            expect(result.message).toContain('user-uuid-2 joined');
            expect(mockPrismaParticipant.create).toHaveBeenCalledWith({
                data: {
                    sessionId: 'sess-uuid-1',
                    userId: 'user-uuid-2',
                    characterId: 'char-1',
                },
            });
        });

        it('should throw NotFoundException when session does not exist', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.join('CODE123', { characterId: 'char-1' }, 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw GoneException when session is deleted', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ deletedAt: new Date() }));

            await expect(service.join('CODE123', { characterId: 'char-1' }, 'user-1')).rejects.toThrow(
                GoneException,
            );
        });

        it('should throw BadRequestException when user is already in session', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'user-uuid-2' })],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(
                service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException when participant create fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ participants: [] }));
            mockPrismaParticipant.create.mockRejectedValue(new Error('DB error'));

            await expect(
                service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2'),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ── leave ─────────────────────────────────────────────────────────────────

    describe('leave', () => {
        it('should remove participant and return a wrapped response (others remain)', async () => {
            const participant1 = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const participant2 = makeParticipant({ id: 'part-2', userId: 'user-uuid-2' });
            const session = makeSession({ participants: [participant1, participant2] });
            const updated = makeSession({ participants: [participant2] });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(result.data).toBe(updated);
            expect(result.message).toContain('user-uuid-1 left');
            expect(mockPrismaParticipant.delete).toHaveBeenCalledWith({
                where: { id: 'part-1' },
            });
        });

        it('should close session when last participant (creator) leaves', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({
                creatorUserId: 'user-uuid-1',
                participants: [participant],
            });
            const closed = makeSession({
                creatorUserId: 'user-uuid-1',
                status: SessionStatus.closed,
                deletedAt: new Date(),
            });

            mockPrismaSession.findFirst.mockResolvedValueOnce(session);
            mockPrismaParticipant.delete.mockResolvedValue({});
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockResolvedValue(closed);

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(result.data).toBe(closed);
            expect(result.message).toContain('left and closed');
            expect(mockRedis.clearSessionExpiration).toHaveBeenCalledWith('sess-uuid-1');
        });

        it('should throw NotFoundException when session does not exist', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.leave('CODE123', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when user is not a participant', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'other-user' })],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(service.leave('CODE123', 'user-uuid-1')).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException when participant delete fails', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({ participants: [participant] });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockPrismaParticipant.delete.mockRejectedValue(new Error('DB error'));

            await expect(service.leave('CODE123', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── close ─────────────────────────────────────────────────────────────────

    describe('close', () => {
        it('should close the session and return a wrapped response', async () => {
            const session = makeSession({ creatorUserId: 'user-uuid-1' });
            const closed = makeSession({
                creatorUserId: 'user-uuid-1',
                status: SessionStatus.closed,
                deletedAt: new Date(),
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockResolvedValue(closed);

            const result = await service.close('CODE123', 'user-uuid-1');

            expect(result.data).toBe(closed);
            expect(result.message).toContain('CODE123 closed');
            expect(mockRedis.clearSessionExpiration).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockPrismaSession.update).toHaveBeenCalledWith({
                where: { id: 'sess-uuid-1' },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: expect.any(Date),
                },
                include: { participants: true },
            });
        });

        it('should throw NotFoundException when session does not exist', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.close('CODE123', 'user-uuid-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the creator', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'other-user' }),
            );

            await expect(service.close('CODE123', 'user-uuid-1')).rejects.toThrow(ForbiddenException);
        });

        it('should throw GoneException when session is already closed', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1', status: SessionStatus.closed }),
            );

            await expect(service.close('CODE123', 'user-uuid-1')).rejects.toThrow(GoneException);
        });

        it('should throw InternalServerErrorException when prisma update fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1' }),
            );
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockRejectedValue(new Error('DB error'));

            await expect(service.close('CODE123', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── findParticipants ──────────────────────────────────────────────────────

    describe('findParticipants', () => {
        it('should return a wrapped participants details response', async () => {
            const participants = [makeParticipant()];
            mockPrismaSession.findFirst.mockResolvedValue({
                creatorUserId: 'user-uuid-1',
                creatorCampaignId: 'camp-uuid-1',
                participants,
            });

            const result = await service.findParticipants('CODE123');

            expect(result.data).toEqual({
                author: { userId: 'user-uuid-1', campaignId: 'camp-uuid-1' },
                participants,
            });
            expect(result.message).toContain('Found 1 participant(s)');
            expect(mockPrismaSession.findFirst).toHaveBeenCalledWith({
                where: { code: 'CODE123' },
                include: { participants: true },
            });
        });

        it('should throw NotFoundException when session is not found', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.findParticipants('CODE123')).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB error'));

            await expect(service.findParticipants('CODE123')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── expireSession ─────────────────────────────────────────────────────────

    describe('expireSession', () => {
        it('should close the session and return participant user IDs', async () => {
            const participants = [
                makeParticipant({ userId: 'user-a' }),
                makeParticipant({ userId: 'user-b' }),
            ];
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ participants }));
            mockPrismaSession.update.mockResolvedValue(
                makeSession({ status: SessionStatus.closed, participants }),
            );

            const result = await service.expireSession('sess-uuid-1');

            expect(result).toEqual(['user-a', 'user-b']);
            expect(mockPrismaSession.update).toHaveBeenCalledWith({
                where: { id: 'sess-uuid-1' },
                data: {
                    status: SessionStatus.closed,
                    deletedAt: expect.any(Date),
                },
                include: { participants: true },
            });
        });

        it('should return empty array when session is not found', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            const result = await service.expireSession('sess-uuid-1');

            expect(result).toEqual([]);
            expect(mockPrismaSession.update).not.toHaveBeenCalled();
        });

        it('should throw InternalServerErrorException on prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB error'));

            await expect(service.expireSession('sess-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});
