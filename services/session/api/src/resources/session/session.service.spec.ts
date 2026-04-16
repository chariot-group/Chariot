import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
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
        it('should create and return a session', async () => {
            const session = makeSession();
            mockPrismaSession.create.mockResolvedValue(session);

            const result = await service.create({ campaignId: 'camp-uuid-1' }, 'user-uuid-1');

            expect(result).toBe(session);
            expect(mockPrismaSession.create).toHaveBeenCalledWith({
                data: {
                    creatorUserId: 'user-uuid-1',
                    creatorCampaignId: 'camp-uuid-1',
                    status: SessionStatus.activated,
                },
                include: { participants: true },
            });
        });

        it('should throw InternalServerErrorException when prisma fails', async () => {
            mockPrismaSession.create.mockRejectedValue(new Error('DB error'));

            await expect(service.create({ campaignId: 'camp-1' }, 'user-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('should return the session when found and active', async () => {
            const session = makeSession();
            mockPrismaSession.findFirst.mockResolvedValue(session);

            const result = await service.findOne('sess-uuid-1');

            expect(result).toBe(session);
            expect(mockPrismaSession.findFirst).toHaveBeenCalledWith({
                where: { id: 'sess-uuid-1' },
                include: { participants: true },
            });
        });

        it('should throw InternalServerErrorException when session is null', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.findOne('sess-uuid-1')).rejects.toThrow(InternalServerErrorException);
        });

        it('should throw InternalServerErrorException when session is deleted', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ deletedAt: new Date() }));

            await expect(service.findOne('sess-uuid-1')).rejects.toThrow(InternalServerErrorException);
        });

        it('should throw InternalServerErrorException when session is closed', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ status: SessionStatus.closed }),
            );

            await expect(service.findOne('sess-uuid-1')).rejects.toThrow(InternalServerErrorException);
        });

        it('should throw InternalServerErrorException on prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB error'));

            await expect(service.findOne('sess-uuid-1')).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ── findAllByUser ─────────────────────────────────────────────────────────

    describe('findAllByUser', () => {
        it('should return all sessions for a user', async () => {
            const sessions = [makeSession()];
            mockPrismaSession.findMany.mockResolvedValue(sessions);

            const result = await service.findAllByUser('user-uuid-1');

            expect(result).toBe(sessions);
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
            // `return promise` (no await) bypasses try-catch for rejections;
            // a synchronous throw from findMany IS caught by the catch block.
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

            const result = await service.launch('sess-uuid-1', 'user-uuid-1');

            expect(result).toBe(launched);
            expect(mockPrismaSession.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'sess-uuid-1' },
                    data: expect.objectContaining({ status: SessionStatus.launched }),
                }),
            );
            expect(mockRedis.setSessionExpiration).toHaveBeenCalledWith('sess-uuid-1', 28800);
        });

        it('should throw InternalServerErrorException when findOne fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.launch('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when user is not the creator', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'other-user' }),
            );

            await expect(service.launch('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when session is not activated', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1', status: SessionStatus.launched }),
            );

            await expect(service.launch('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when prisma update fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1' }),
            );
            mockPrismaSession.update.mockRejectedValue(new Error('DB error'));

            await expect(service.launch('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── join ──────────────────────────────────────────────────────────────────

    describe('join', () => {
        it('should add the user to the session and return updated session', async () => {
            const session = makeSession({ participants: [] });
            const updated = makeSession({ participants: [makeParticipant({ userId: 'user-uuid-2' })] });
            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.create.mockResolvedValue({});

            const result = await service.join('sess-uuid-1', { characterId: 'char-1' }, 'user-uuid-2');

            expect(result).toBe(updated);
            expect(mockPrismaParticipant.create).toHaveBeenCalledWith({
                data: {
                    sessionId: 'sess-uuid-1',
                    userId: 'user-uuid-2',
                    characterId: 'char-1',
                },
            });
        });

        it('should throw InternalServerErrorException when findOne fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.join('sess-uuid-1', { characterId: 'char-1' }, 'user-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when session is closed (bypassing findOne)', async () => {
            jest.spyOn(service, 'findOne').mockResolvedValueOnce(
                makeSession({ status: SessionStatus.closed }) as any,
            );

            await expect(service.join('sess-uuid-1', { characterId: 'char-1' }, 'user-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when user is already in session', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'user-uuid-2' })],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(
                service.join('sess-uuid-1', { characterId: 'char-1' }, 'user-uuid-2'),
            ).rejects.toThrow(InternalServerErrorException);
        });

        it('should throw InternalServerErrorException when participant create fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ participants: [] }));
            mockPrismaParticipant.create.mockRejectedValue(new Error('DB error'));

            await expect(
                service.join('sess-uuid-1', { characterId: 'char-1' }, 'user-uuid-2'),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ── leave ─────────────────────────────────────────────────────────────────

    describe('leave', () => {
        it('should remove participant and return updated session (others remain)', async () => {
            const participant1 = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const participant2 = makeParticipant({ id: 'part-2', userId: 'user-uuid-2' });
            const session = makeSession({ participants: [participant1, participant2] });
            const updated = makeSession({ participants: [participant2] });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});

            const result = await service.leave('sess-uuid-1', 'user-uuid-1');

            expect(result).toBe(updated);
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

            // findOne in leave + findOne in close
            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(session);
            mockPrismaParticipant.delete.mockResolvedValue({});
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockResolvedValue(closed);

            const result = await service.leave('sess-uuid-1', 'user-uuid-1');

            expect(result).toBe(closed);
            expect(mockRedis.clearSessionExpiration).toHaveBeenCalledWith('sess-uuid-1');
        });

        it('should throw InternalServerErrorException when findOne fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.leave('sess-uuid-1', 'user-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when user is not a participant', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'other-user' })],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(service.leave('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when participant delete fails', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({ participants: [participant] });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockPrismaParticipant.delete.mockRejectedValue(new Error('DB error'));

            await expect(service.leave('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── close ─────────────────────────────────────────────────────────────────

    describe('close', () => {
        it('should close the session and clear Redis expiration', async () => {
            const session = makeSession({ creatorUserId: 'user-uuid-1' });
            const closed = makeSession({
                creatorUserId: 'user-uuid-1',
                status: SessionStatus.closed,
                deletedAt: new Date(),
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockResolvedValue(closed);

            const result = await service.close('sess-uuid-1', 'user-uuid-1');

            expect(result).toBe(closed);
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

        it('should throw InternalServerErrorException when findOne fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.close('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when user is not the creator', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'other-user' }),
            );

            await expect(service.close('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when session is already closed (bypassing findOne)', async () => {
            jest.spyOn(service, 'findOne').mockResolvedValueOnce(
                makeSession({ creatorUserId: 'user-uuid-1', status: SessionStatus.closed }) as any,
            );

            await expect(service.close('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException when prisma update fails', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1' }),
            );
            mockRedis.clearSessionExpiration.mockResolvedValue(undefined);
            mockPrismaSession.update.mockRejectedValue(new Error('DB error'));

            await expect(service.close('sess-uuid-1', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });

    // ── findParticipants ──────────────────────────────────────────────────────

    describe('findParticipants', () => {
        it('should return participants details when session found', async () => {
            const participants = [makeParticipant()];
            mockPrismaSession.findFirst.mockResolvedValue({
                creatorUserId: 'user-uuid-1',
                creatorCampaignId: 'camp-uuid-1',
                participants,
            });

            const result = await service.findParticipants('sess-uuid-1');

            expect(result).toEqual({
                author: { userId: 'user-uuid-1', campaignId: 'camp-uuid-1' },
                participants,
            });
            expect(mockPrismaSession.findFirst).toHaveBeenCalledWith({
                where: { id: 'sess-uuid-1' },
                select: {
                    creatorUserId: true,
                    creatorCampaignId: true,
                    participants: true,
                },
            });
        });

        it('should throw InternalServerErrorException when session not found', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(service.findParticipants('sess-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should throw InternalServerErrorException on prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB error'));

            await expect(service.findParticipants('sess-uuid-1')).rejects.toThrow(
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
