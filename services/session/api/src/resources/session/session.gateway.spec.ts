import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '@prisma/client';
import { SessionGateway } from '@/resources/session/session.gateway';
import { SessionService } from '@/resources/session/session.service';
import { RedisService } from '@/redis/redis.service';

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

jest.mock('jsonwebtoken', () => ({
    decode: jest.fn(),
    verify: jest.fn(),
}));

jest.mock('jwks-rsa', () => {
    const mockClient = { getSigningKey: jest.fn() };
    return { __esModule: true, default: jest.fn().mockReturnValue(mockClient) };
});

import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSession(overrides: Record<string, any> = {}) {
    return {
        id: 'sess-uuid-1',
        creatorUserId: 'user-uuid-1',
        status: SessionStatus.activated,
        deletedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        ...overrides,
    };
}

function makeSocket(overrides: Record<string, any> = {}) {
    return {
        id: 'socket-id-1',
        handshake: {
            auth: { token: 'test-token' },
            headers: {},
        },
        user: {
            keycloakId: 'user-uuid-1',
            email: 'user@test.com',
            username: 'testuser',
        },
        rooms: new Set<string>(),
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        disconnect: jest.fn(),
        ...overrides,
    } as any;
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSessionService = {
    create: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    launch: jest.fn(),
    close: jest.fn(),
    expireSession: jest.fn(),
    disconnectParticipant: jest.fn(),
    findParticipants: jest.fn(),
};

const mockRedisService = {
    setSessionExpiration: jest.fn(),
    clearSessionExpiration: jest.fn(),
    onSessionExpired: jest.fn(),
    onEmptySessionExpired: jest.fn(),
    clearTokens: jest.fn(),
    getTokens: jest.fn(),
};

const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
            KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
            KEYCLOAK_URL: 'http://localhost:8080',
            KEYCLOAK_REALM: 'chariot',
        };
        return config[key];
    }),
};

// Shared mock room (returned by server.to() / server.in())
const mockRoomEmit = jest.fn();
const mockSocketsLeave = jest.fn();
const mockRoom = { emit: mockRoomEmit, socketsLeave: mockSocketsLeave };

