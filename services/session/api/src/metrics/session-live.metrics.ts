import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';
import { ParticipantStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { sumTokenMap } from '@/resources/session/session-wheel-quota';

export type SessionLifecycleAction =
    | 'created'
    | 'rejoined'
    | 'joined'
    | 'left'
    | 'launched'
    | 'closed'
    | 'expired';

export type SessionWsEvent = 'connect' | 'disconnect' | 'reject';

export type SessionWheelOp = 'add' | 'remove';

export type SessionWheelResult =
    | 'ok'
    | 'limit'
    | 'empty'
    | 'insufficient'
    | 'balance_failed';

const REFRESH_MS = 15_000;
/** Un lobby sans activité depuis 8h n'est plus « ouvert » (même fenêtre que le TTL d'une table). */
const LOBBY_LIVE_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class SessionLiveMetrics implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SessionLiveMetrics.name);
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        @InjectMetric('chariot_session_open')
        private readonly openGauge: Gauge<string>,
        @InjectMetric('chariot_session_participants')
        private readonly participantsGauge: Gauge<string>,
        @InjectMetric('chariot_session_wheels_deposited')
        private readonly wheelsDeposited: Gauge<string>,
        @InjectMetric('chariot_session_wheels_quota')
        private readonly wheelsQuota: Gauge<string>,
        @InjectMetric('chariot_session_active_ws_connections')
        private readonly wsConnected: Gauge<string>,
        @InjectMetric('chariot_session_lifecycle_total')
        private readonly lifecycleCounter: Counter<string>,
        @InjectMetric('chariot_session_ws_connections_total')
        private readonly wsConnectionsCounter: Counter<string>,
        @InjectMetric('chariot_session_wheel_ops_total')
        private readonly wheelOpsCounter: Counter<string>,
    ) {}

    onModuleInit(): void {
        this.seedSeries();
        void this.refreshLive();
        this.refreshTimer = setInterval(() => {
            void this.refreshLive();
        }, REFRESH_MS);
        this.refreshTimer.unref?.();
    }

    onModuleDestroy(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    recordLifecycle(action: SessionLifecycleAction): void {
        this.lifecycleCounter.inc({ action });
        void this.refreshLive();
    }

    recordWs(event: SessionWsEvent): void {
        this.wsConnectionsCounter.inc({ event });
        if (event === 'connect') {
            this.wsConnected.inc();
        } else if (event === 'disconnect') {
            this.wsConnected.dec();
        }
    }

    recordWheel(op: SessionWheelOp, result: SessionWheelResult): void {
        this.wheelOpsCounter.inc({ op, result });
        if (result === 'ok' || result === 'limit' || result === 'empty') {
            void this.refreshLive();
        }
    }

    async refreshLive(): Promise<void> {
        try {
            const now = new Date();
            const lobbySince = new Date(now.getTime() - LOBBY_LIVE_MS);
            const sessions = await this.prisma.session.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        {
                            status: SessionStatus.launched,
                            OR: [
                                { expiresAt: { gt: now } },
                                {
                                    expiresAt: null,
                                    updatedAt: { gt: lobbySince },
                                },
                            ],
                        },
                        {
                            status: SessionStatus.activated,
                            OR: [
                                { updatedAt: { gt: lobbySince } },
                                { createdAt: { gt: lobbySince } },
                                {
                                    participants: {
                                        some: { joinedAt: { gt: lobbySince } },
                                    },
                                },
                            ],
                        },
                    ],
                },
                include: { participants: true },
            });

            const activated = sessions.filter(
                (s) => s.status === SessionStatus.activated,
            );
            const launched = sessions.filter(
                (s) => s.status === SessionStatus.launched,
            );
            this.openGauge.set({ status: 'activated' }, activated.length);
            this.openGauge.set({ status: 'launched' }, launched.length);

            const counts: Record<ParticipantStatus, number> = {
                gameMaster: 0,
                connected: 0,
                disconnected: 0,
            };
            for (const session of sessions) {
                for (const participant of session.participants) {
                    counts[participant.status] += 1;
                }
            }
            this.participantsGauge.set(
                { status: 'gameMaster' },
                counts.gameMaster,
            );
            this.participantsGauge.set(
                { status: 'connected' },
                counts.connected,
            );
            this.participantsGauge.set(
                { status: 'disconnected' },
                counts.disconnected,
            );

            let deposited = 0;
            let quota = 0;
            for (const session of activated) {
                quota += session.participants.length;
                const tokens = await this.redisService.getTokens(session.code);
                deposited += sumTokenMap(tokens);
            }
            this.wheelsDeposited.set(deposited);
            this.wheelsQuota.set(quota);
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Failed to refresh live session gauges: ${message}`,
            );
        }
    }

    private seedSeries(): void {
        this.openGauge.set({ status: 'activated' }, 0);
        this.openGauge.set({ status: 'launched' }, 0);
        this.participantsGauge.set({ status: 'gameMaster' }, 0);
        this.participantsGauge.set({ status: 'connected' }, 0);
        this.participantsGauge.set({ status: 'disconnected' }, 0);
        this.wheelsDeposited.set(0);
        this.wheelsQuota.set(0);
        this.wsConnected.set(0);

        for (const action of [
            'created',
            'rejoined',
            'joined',
            'left',
            'launched',
            'closed',
            'expired',
        ] as const) {
            this.lifecycleCounter.inc({ action }, 0);
        }
        for (const event of ['connect', 'disconnect', 'reject'] as const) {
            this.wsConnectionsCounter.inc({ event }, 0);
        }
        for (const op of ['add', 'remove'] as const) {
            for (const result of [
                'ok',
                'limit',
                'empty',
                'insufficient',
                'balance_failed',
            ] as const) {
                this.wheelOpsCounter.inc({ op, result }, 0);
            }
        }
    }
}
