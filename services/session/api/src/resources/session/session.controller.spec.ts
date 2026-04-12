import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from '@/resources/session/session.controller';
import { SessionService } from '@/resources/session/session.service';
import { SessionStatus } from '@prisma/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSession(overrides: Record<string, any> = {}) {
    return {
        id: 'sess-uuid-1',
        creatorUserId: 'user-uuid-1',
        creatorCampaignId: 'camp-uuid-1',
        status: SessionStatus.activated,
        deletedAt: null,
        expiresAt: new Date('2024-01-01T10:00:00Z'),
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

function makeReq(overrides: Record<string, any> = {}) {
    return {
        user: {
            keycloakId: 'user-uuid-1',
            username: 'testuser',
            ...overrides,
        },
    };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSessionService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAllByUser: jest.fn(),
    findParticipants: jest.fn(),
    launch: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    close: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SessionController', () => {
    let controller: SessionController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SessionController],
            providers: [
                {
                    provide: SessionService,
                    useValue: mockSessionService,
                },
            ],
        }).compile();

        controller = module.get<SessionController>(SessionController);
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe('create', () => {
        it('should create a session and return a generic response', async () => {
            const session = makeSession();
            mockSessionService.create.mockResolvedValue(session);

            const dto = { campaignId: 'camp-uuid-1' };
            const req = makeReq();

            const result = await controller.create(dto, req);

            expect(mockSessionService.create).toHaveBeenCalledWith(dto, 'user-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain(`Session #${session.id} created`);
        });
    });

    // ── findAll ───────────────────────────────────────────────────────────────

    describe('findAll', () => {
        it('should return all sessions for the authenticated user', async () => {
            const sessions = [makeSession(), makeSession({ id: 'sess-uuid-2' })];
            mockSessionService.findAllByUser.mockResolvedValue(sessions);

            const req = makeReq();
            const result = await controller.findAll(req);

            expect(mockSessionService.findAllByUser).toHaveBeenCalledWith('user-uuid-1');
            expect(result.data).toBe(sessions);
            expect(result.message).toContain(`Found ${sessions.length} session(s)`);
        });
    });

    // ── findParticipants ──────────────────────────────────────────────────────

    describe('findParticipants', () => {
        it('should return participants details for a session', async () => {
            const participants = [makeParticipant()];
            const participantsDetails = {
                author: { userId: 'user-uuid-1', campaignId: 'camp-uuid-1' },
                participants,
            };
            mockSessionService.findParticipants.mockResolvedValue(participantsDetails);

            const result = await controller.findParticipants('sess-uuid-1');

            expect(mockSessionService.findParticipants).toHaveBeenCalledWith('sess-uuid-1');
            expect(result.data).toBe(participantsDetails);
            expect(result.message).toContain(`Found ${participants.length} participant(s)`);
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('should return a session by ID', async () => {
            const session = makeSession();
            mockSessionService.findOne.mockResolvedValue(session);

            const result = await controller.findOne('sess-uuid-1');

            expect(mockSessionService.findOne).toHaveBeenCalledWith('sess-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain('Session #sess-uuid-1 found');
        });
    });

    // ── launch ────────────────────────────────────────────────────────────────

    describe('launch', () => {
        it('should launch a session and return its updated state', async () => {
            const session = makeSession({
                status: SessionStatus.launched,
                expiresAt: new Date('2024-01-01T18:00:00Z'),
            });
            mockSessionService.launch.mockResolvedValue(session);

            const req = makeReq();
            const result = await controller.launch('sess-uuid-1', req);

            expect(mockSessionService.launch).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain('Session #sess-uuid-1 launched');
        });
    });

    // ── join ──────────────────────────────────────────────────────────────────

    describe('join', () => {
        it('should join a session and return the updated session', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'user-uuid-1' })],
            });
            mockSessionService.join.mockResolvedValue(session);

            const dto = { characterId: 'char-uuid-1' };
            const req = makeReq();
            const result = await controller.join('sess-uuid-1', dto, req);

            expect(mockSessionService.join).toHaveBeenCalledWith('sess-uuid-1', dto, 'user-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain('testuser');
        });
    });

    // ── leave ─────────────────────────────────────────────────────────────────

    describe('leave', () => {
        it('should leave a session and return the updated session', async () => {
            const session = makeSession();
            mockSessionService.leave.mockResolvedValue(session);

            const req = makeReq();
            const result = await controller.leave('sess-uuid-1', req);

            expect(mockSessionService.leave).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain('testuser');
        });
    });

    // ── close ─────────────────────────────────────────────────────────────────

    describe('close', () => {
        it('should close a session and return it', async () => {
            const session = makeSession({
                status: SessionStatus.closed,
                deletedAt: new Date(),
            });
            mockSessionService.close.mockResolvedValue(session);

            const req = makeReq();
            const result = await controller.close('sess-uuid-1', req);

            expect(mockSessionService.close).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(result.data).toBe(session);
            expect(result.message).toContain('Session #sess-uuid-1 closed');
        });
    });
});
