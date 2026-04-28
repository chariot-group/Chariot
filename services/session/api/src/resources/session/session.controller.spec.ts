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

function makeResponse<T>(data: T, message = 'ok') {
    return { message, data };
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
        it('should delegate to service and return its response', async () => {
            const session = makeSession();
            const serviceResponse = makeResponse(session, `Session #${session.id} created in 5ms`);
            mockSessionService.create.mockResolvedValue(serviceResponse);

            const dto = { campaignId: 'camp-uuid-1' };
            const req = makeReq();

            const result = await controller.create(dto, req);

            expect(mockSessionService.create).toHaveBeenCalledWith(dto, 'user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── findAll ───────────────────────────────────────────────────────────────

    describe('findAll', () => {
        it('should delegate to service and return its response', async () => {
            const sessions = [makeSession(), makeSession({ id: 'sess-uuid-2' })];
            const serviceResponse = makeResponse(sessions, `Found 2 session(s) for user user-uuid-1 in 5ms`);
            mockSessionService.findAllByUser.mockResolvedValue(serviceResponse);

            const req = makeReq();
            const result = await controller.findAll(req);

            expect(mockSessionService.findAllByUser).toHaveBeenCalledWith('user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── findParticipants ──────────────────────────────────────────────────────

    describe('findParticipants', () => {
        it('should delegate to service and return its response', async () => {
            const participants = [makeParticipant()];
            const participantsDetails = {
                author: { userId: 'user-uuid-1', campaignId: 'camp-uuid-1' },
                participants,
            };
            const serviceResponse = makeResponse(participantsDetails, 'Found 1 participant(s) for session in 5ms');
            mockSessionService.findParticipants.mockResolvedValue(serviceResponse);

            const result = await controller.findParticipants('CODE123');

            expect(mockSessionService.findParticipants).toHaveBeenCalledWith('CODE123');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe('findOne', () => {
        it('should delegate to service and return its response', async () => {
            const session = makeSession();
            const serviceResponse = makeResponse(session, 'Session with code CODE123 found in 5ms');
            mockSessionService.findOne.mockResolvedValue(serviceResponse);

            const result = await controller.findOne('CODE123');

            expect(mockSessionService.findOne).toHaveBeenCalledWith('CODE123');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── launch ────────────────────────────────────────────────────────────────

    describe('launch', () => {
        it('should delegate to service and return its response', async () => {
            const session = makeSession({ status: SessionStatus.launched });
            const serviceResponse = makeResponse(session, 'Session with code CODE123 launched in 5ms');
            mockSessionService.launch.mockResolvedValue(serviceResponse);

            const req = makeReq();
            const result = await controller.launch('CODE123', req);

            expect(mockSessionService.launch).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── join ──────────────────────────────────────────────────────────────────

    describe('join', () => {
        it('should delegate to service and return its response', async () => {
            const session = makeSession({
                participants: [makeParticipant({ userId: 'user-uuid-1' })],
            });
            const serviceResponse = makeResponse(session, 'User user-uuid-1 joined session in 5ms');
            mockSessionService.join.mockResolvedValue(serviceResponse);

            const dto = { characterId: 'char-uuid-1' };
            const req = makeReq();
            const result = await controller.join('CODE123', dto, req);

            expect(mockSessionService.join).toHaveBeenCalledWith('CODE123', dto, 'user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── leave ─────────────────────────────────────────────────────────────────

    describe('leave', () => {
        it('should delegate to service and return its response', async () => {
            const session = makeSession();
            const serviceResponse = makeResponse(session, 'User user-uuid-1 left session in 5ms');
            mockSessionService.leave.mockResolvedValue(serviceResponse);

            const req = makeReq();
            const result = await controller.leave('CODE123', req);

            expect(mockSessionService.leave).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });

    // ── close ─────────────────────────────────────────────────────────────────

    describe('close', () => {
        it('should delegate to service and return its response', async () => {
            const session = makeSession({
                status: SessionStatus.closed,
                deletedAt: new Date(),
            });
            const serviceResponse = makeResponse(session, 'Session with code CODE123 closed in 5ms');
            mockSessionService.close.mockResolvedValue(serviceResponse);

            const req = makeReq();
            const result = await controller.close('CODE123', req);

            expect(mockSessionService.close).toHaveBeenCalledWith('CODE123', 'user-uuid-1');
            expect(result).toBe(serviceResponse);
        });
    });
});

