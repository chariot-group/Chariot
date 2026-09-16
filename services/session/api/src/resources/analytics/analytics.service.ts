import {
    Injectable,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { ParticipantStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
    Period,
    SessionBusinessAnalytics,
} from '@/resources/analytics/analytics.types';
import {
    bucketCounts,
    inRange,
    isEarlyClose,
    median,
    resolveDateRange,
} from '@/resources/analytics/analytics.utils';

type SessionRow = {
    id: string;
    creatorUserId: string;
    creatorCampaignId: string;
    status: SessionStatus;
    createdAt: Date;
    launchedAt: Date | null;
    deletedAt: Date | null;
    expiresAt: Date | null;
    participants: { userId: string; status: ParticipantStatus }[];
};

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private readonly SERVICE_NAME = AnalyticsService.name;

    constructor(private readonly prisma: PrismaService) {}

    async getBusiness(
        period: Period,
        from?: Date,
        to?: Date,
    ): Promise<SessionBusinessAnalytics> {
        try {
            const start = Date.now();
            const range = resolveDateRange(from, to);

            const [periodSessions, launchedSessions, liveSessions] = await Promise.all([
                this.prisma.session.findMany({
                    where: { createdAt: { gte: range.from, lte: range.to } },
                    select: {
                        id: true,
                        creatorUserId: true,
                        creatorCampaignId: true,
                        status: true,
                        createdAt: true,
                        launchedAt: true,
                        deletedAt: true,
                        expiresAt: true,
                        participants: { select: { userId: true, status: true } },
                    },
                }),
                this.prisma.session.findMany({
                    where: { launchedAt: { not: null } },
                    select: {
                        id: true,
                        creatorUserId: true,
                        creatorCampaignId: true,
                        status: true,
                        createdAt: true,
                        launchedAt: true,
                        deletedAt: true,
                        expiresAt: true,
                        participants: { select: { userId: true, status: true } },
                    },
                }),
                this.prisma.session.findMany({
                    where: { status: SessionStatus.launched, deletedAt: null },
                    select: {
                        id: true,
                        participants: { select: { userId: true, status: true } },
                    },
                }),
            ]);

            const result = this.compute(
                period,
                range.from,
                range.to,
                periodSessions,
                launchedSessions,
                liveSessions,
            );

            this.logger.debug(
                `Session business analytics in ${Date.now() - start}ms`,
                this.SERVICE_NAME,
            );
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const message = `Error while computing session business analytics: ${err.message}`;
            this.logger.error(message, err.stack, this.SERVICE_NAME);
            throw new InternalServerErrorException(message);
        }
    }

    compute(
        period: Period,
        from: Date,
        to: Date,
        periodSessions: SessionRow[],
        launchedSessions: SessionRow[],
        liveSessions: Pick<SessionRow, 'id' | 'participants'>[],
    ): SessionBusinessAnalytics {
        const launchedInPeriod = launchedSessions.filter(
            (session) => session.launchedAt && inRange(session.launchedAt, from, to),
        );

        const userLaunchTimes = new Map<string, Date[]>();
        const firstLaunchByUserMap = new Map<string, Date>();
        for (const session of launchedSessions) {
            if (!session.launchedAt) {
                continue;
            }
            for (const participant of session.participants) {
                const times = userLaunchTimes.get(participant.userId) ?? [];
                times.push(session.launchedAt);
                userLaunchTimes.set(participant.userId, times);
                const current = firstLaunchByUserMap.get(participant.userId);
                if (!current || session.launchedAt < current) {
                    firstLaunchByUserMap.set(participant.userId, session.launchedAt);
                }
            }
        }
        for (const times of userLaunchTimes.values()) {
            times.sort((a, b) => a.getTime() - b.getTime());
        }

        const activatedUsers = new Set<string>();
        const retainedUsers = new Set<string>();
        const gmActivated = new Set<string>();
        const playerActivated = new Set<string>();
        const firstInPeriodByUser = new Map<string, Date>();
        for (const session of launchedInPeriod) {
            if (!session.launchedAt) {
                continue;
            }
            for (const participant of session.participants) {
                activatedUsers.add(participant.userId);
                const current = firstInPeriodByUser.get(participant.userId);
                if (!current || session.launchedAt < current) {
                    firstInPeriodByUser.set(participant.userId, session.launchedAt);
                }
                if (participant.userId === session.creatorUserId) {
                    gmActivated.add(participant.userId);
                } else {
                    playerActivated.add(participant.userId);
                }
            }
        }
        const activationDates = [...firstInPeriodByUser.values()];
        const retentionDates: Date[] = [];

        for (const [userId, times] of userLaunchTimes.entries()) {
            const inPeriod = times.filter((date) => inRange(date, from, to));
            if (inPeriod.length >= 2) {
                retainedUsers.add(userId);
                retentionDates.push(inPeriod[1]);
            }
        }

        const created = periodSessions.length;
        const launched = periodSessions.filter((session) => session.launchedAt !== null).length;
        const abandoned = periodSessions.filter(
            (session) => session.launchedAt === null && session.deletedAt !== null,
        ).length;
        const openLobbies = periodSessions.filter(
            (session) => session.status === SessionStatus.activated && session.deletedAt === null,
        ).length;
        const conversionRate = created > 0 ? Math.round((launched / created) * 1000) / 10 : 0;

        const minutesToLaunch = launchedInPeriod
            .filter((session) => session.launchedAt)
            .map(
                (session) =>
                    (session.launchedAt!.getTime() - session.createdAt.getTime()) / 60000,
            );

        const participantCounts = launchedInPeriod.map((session) => session.participants.length);
        const avgParticipantsAtLaunch =
            participantCounts.length > 0
                ? Math.round(
                      (participantCounts.reduce((sum, count) => sum + count, 0) /
                          participantCounts.length) *
                          10,
                  ) / 10
                : 0;
        const soloGmLaunchRate =
            participantCounts.length > 0
                ? Math.round(
                      (participantCounts.filter((count) => count <= 1).length /
                          participantCounts.length) *
                          1000,
                  ) / 10
                : 0;

        const closedLaunched = launchedInPeriod.filter(
            (session) => session.launchedAt && session.deletedAt,
        );
        const earlyCloseRate =
            closedLaunched.length > 0
                ? Math.round(
                      (closedLaunched.filter((session) =>
                          isEarlyClose(session.launchedAt!, session.deletedAt!),
                      ).length /
                          closedLaunched.length) *
                          1000,
                  ) / 10
                : 0;

        const gmLaunchCounts = new Map<string, number>();
        const playerLaunchCounts = new Map<string, number>();
        for (const session of launchedInPeriod) {
            gmLaunchCounts.set(
                session.creatorUserId,
                (gmLaunchCounts.get(session.creatorUserId) ?? 0) + 1,
            );
            for (const participant of session.participants) {
                if (participant.userId === session.creatorUserId) {
                    continue;
                }
                playerLaunchCounts.set(
                    participant.userId,
                    (playerLaunchCounts.get(participant.userId) ?? 0) + 1,
                );
            }
        }

        const connectedStatuses: ParticipantStatus[] = [
            ParticipantStatus.connected,
            ParticipantStatus.gameMaster,
        ];

        return {
            funnel: {
                activation: activatedUsers.size,
                retention: retainedUsers.size,
                gmActivated: gmActivated.size,
                playerActivated: playerActivated.size,
                activationOverTime: bucketCounts(activationDates, period),
                retentionOverTime: bucketCounts(retentionDates, period),
            },
            lobby: {
                created,
                launched,
                abandoned,
                openLobbies,
                conversionRate,
                medianMinutesToLaunch: median(minutesToLaunch),
                avgParticipantsAtLaunch,
                soloGmLaunchRate,
                earlyCloseRate,
                repeatGmCount: [...gmLaunchCounts.values()].filter((count) => count >= 2).length,
                repeatPlayerCount: [...playerLaunchCounts.values()].filter((count) => count >= 2)
                    .length,
            },
            live: {
                launchedOpen: liveSessions.length,
                connectedParticipants: liveSessions.reduce(
                    (sum, session) =>
                        sum +
                        session.participants.filter((participant) =>
                            connectedStatuses.includes(participant.status),
                        ).length,
                    0,
                ),
            },
            launchedCampaignIds: [
                ...new Set(launchedSessions.map((session) => session.creatorCampaignId)),
            ],
            gmTableCounts: [...gmLaunchCounts.entries()]
                .map(([userId, count]) => ({ userId, count }))
                .sort((a, b) => b.count - a.count),
            firstLaunchByUser: [...firstLaunchByUserMap.entries()].map(([userId, at]) => ({
                userId,
                at: at.toISOString(),
            })),
        };
    }
}
