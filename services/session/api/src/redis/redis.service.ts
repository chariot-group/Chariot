import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private readonly SERVICE_NAME = RedisService.name;

    private client: Redis;
    private subscriber: Redis;

    private readonly expirationHandlers: Map<string, (sessionId: string) => void> = new Map();
    private readonly emptyHandlers: Map<string, (sessionId: string) => void> = new Map();

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://chariot-session-redis:6379');

        this.client = new Redis(redisUrl);
        this.subscriber = new Redis(redisUrl);

        // Activer les keyspace notifications pour les expirations
        await this.client.config('SET', 'notify-keyspace-events', 'Ex');

        // S'abonner aux événements d'expiration
        await this.subscriber.subscribe('__keyevent@0__:expired');

        this.subscriber.on('message', (_channel: string, key: string) => {
            // Format de clé: session:expire:{sessionId}
            if (key.startsWith('session:expire:')) {
                const sessionId = key.replace('session:expire:', '');
                this.logger.verbose(`Session ${sessionId} expired via Redis TTL`, this.SERVICE_NAME);

                this.expirationHandlers.forEach((handler) => {
                    try {
                        handler(sessionId);
                    } catch (error: any) {
                        this.logger.error(`Error in expiration handler: ${error.message}`, error.stack, this.SERVICE_NAME);
                    }
                });
            }

            // Format de clé: session:empty:{sessionId}
            if (key.startsWith('session:empty:')) {
                const sessionId = key.replace('session:empty:', '');
                this.logger.verbose(`Session ${sessionId} empty timer expired via Redis TTL`, this.SERVICE_NAME);

                this.emptyHandlers.forEach((handler) => {
                    try {
                        handler(sessionId);
                    } catch (error: any) {
                        this.logger.error(`Error in empty session handler: ${error.message}`, error.stack, this.SERVICE_NAME);
                    }
                });
            }
        });

        this.logger.verbose('Redis connected with keyspace notifications enabled', this.SERVICE_NAME);
    }

    async onModuleDestroy() {
        await this.subscriber?.quit();
        await this.client?.quit();
        this.logger.verbose('Redis disconnected', this.SERVICE_NAME);
    }

    /**
     * Enregistre un timer d'expiration pour une session.
     * Quand le TTL expire, Redis émet un événement capté par le subscriber.
     */
    async setSessionExpiration(sessionId: string, ttlSeconds: number): Promise<void> {
        const key = `session:expire:${sessionId}`;
        await this.client.set(key, sessionId, 'EX', ttlSeconds);
        this.logger.verbose(`Expiration set for session ${sessionId}: ${ttlSeconds}s`, this.SERVICE_NAME);
    }

    /**
     * Supprime le timer d'expiration (ex: session fermée manuellement).
     */
    async clearSessionExpiration(sessionId: string): Promise<void> {
        const key = `session:expire:${sessionId}`;
        await this.client.del(key);
        this.logger.verbose(`Expiration cleared for session ${sessionId}`, this.SERVICE_NAME);
    }

    /**
     * Enregistre un callback appelé quand une session expire.
     */
    onSessionExpired(handlerId: string, handler: (sessionId: string) => void): void {
        this.expirationHandlers.set(handlerId, handler);
        this.logger.verbose(`Expiration handler registered: ${handlerId}`, this.SERVICE_NAME);
    }

    /**
     * Retourne le TTL restant pour une session (en secondes), ou -2 si la clé n'existe pas.
     */
    async getSessionTTL(sessionId: string): Promise<number> {
        const ttl = await this.client.ttl(`session:expire:${sessionId}`);
        this.logger.verbose(`TTL for session ${sessionId}: ${ttl}s`, this.SERVICE_NAME);
        return ttl;
    }

    /**
     * Démarre le timer de fermeture par inactivité (tous déconnectés).
     */
    async setEmptySessionTimer(sessionId: string, ttlSeconds: number): Promise<void> {
        const key = `session:empty:${sessionId}`;
        await this.client.set(key, sessionId, 'EX', ttlSeconds);
        this.logger.verbose(`Empty session timer set for session ${sessionId}: ${ttlSeconds}s`, this.SERVICE_NAME);
    }

    /**
     * Annule le timer de fermeture par inactivité.
     */
    async clearEmptySessionTimer(sessionId: string): Promise<void> {
        const key = `session:empty:${sessionId}`;
        await this.client.del(key);
        this.logger.verbose(`Empty session timer cleared for session ${sessionId}`, this.SERVICE_NAME);
    }

    /**
     * Enregistre un callback appelé quand le timer d'inactivité d'une session expire.
     */
    onEmptySessionExpired(handlerId: string, handler: (sessionId: string) => void): void {
        this.emptyHandlers.set(handlerId, handler);
        this.logger.verbose(`Empty session handler registered: ${handlerId}`, this.SERVICE_NAME);
    }
}