const mockServer = {
    to: jest.fn().mockReturnValue(mockRoom),
    in: jest.fn().mockReturnValue(mockRoom),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SessionGateway', () => {
    let gateway: SessionGateway;
    let mockGetSigningKey: jest.Mock;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Reset room mock chains
        mockServer.to.mockReturnValue(mockRoom);
        mockServer.in.mockReturnValue(mockRoom);
        mockRoomEmit.mockReset();
        mockSocketsLeave.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionGateway,
                { provide: SessionService, useValue: mockSessionService },
                { provide: RedisService, useValue: mockRedisService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        gateway = module.get<SessionGateway>(SessionGateway);

        // Inject mock WebSocket server
        (gateway as any).server = mockServer;

        // Replace the jwksClient with a controllable mock
        mockGetSigningKey = jest.fn();
        (gateway as any).jwksClient = {
            getSigningKey: mockGetSigningKey,
            getKeys: jest.fn().mockResolvedValue([{ kid: 'test-kid' }]), // Ajouté pour éviter l'erreur
        };
    });

    // ── afterInit ─────────────────────────────────────────────────────────────

    describe('afterInit', () => {
        it('should register a Redis expiration handler', () => {
            gateway.afterInit();

            expect(mockRedisService.onSessionExpired).toHaveBeenCalledWith(
                'gateway',
                expect.any(Function),
            );
        });

        it('should emit session:expired and leave room when a session expires', async () => {
            let capturedCallback: (sessionId: string) => Promise<void>;
            mockRedisService.onSessionExpired.mockImplementation((_id: string, cb: any) => {
                capturedCallback = cb;
            });

            gateway.afterInit();

            const participants = ['user-a', 'user-b'];
            mockSessionService.expireSession.mockResolvedValue(participants);

            await capturedCallback('sess-uuid-1');

            expect(mockSessionService.expireSession).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:expired', { sessionId: 'sess-uuid-1' });
            expect(mockServer.in).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockSocketsLeave).toHaveBeenCalledWith('sess-uuid-1');
        });
    });

    // ── handleConnection ──────────────────────────────────────────────────────

    describe('handleConnection', () => {
        beforeEach(() => {
            (jwt.decode as jest.Mock).mockReturnValue({
                header: { kid: 'test-kid' },
                payload: {},
            });
            (jwt.verify as jest.Mock).mockImplementation((_token, _key, _opts, callback) => {
                callback(null, {
                    sub: 'user-uuid-1',
                    email: 'user@test.com',
                    preferred_username: 'testuser',
                    iss: 'http://keycloak:8080/realms/chariot',
                });
            });
            mockGetSigningKey.mockImplementation((_kid, cb) => {
                cb(null, { getPublicKey: () => 'mock-public-key' });
            });
        });

        it('should authenticate client using auth.token and set user on socket', async () => {
            const client = makeSocket({
                user: undefined,
                handshake: { auth: { token: 'valid-token' }, headers: {} },
            });

            await gateway.handleConnection(client);

            expect(client.user).toEqual({
                keycloakId: 'user-uuid-1',
                email: 'user@test.com',
                username: 'testuser',
            });
        });

        it('should authenticate client using authorization header token', async () => {
            const client = makeSocket({
                user: undefined,
                handshake: {
                    auth: {},
                    headers: { authorization: 'Bearer header-token' },
                },
            });

            await gateway.handleConnection(client);

            expect(client.user.keycloakId).toBe('user-uuid-1');
        });

        it('should disconnect client when no token is provided', async () => {
            const client = makeSocket({
                handshake: { auth: {}, headers: {} },
            });

            await gateway.handleConnection(client);

            expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.any(String) }));
            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when jwt.decode returns null', async () => {
            (jwt.decode as jest.Mock).mockReturnValue(null);
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when jwt.decode returns a string', async () => {
            (jwt.decode as jest.Mock).mockReturnValue('invalid-string');
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when token header has no kid', async () => {
            (jwt.decode as jest.Mock).mockReturnValue({
                header: {},
                payload: {},
            });
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when getSigningKey returns an error', async () => {
            mockGetSigningKey.mockImplementation((_kid, cb) => {
                cb(new Error('Key fetch error'), null);
            });
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when jwt.verify returns an error', async () => {
            (jwt.verify as jest.Mock).mockImplementation((_token, _key, _opts, callback) => {
                callback(new Error('Token expired'), null);
            });
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should disconnect client when token issuer is invalid', async () => {
            (jwt.verify as jest.Mock).mockImplementation((_token, _key, _opts, callback) => {
                callback(null, {
                    sub: 'user-uuid-1',
                    email: 'user@test.com',
                    preferred_username: 'testuser',
                    iss: 'http://malicious.com/realms/chariot',
                });
            });
            const client = makeSocket();

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalled();
        });

        it('should accept token with no iss claim', async () => {
            (jwt.verify as jest.Mock).mockImplementation((_token, _key, _opts, callback) => {
                callback(null, {
                    sub: 'user-uuid-1',
                    email: 'user@test.com',
                    preferred_username: 'testuser',
                    // no iss
                });
            });
            const client = makeSocket({ user: undefined });

            await gateway.handleConnection(client);

            expect(client.user.keycloakId).toBe('user-uuid-1');
        });
    });

    // ── handleDisconnect ──────────────────────────────────────────────────────

    describe('handleDisconnect', () => {
        it('should log when the disconnected client has a user', () => {
            const client = makeSocket();
            // Should not throw
            expect(() => gateway.handleDisconnect(client)).not.toThrow();
        });

        it('should not throw when the disconnected client has no user', () => {
            const client = makeSocket({ user: undefined });
            expect(() => gateway.handleDisconnect(client)).not.toThrow();
        });

        it('should emit participant-disconnected immediately via server.to and persist async', () => {
            let resolveDisconnect: () => void = () => {};
            const disconnectPromise = new Promise<void>((res) => {
                resolveDisconnect = res;
            });
            mockSessionService.disconnectParticipant.mockReturnValue(disconnectPromise);

            const sessionRoomIds = new Set<string>(['sess-uuid-1']);
            const client = makeSocket({ sessionRoomIds });

            gateway.handleDisconnect(client);

            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:participant-disconnected', {
                userId: 'user-uuid-1',
                username: 'testuser',
            });
            expect(mockSessionService.disconnectParticipant).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');

            resolveDisconnect();
        });
    });

    // ── handleCreateSession ───────────────────────────────────────────────────

    describe('handleCreateSession', () => {
        it('should create a session, join the room, and emit session:created', async () => {
            const session = makeSession();
            mockSessionService.create.mockResolvedValue(session);

            const client = makeSocket();
            const data = { campaignId: 'camp-uuid-1' };

            await gateway.handleCreateSession(client, data);

            expect(mockSessionService.create).toHaveBeenCalledWith(data, 'user-uuid-1');
            expect(client.join).toHaveBeenCalledWith(session.id);
            expect(client.emit).toHaveBeenCalledWith('session:created', { session });
        });

        it('should emit session:error when service throws', async () => {
            mockSessionService.create.mockRejectedValue(new Error('Create failed'));
            const client = makeSocket();

            await gateway.handleCreateSession(client, { campaignId: 'camp-1' });

            expect(client.emit).toHaveBeenCalledWith(
                'session:error',
                expect.objectContaining({ message: expect.stringContaining('Create failed') }),
            );
        });

        it('should emit session:error when service returns null', async () => {
            mockSessionService.create.mockResolvedValue(null);
            const client = makeSocket();

            await gateway.handleCreateSession(client, { campaignId: 'camp-1' });

            expect(client.emit).toHaveBeenCalledWith('session:error', expect.any(Object));
        });
    });

    // ── handleJoinSession ─────────────────────────────────────────────────────

    describe('handleJoinSession', () => {
        it('should join session, notify others, and emit session:joined', async () => {
            const session = makeSession();
            mockSessionService.join.mockResolvedValue(session);

            const client = makeSocket();
            const data = { sessionId: 'sess-uuid-1', characterId: 'char-uuid-1' };

            await gateway.handleJoinSession(client, data);

            expect(mockSessionService.join).toHaveBeenCalledWith('sess-uuid-1', data, 'user-uuid-1');
            expect(client.join).toHaveBeenCalledWith(session.id);
            expect(client.emit).toHaveBeenCalledWith('session:joined', { session });
        });

        it('should broadcast persisted characterId when WS join payload omits it', async () => {
            const session = makeSession({
                participants: [
                    {
                        id: 'part-joiner',
                        userId: 'user-uuid-1',
                        characterId: 'char-from-db',
                        status: 'connected',
                        joinedAt: new Date().toISOString(),
                        sessionId: 'sess-uuid-1',
                    },
                ] as any,
            });
            mockSessionService.join.mockResolvedValue(session);

            const roomEmit = jest.fn();
            const client = makeSocket({
                to: jest.fn().mockReturnValue({ emit: roomEmit }),
            });

            await gateway.handleJoinSession(client, { sessionId: 'sess-uuid-1', characterId: null });

            expect(roomEmit).toHaveBeenCalledWith('session:participant-joined', {
                userId: 'user-uuid-1',
                username: 'testuser',
                characterId: 'char-from-db',
                status: 'connected',
            });
        });

        it('should emit session:error when service throws', async () => {
            mockSessionService.join.mockRejectedValue(new Error('Join failed'));
            const client = makeSocket();

            await gateway.handleJoinSession(client, { sessionId: 'sess-uuid-1', characterId: 'char-1' });

            expect(client.emit).toHaveBeenCalledWith(
                'session:error',
                expect.objectContaining({ message: expect.stringContaining('Join failed') }),
            );
        });
    });

    // ── handleLeaveSession ────────────────────────────────────────────────────

    describe('handleLeaveSession', () => {
        it('should leave session, notify others, and emit session:left', async () => {
            const session = makeSession({ status: SessionStatus.activated });
            mockSessionService.findParticipants.mockResolvedValue({
                message: 'ok',
                data: {
                    author: { userId: 'user-uuid-1', campaignId: 'camp-1' },
                    participants: [
                        {
                            id: 'part-1',
                            userId: 'user-uuid-1',
                            characterId: 'char-99',
                            status: 'connected',
                            joinedAt: new Date().toISOString(),
                            sessionId: 'sess-uuid-1',
                        },
                    ],
                },
            });
            mockSessionService.leave.mockResolvedValue(session);

            const client = makeSocket();
            const data = { sessionId: 'sess-uuid-1' };

            await gateway.handleLeaveSession(client, data);

            expect(mockSessionService.findParticipants).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockSessionService.leave).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(client.leave).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:participant-left', {
                userId: 'user-uuid-1',
                username: 'testuser',
                characterId: 'char-99',
            });
            expect(client.emit).toHaveBeenCalledWith('session:left', { sessionId: 'sess-uuid-1' });
        });

        it('should also emit session:closed when the session is closed after leaving', async () => {
            const session = makeSession({ status: SessionStatus.closed });
            mockSessionService.findParticipants.mockResolvedValue({
                message: 'ok',
                data: {
                    author: { userId: 'user-uuid-1', campaignId: 'camp-1' },
                    participants: [
                        {
                            id: 'part-1',
                            userId: 'user-uuid-1',
                            characterId: null,
                            status: 'connected',
                            joinedAt: new Date().toISOString(),
                            sessionId: 'sess-uuid-1',
                        },
                    ],
                },
            });
            mockSessionService.leave.mockResolvedValue(session);

            const client = makeSocket();
            const data = { sessionId: 'sess-uuid-1' };

            await gateway.handleLeaveSession(client, data);

            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:closed', { sessionId: 'sess-uuid-1' });
        });

        it('should emit session:error when service throws', async () => {
            mockSessionService.findParticipants.mockResolvedValue({
                message: 'ok',
                data: {
                    author: { userId: 'user-uuid-1', campaignId: 'camp-1' },
                    participants: [
                        {
                            id: 'part-1',
                            userId: 'user-uuid-1',
                            characterId: null,
                            status: 'connected',
                            joinedAt: new Date().toISOString(),
                            sessionId: 'sess-uuid-1',
                        },
                    ],
                },
            });
            mockSessionService.leave.mockRejectedValue(new Error('Leave failed'));
            const client = makeSocket();

            await gateway.handleLeaveSession(client, { sessionId: 'sess-uuid-1' });

            expect(client.emit).toHaveBeenCalledWith(
                'session:error',
                expect.objectContaining({ message: expect.stringContaining('Leave failed') }),
            );
        });
    });

    // ── handleLaunchSession ───────────────────────────────────────────────────

    describe('handleLaunchSession', () => {
        it('should launch session and broadcast session:launched to room', async () => {
            const expiresAt = new Date('2024-01-01T18:00:00Z');
            const session = makeSession({ status: SessionStatus.launched, expiresAt });
            mockSessionService.launch.mockResolvedValue(session);

            const client = makeSocket();
            const data = { sessionId: 'sess-uuid-1' };

            await gateway.handleLaunchSession(client, data);

            expect(mockSessionService.launch).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:launched', { session, expiresAt });
        });

        it('should emit session:error when service throws', async () => {
            mockSessionService.launch.mockRejectedValue(new Error('Launch failed'));
            const client = makeSocket();

            await gateway.handleLaunchSession(client, { sessionId: 'sess-uuid-1' });

            expect(client.emit).toHaveBeenCalledWith(
                'session:error',
                expect.objectContaining({ message: expect.stringContaining('Launch failed') }),
            );
        });
    });

    // ── handleCloseSession ────────────────────────────────────────────────────

    describe('handleCloseSession', () => {
        it('should close session and broadcast session:closed to room', async () => {
            mockSessionService.close.mockResolvedValue(makeSession());
            const client = makeSocket();
            const data = { sessionId: 'sess-uuid-1' };

            await gateway.handleCloseSession(client, data);

            expect(mockSessionService.close).toHaveBeenCalledWith('sess-uuid-1', 'user-uuid-1');
            expect(mockServer.to).toHaveBeenCalledWith('sess-uuid-1');
            expect(mockRoomEmit).toHaveBeenCalledWith('session:closed', { sessionId: 'sess-uuid-1' });
        });

        it('should emit session:error when service throws', async () => {
            mockSessionService.close.mockRejectedValue(new Error('Close failed'));
            const client = makeSocket();

            await gateway.handleCloseSession(client, { sessionId: 'sess-uuid-1' });

            expect(client.emit).toHaveBeenCalledWith(
                'session:error',
                expect.objectContaining({ message: expect.stringContaining('Close failed') }),
            );
        });
    });
});
