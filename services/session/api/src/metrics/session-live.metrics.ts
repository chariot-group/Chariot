import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge } from 'prom-client';
import { ParticipantStatus, Prisma, SessionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { storeFailLine } from '@/observability/store-log';

export type SessionLifecycleAction =
    | 'created'
    | 'rejoined'
    | 'joined'
    | 'left'
    | 'launched'
    | 'closed'
    | 'expired';

export type SessionWsEvent = 'connect' | 'disconnect' | 'reject';

const REFRESH_MS = 30_000;
/** Un lobby sans activité depuis 8h n'est plus « ouvert » (même fenêtre que le TTL d'une table). */
const LOBBY_LIVE_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class SessionLiveMetrics implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SessionLiveMetrics.name);
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly prisma: PrismaService,
        @InjectMetric('chariot_session_open')
        private readonly openGauge: Gauge<string>,
        @InjectMetric('chariot_session_participants')
        private readonly participantsGauge: Gauge<string>,
        @InjectMetric('chariot_session_active_ws_connections')
        private readonly wsConnected: Gauge<string>,
        @InjectMetric('chariot_session_lifecycle_total')
        private readonly lifecycleCounter: Counter<string>,
        @InjectMetric('chariot_session_ws_connections_total')
        private readonly wsConnectionsCounter: Counter<string>,
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

    async refreshLive(): Promise<void> {
        try {
            const openWhere = this.openSessionWhere();
            const [sessionCounts, participantCounts] = await Promise.all([
                this.prisma.session.groupBy({
                    by: ['status'],
                    where: openWhere,
                    _count: { _all: true },
                }),
                this.prisma.sessionParticipant.groupBy({
                    by: ['status'],
                    where: { session: openWhere },
                    _count: { _all: true },
                }),
            ]);

            const openByStatus: Record<'activated' | 'launched', number> = {
                activated: 0,
                launched: 0,
            };
            for (const row of sessionCounts) {
                if (row.status === SessionStatus.activated) {
                    openByStatus.activated = row._count._all;
                } else if (row.status === SessionStatus.launched) {
                    openByStatus.launched = row._count._all;
                }
            }
            this.openGauge.set({ status: 'activated' }, openByStatus.activated);
            this.openGauge.set({ status: 'launched' }, openByStatus.launched);

            const counts: Record<ParticipantStatus, number> = {
                gameMaster: 0,
                connected: 0,
                disconnected: 0,
            };
            for (const row of participantCounts) {
                counts[row.status] = row._count._all;
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
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error);
            this.logger.error(
                storeFailLine('postgres', 'live_gauges', 'query', message),
            );
        }
    }

    private openSessionWhere(): Prisma.SessionWhereInput {
        const now = new Date();
        const lobbySince = new Date(now.getTime() - LOBBY_LIVE_MS);
        return {
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
        };
    }

    private seedSeries(): void {
        this.openGauge.set({ status: 'activated' }, 0);
        this.openGauge.set({ status: 'launched' }, 0);
        this.participantsGauge.set({ status: 'gameMaster' }, 0);
        this.participantsGauge.set({ status: 'connected' }, 0);
        this.participantsGauge.set({ status: 'disconnected' }, 0);
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
    }
}
