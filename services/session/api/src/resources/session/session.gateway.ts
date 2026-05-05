import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '@/resources/session/session.service';
import { RedisService } from '@/redis/redis.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionWithParticipants } from '@/resources/session/entities/session.model';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import path from 'path';

interface AuthenticatedSocket extends Socket {
    user?: {
        keycloakId: string;
        email: string;
        username: string;
    };
    /** Rooms session (id session) encore jointes ; à la coupure Socket.IO, `rooms` peut déjà être vide. */
    sessionRoomIds?: Set<string>;
}

@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
    },
    namespace: '/session',
    path: '/ws',
    allowEIO3: true,
})
export class SessionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SessionGateway.name);
    private readonly SERVICE_NAME = SessionGateway.name;

    private jwksClient: jwksRsa.JwksClient;
    private keycloakInternalUrl: string;
    private keycloakExternalUrl: string;
    private realm: string;

    constructor(
        private readonly sessionService: SessionService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {
        this.keycloakInternalUrl = this.configService.get<string>('KEYCLOAK_INTERNAL_URL');
        this.keycloakExternalUrl = this.configService.get<string>('KEYCLOAK_URL');
        this.realm = this.configService.get<string>('KEYCLOAK_REALM');

        const jwksUri = `${this.keycloakInternalUrl}/realms/${this.realm}/protocol/openid-connect/certs`;

        this.jwksClient = jwksRsa({
            jwksUri,
            cache: true,
            cacheMaxAge: 86400000,
        });
    }

    afterInit() {
        // Écouter les expirations Redis pour fermer automatiquement les sessions
        this.redisService.onSessionExpired('gateway', async (sessionId: string) => {
            this.logger.verbose(`Session ${sessionId} expired via Redis TTL`, this.SERVICE_NAME);
            let start: number = Date.now();
            const evictedUserIds: string[] = await this.sessionService.expireSession(sessionId);

            await this.redisService.clearTokens(sessionId);
            // Notifier tous les clients dans la room et les déconnecter de la room
            this.server.to(sessionId).emit('session:expired', { sessionId });
            this.server.in(sessionId).socketsLeave(sessionId);
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`Evicted ${evictedUserIds.length} participants from session ${sessionId} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        });

        // Écouter le timer d'inactivité (tous les joueurs déconnectés pendant 5 min)
        this.redisService.onEmptySessionExpired('gateway', async (sessionId: string) => {
            this.logger.verbose(`Session ${sessionId} empty timer expired, closing session`, this.SERVICE_NAME);
            let start: number = Date.now();
            const evictedUserIds: string[] = await this.sessionService.expireSession(sessionId);

            await this.redisService.clearTokens(sessionId);
            this.server.to(sessionId).emit('session:closed', { sessionId });
            this.server.in(sessionId).socketsLeave(sessionId);
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`Closed empty session ${sessionId}, evicted ${evictedUserIds.length} participant(s) in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        });
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            let start: number = Date.now();
            const token = client.handshake.auth?.token
                || client.handshake.headers?.authorization?.split(' ')[1]
                || (client.handshake.query?.token as string);

            if (!token) {
                let message: string = 'No token provided';
                this.logger.error(message, this.SERVICE_NAME);
                throw new UnauthorizedException(message);
            }

            const decoded = await this.verifyToken(token);

            client.user = {
                keycloakId: decoded.sub,
                email: decoded.email,
                username: decoded.preferred_username,
            };
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`Client connected: ${client.user.username} (${client.id}) in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Connection rejected: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('error', { message });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (!client.user) {
            return;
        }
        this.logger.verbose(`Client disconnected: ${client.user.username} (${client.id})`, this.SERVICE_NAME);

        const tracked = client.sessionRoomIds ? [...client.sessionRoomIds] : [];
        const fromRooms = [...client.rooms].filter(r => r !== client.id);
        const sessionIds = [...new Set([...tracked, ...fromRooms])];

        const payload = {
            userId: client.user.keycloakId,
            username: client.user.username,
        };

        for (const sessionId of sessionIds) {
            /* Immédiat : ne pas attendre la persistance, sinon le toast côté clients n'arrive qu'avec retard. */
            this.server.to(sessionId).emit('session:participant-disconnected', payload);
            this.sessionService.disconnectParticipant(sessionId, client.user.keycloakId).catch((err: any) => {
                this.logger.error(`Error handling disconnect for session ${sessionId}: ${err.message}`, null, this.SERVICE_NAME);
            });
        }
    }

    /** Extracts SessionWithParticipants from either a raw session or an IResponse wrapper. */
    private extractSession(result: any): SessionWithParticipants {
        return result?.data ?? result;
    }

    private trackSessionRoom(client: AuthenticatedSocket, sessionId: string): void {
        if (!client.sessionRoomIds) {
            client.sessionRoomIds = new Set();
        }
        client.sessionRoomIds.add(sessionId);
    }

    private untrackSessionRoom(client: AuthenticatedSocket, sessionId: string): void {
        client.sessionRoomIds?.delete(sessionId);
    }

    @SubscribeMessage('session:create')
    async handleCreateSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: CreateSessionDto,
    ) {
        try {
            let start: number = Date.now();
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.create(data, client.user.keycloakId));

            client.join(session.id);
            this.trackSessionRoom(client, session.id);
            client.emit('session:created', { session });
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`Session ${session.id} created by ${client.user.username} in ${duration.toFixed(3)}s`, null, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Session creation failed: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:join')
    async handleJoinSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string } & JoinSessionDto,
    ) {
        try {
            let start: number = Date.now();
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.join(data.sessionId, data, client.user.keycloakId));

            client.join(session.id);
            this.trackSessionRoom(client, session.id);

            const joinedParticipant = session.participants.find((p) => p.userId === client.user.keycloakId);

            // Notifier les autres participants
            client.to(session.id).emit('session:participant-joined', {
                userId: client.user.keycloakId,
                username: client.user.username,
                characterId: data.characterId,
                status: joinedParticipant?.status ?? 'connected',
            });

            client.emit('session:joined', { session });

            const currentTokens = await this.redisService.getTokens(data.sessionId);
            client.emit('session:token-updated', { tokensByUser: currentTokens });

            let duration: number = (Date.now() - start) / 1000;
            this.logger.verbose(`${client.user.username} joined session ${session.id} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Failed to join session: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:leave')
    async handleLeaveSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            let start: number = Date.now();
            /* Snapshot avant leave : après suppression le personnage n’est plus dans le roster. */
            const preDetails = await this.sessionService.findParticipants(data.sessionId);
            const leavingParticipant = preDetails.data.participants.find(
                (p) => p.userId === client.user.keycloakId,
            );
            const leavingCharacterId: string | null = leavingParticipant?.characterId ?? null;

            const session: SessionWithParticipants = this.extractSession(await this.sessionService.leave(data.sessionId, client.user.keycloakId));
            const roomId = session.id;

            client.leave(roomId);
            this.untrackSessionRoom(client, roomId);

            /* Après leave(), le socket n’est plus dans la room : client.to() est peu fiable ; le namespace cible correctement les participants restants. */
            this.server.to(roomId).emit('session:participant-left', {
                userId: client.user.keycloakId,
                username: client.user.username,
                characterId: leavingCharacterId,
            });

            client.emit('session:left', { sessionId: data.sessionId });

            // Si la session est close, notifier tout le monde
            if (session.status === 'closed') {
                this.server.to(roomId).emit('session:closed', { sessionId: data.sessionId });
            }
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`${client.user.username} left session ${roomId} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Failed to leave session: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:launch')
    async handleLaunchSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            let start: number = Date.now();
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.launch(data.sessionId, client.user.keycloakId));
            const roomId = session.id;

            this.server.to(roomId).emit('session:launched', {
                session,
                expiresAt: session.expiresAt,
            });
            let duration: number = (Date.now() - start) / 1000;

            this.logger.verbose(`Session ${roomId} launched by ${client.user.username} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Failed to launch session: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:change-character')
    async handleChangeCharacter(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string; characterId: string },
    ) {
        try {
            let start: number = Date.now();
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.changeCharacter(data.sessionId, data.characterId, client.user.keycloakId));
            const roomId = session.id;

            this.server.to(roomId).emit('session:participant-character-changed', {
                userId: client.user.keycloakId,
                characterId: data.characterId,
            });

            let duration: number = (Date.now() - start) / 1000;
            this.logger.verbose(`${client.user.username} changed character in session ${roomId} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Failed to change character: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    /**
     * Diffuse une mise à jour de fiche personnage aux autres participants (émetteur exclu).
     * Convention Socket.IO : `sessionId` dans le body est le code OTP (même valeur que pour `session:join`), pas l'id technique interne.
     */
    @SubscribeMessage('session:character-sheet-updated')
    async handleCharacterSheetUpdated(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string; characterId: string },
    ) {
        try {
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.findOne(data.sessionId));
            const me = session.participants.find((p) => p.userId === client.user.keycloakId);
            if (!me) {
                client.emit('session:error', { message: 'Not a session participant' });
                return;
            }
            const cid = (data.characterId ?? '').trim();
            if (!cid) {
                client.emit('session:error', { message: 'Missing characterId' });
                return;
            }
            const onRoster = session.participants.some((p) => p.characterId === cid);
            if (!onRoster) {
                client.emit('session:error', { message: 'Character is not on this session roster' });
                return;
            }
            client.to(session.id).emit('session:character-sheet-updated', { characterId: cid });
            this.logger.verbose(
                `${client.user.username} broadcast character sheet update ${cid} in session ${session.id}`,
                this.SERVICE_NAME,
            );
        } catch (error: any) {
            const message: string = `Failed to broadcast character sheet update: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:close')
    async handleCloseSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            let start: number = Date.now();
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.close(data.sessionId, client.user.keycloakId));
            const roomId = session.id;

            await this.redisService.clearTokens(data.sessionId);
            this.server.to(roomId).emit('session:closed', { sessionId: data.sessionId });

            let duration: number = (Date.now() - start) / 1000;
            this.logger.verbose(`Session ${roomId} closed by ${client.user.username} in ${duration.toFixed(3)}s`, this.SERVICE_NAME);
        } catch (error: any) {
            let message: string = `Failed to close session: ${error.message}`;
            this.logger.error(message, null, this.SERVICE_NAME);
            client.emit('session:error', { message });
        }
    }

    @SubscribeMessage('session:add-token')
    async handleAddToken(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.findOne(data.sessionId));
            const maxTokens = session.participants.length;
            const updated = await this.redisService.addToken(data.sessionId, client.user.keycloakId, maxTokens);
            if (updated === null) {
                client.emit('session:error', { message: 'Token limit reached' });
                return;
            }
            this.server.to(session.id).emit('session:token-updated', { tokensByUser: updated });
        } catch (error: any) {
            this.logger.error(`Failed to add token: ${error.message}`, null, this.SERVICE_NAME);
            client.emit('session:error', { message: `Failed to add token: ${error.message}` });
        }
    }

    @SubscribeMessage('session:remove-token')
    async handleRemoveToken(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string },
    ) {
        try {
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.findOne(data.sessionId));
            const updated = await this.redisService.removeToken(data.sessionId, client.user.keycloakId);
            if (updated === null) {
                client.emit('session:error', { message: 'No token to remove' });
                return;
            }
            this.server.to(session.id).emit('session:token-updated', { tokensByUser: updated });
        } catch (error: any) {
            this.logger.error(`Failed to remove token: ${error.message}`, null, this.SERVICE_NAME);
            client.emit('session:error', { message: `Failed to remove token: ${error.message}` });
        }
    }

    @SubscribeMessage('session:add-tokens')
    async handleAddTokens(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string; amount: number },
    ) {
        try {
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.findOne(data.sessionId));
            const maxTokens = session.participants.length;
            const result = await this.redisService.addTokens(data.sessionId, client.user.keycloakId, maxTokens, data.amount);
            if (result === null) {
                client.emit('session:error', { message: 'Token limit reached' });
                return;
            }
            this.server.to(session.id).emit('session:token-updated', { tokensByUser: result.tokens });
        } catch (error: any) {
            this.logger.error(`Failed to add tokens: ${error.message}`, null, this.SERVICE_NAME);
            client.emit('session:error', { message: `Failed to add tokens: ${error.message}` });
        }
    }

    @SubscribeMessage('session:remove-tokens')
    async handleRemoveTokens(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string; amount: number },
    ) {
        try {
            const session: SessionWithParticipants = this.extractSession(await this.sessionService.findOne(data.sessionId));
            const result = await this.redisService.removeTokens(data.sessionId, client.user.keycloakId, data.amount);
            if (result === null) {
                client.emit('session:error', { message: 'No token to remove' });
                return;
            }
            this.server.to(session.id).emit('session:token-updated', { tokensByUser: result.tokens });
        } catch (error: any) {
            this.logger.error(`Failed to remove tokens: ${error.message}`, null, this.SERVICE_NAME);
            client.emit('session:error', { message: `Failed to remove tokens: ${error.message}` });
        }
    }

    private async verifyToken(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const decodedHeader = jwt.decode(token, { complete: true });

            if (!decodedHeader || typeof decodedHeader === 'string') {
                let message: string = 'Invalid token structure';
                this.logger.error(message, null, this.SERVICE_NAME);
                return reject(new InternalServerErrorException(message));
            }

            const kid = decodedHeader.header.kid;

            if (!kid) {
                let message: string = 'No kid in token header';
                this.logger.error(message, null, this.SERVICE_NAME);
                return reject(new InternalServerErrorException(message));
            }


            // Ajoute ça temporairement
            this.jwksClient.getKeys().then(keys => {
                this.logger.debug(`Available keys from JWKS endpoint: ${(keys as any).map(k => k.kid).join(', ')}`, this.SERVICE_NAME);
            }).catch(err => {
                this.logger.error(`Error fetching keys from JWKS endpoint: ${err.message}`, err.stack, this.SERVICE_NAME);
            });

            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    let message: string = `Error getting signing key: ${err.message}`;
                    this.logger.error(message, err.stack, this.SERVICE_NAME);
                    return reject(err);
                }

                const signingKey = key.getPublicKey();

                jwt.verify(
                    token,
                    signingKey,
                    { algorithms: ['RS256'] },
                    (verifyErr, decoded) => {
                        if (verifyErr) {
                            let message: string = `Error verifying token: ${verifyErr.message}`;
                            this.logger.error(message, verifyErr.stack, this.SERVICE_NAME);
                            return reject(new InternalServerErrorException(message));
                        }

                        const validIssuers = [
                            `${this.keycloakInternalUrl}/realms/${this.realm}`,
                            `${this.keycloakExternalUrl}/realms/${this.realm}`,
                        ].filter(Boolean);

                        const payload = decoded as jwt.JwtPayload;
                        if (payload.iss && !validIssuers.includes(payload.iss)) {
                            let message: string = 'Invalid token issuer';
                            this.logger.error(`${message}: ${payload.iss}. Expected one of: ${validIssuers.join(', ')}`, null, this.SERVICE_NAME);
                            return reject(new InternalServerErrorException(message));
                        }

                        resolve(decoded);
                    },
                );
            });
        });
    }
}
