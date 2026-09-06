import { Test, TestingModule } from '@nestjs/testing';
import {
    InternalServerErrorException,
    NotFoundException,
    GoneException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { ParticipantStatus, SessionStatus } from '@prisma/client';
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
    update: jest.fn(),
    upsert: jest.fn(),
};

const mockRedis = {
    setSessionExpiration: jest.fn(),
    clearSessionExpiration: jest.fn(),
    onSessionExpired: jest.fn(),
    clearUserTokens: jest.fn().mockResolvedValue({ tokens: {}, released: 0 }),
    clampTokensToMax: jest.fn().mockImplementation(async (_code: string, maxSlots: number) => ({
        tokens: {},
        released: 0,
        maxSlots,
    })),
    getTokens: jest.fn().mockResolvedValue({}),
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
            mockRedis.getTokens.mockResolvedValue({});

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

        it('guard FR-session-lobby-wheel-quota-invariant: rejects launch when deposited !== quota', async () => {
            const participants = [
                makeParticipant({ id: 'part-1', userId: 'user-uuid-1' }),
                makeParticipant({ id: 'part-2', userId: 'user-uuid-2' }),
            ];
            mockPrismaSession.findFirst.mockResolvedValue(
                makeSession({ creatorUserId: 'user-uuid-1', participants }),
            );
            mockRedis.getTokens.mockResolvedValue({ 'user-uuid-1': 3 });

            await expect(service.launch('CODE123', 'user-uuid-1')).rejects.toThrow(BadRequestException);
            expect(mockPrismaSession.update).not.toHaveBeenCalled();
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
            mockRedis.getTokens.mockResolvedValue({});
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
                    status: ParticipantStatus.connected,
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

        it('should throw ForbiddenException when session is launched and user is not a participant', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(makeSession({ status: SessionStatus.launched, participants: [] }));

            await expect(service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2')).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should allow reconnection when session is launched and user is already a participant', async () => {
            const existingParticipant = makeParticipant({ userId: 'user-uuid-2' });
            const session = makeSession({ status: SessionStatus.launched, participants: [existingParticipant] });
            const updated = makeSession({ status: SessionStatus.launched, participants: [existingParticipant] });
            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.upsert.mockResolvedValue({});
            const result = await service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2');

            expect(result.data).toBe(updated);
        });

        it('should reconnect user and return updated session when user is already in session', async () => {
            const existingParticipant = makeParticipant({ userId: 'user-uuid-2' });
            const session = makeSession({ participants: [existingParticipant] });
            const updated = makeSession({ participants: [existingParticipant] });
            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.update.mockResolvedValue({});

            const result = await service.join('CODE123', { characterId: 'char-1' }, 'user-uuid-2');

            expect(result.data).toBe(updated);
            expect(mockPrismaParticipant.update).toHaveBeenCalled();
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
            mockRedis.clearUserTokens.mockResolvedValue({
                tokens: { 'user-uuid-2': 1 },
                released: 2,
            });
            mockRedis.clampTokensToMax.mockResolvedValue({
                tokens: { 'user-uuid-2': 1 },
                released: 0,
            });

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(result.data).toBe(updated);
            expect(result.message).toContain('user-uuid-1 left');
            expect(result.tokensByUser).toEqual({ 'user-uuid-2': 1 });
            expect(mockRedis.clearUserTokens).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(mockRedis.clampTokensToMax).toHaveBeenCalledWith('CODE123', 1);
            expect(mockPrismaParticipant.delete).toHaveBeenCalledWith({
                where: { id: 'part-1' },
            });
        });

        it('nominal FR-session-lobby-wheel-leave-refund: releases reserved wheels when session is activated', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({
                status: SessionStatus.activated,
                participants: [participant],
            });
            const updated = makeSession({ status: SessionStatus.activated, participants: [] });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});
            mockRedis.clearUserTokens.mockResolvedValue({
                tokens: { 'other-user': 1 },
                released: 3,
            });
            mockRedis.clampTokensToMax.mockResolvedValue({
                tokens: {},
                released: 1,
            });

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(mockRedis.clearUserTokens).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(mockRedis.clampTokensToMax).toHaveBeenCalledWith('CODE123', 0);
            expect(result.tokensByUser).toEqual({});
        });

        it('nominal FR-session-lobby-wheel-quota-invariant: clamps excess after leave', async () => {
            const participant1 = makeParticipant({ id: 'part-1', userId: 'user-a' });
            const participant2 = makeParticipant({ id: 'part-2', userId: 'user-b' });
            const participant3 = makeParticipant({ id: 'part-3', userId: 'user-c' });
            const session = makeSession({
                participants: [participant1, participant2, participant3],
            });
            const updated = makeSession({ participants: [participant1, participant2] });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});
            mockRedis.clearUserTokens.mockResolvedValue({
                tokens: { 'user-a': 2, 'user-b': 1 },
                released: 0,
            });
            mockRedis.clampTokensToMax.mockResolvedValue({
                tokens: { 'user-a': 1, 'user-b': 1 },
                released: 1,
            });

            const result = await service.leave('CODE123', 'user-c');

            expect(mockRedis.clampTokensToMax).toHaveBeenCalledWith('CODE123', 2);
            expect(result.tokensByUser).toEqual({ 'user-a': 1, 'user-b': 1 });
        });

        it('edge: leave with zero reserved wheels still returns tokensByUser for activated session', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({ participants: [participant] });
            const updated = makeSession({ participants: [] });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});
            mockRedis.clearUserTokens.mockResolvedValue({ tokens: {}, released: 0 });
            mockRedis.clampTokensToMax.mockResolvedValue({ tokens: {}, released: 0 });

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(mockRedis.clearUserTokens).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(result.tokensByUser).toEqual({});
        });

        it('guard: does not release wheels when session is already launched', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({
                status: SessionStatus.launched,
                participants: [participant],
            });
            const updated = makeSession({
                status: SessionStatus.launched,
                participants: [],
            });

            mockPrismaSession.findFirst
                .mockResolvedValueOnce(session)
                .mockResolvedValueOnce(updated);
            mockPrismaParticipant.delete.mockResolvedValue({});

            const result = await service.leave('CODE123', 'user-uuid-1');

            expect(mockRedis.clearUserTokens).not.toHaveBeenCalled();
            expect(mockRedis.clampTokensToMax).not.toHaveBeenCalled();
            expect(result.tokensByUser).toBeUndefined();
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
            expect(mockRedis.clearUserTokens).not.toHaveBeenCalled();
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

        it('failure: Redis clear failure surfaces as InternalServerErrorException', async () => {
            const participant = makeParticipant({ id: 'part-1', userId: 'user-uuid-1' });
            const session = makeSession({ participants: [participant] });
            mockPrismaSession.findFirst.mockResolvedValue(session);
            mockRedis.clearUserTokens.mockRejectedValue(new Error('Redis down'));

            await expect(service.leave('CODE123', 'user-uuid-1')).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(mockPrismaParticipant.delete).not.toHaveBeenCalled();
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

    // ── validateGmOwnership ───────────────────────────────────────────────────

    describe('validateGmOwnership', () => {
        it('should return ok when requester is participant and targetUserId is the GM', async () => {
            const participant = makeParticipant({ userId: 'user-uuid-2' });
            const session = makeSession({
                creatorUserId: 'gm-uuid-1',
                participants: [participant],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            const result = await service.validateGmOwnership('CODE123', 'user-uuid-2', 'gm-uuid-1');

            expect(result.data).toEqual({ ok: true });
            expect(result.message).toBe('Access granted');
        });

        it('should return ok when the GM validates their own ownership', async () => {
            const gmParticipant = makeParticipant({ userId: 'gm-uuid-1', status: 'gameMaster' });
            const session = makeSession({
                creatorUserId: 'gm-uuid-1',
                participants: [gmParticipant],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            const result = await service.validateGmOwnership('CODE123', 'gm-uuid-1', 'gm-uuid-1');

            expect(result.data).toEqual({ ok: true });
        });

        it('should throw ForbiddenException when requester is not a participant', async () => {
            const session = makeSession({
                creatorUserId: 'gm-uuid-1',
                participants: [makeParticipant({ userId: 'other-user' })],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(
                service.validateGmOwnership('CODE123', 'not-a-participant', 'gm-uuid-1'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when targetUserId is not the GM', async () => {
            const participant = makeParticipant({ userId: 'user-uuid-2' });
            const session = makeSession({
                creatorUserId: 'gm-uuid-1',
                participants: [participant],
            });
            mockPrismaSession.findFirst.mockResolvedValue(session);

            await expect(
                service.validateGmOwnership('CODE123', 'user-uuid-2', 'some-player-uuid'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when session does not exist', async () => {
            mockPrismaSession.findFirst.mockResolvedValue(null);

            await expect(
                service.validateGmOwnership('BADCODE', 'user-uuid-2', 'gm-uuid-1'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on unexpected prisma error', async () => {
            mockPrismaSession.findFirst.mockRejectedValue(new Error('DB failure'));

            await expect(
                service.validateGmOwnership('CODE123', 'user-uuid-2', 'gm-uuid-1'),
            ).rejects.toThrow(InternalServerErrorException);
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
