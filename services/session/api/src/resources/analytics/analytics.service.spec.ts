import { ParticipantStatus, SessionStatus } from '@prisma/client';
import { AnalyticsService } from '@/resources/analytics/analytics.service';

const from = new Date('2026-09-01T00:00:00.000Z');
const to = new Date('2026-09-30T23:59:59.999Z');

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    creatorUserId: 'gm-1',
    creatorCampaignId: 'camp-1',
    status: SessionStatus.launched,
    createdAt: new Date('2026-09-10T10:00:00.000Z'),
    launchedAt: new Date('2026-09-10T10:20:00.000Z'),
    deletedAt: null,
    expiresAt: new Date('2026-09-10T18:20:00.000Z'),
    participants: [
      { userId: 'gm-1', status: ParticipantStatus.gameMaster },
      { userId: 'p-1', status: ParticipantStatus.connected },
    ],
    ...overrides,
  };
}

describe('FR-admin-business-kpis — Session AnalyticsService.compute', () => {
  const service = new AnalyticsService({} as never);

  it('nominal: computes lobby conversion, activation split and live snapshot', () => {
    const launched = session();
    const abandoned = session({
      id: 's2',
      status: SessionStatus.closed,
      launchedAt: null,
      deletedAt: new Date('2026-09-10T11:00:00.000Z'),
      participants: [{ userId: 'gm-1', status: ParticipantStatus.gameMaster }],
    });
    const secondLaunch = session({
      id: 's3',
      createdAt: new Date('2026-09-12T10:00:00.000Z'),
      launchedAt: new Date('2026-09-12T10:10:00.000Z'),
    });

    const result = service.compute(
      'daily',
      from,
      to,
      [launched, abandoned, secondLaunch],
      [launched, secondLaunch],
      [launched],
    );

    expect(result.lobby.created).toBe(3);
    expect(result.lobby.launched).toBe(2);
    expect(result.lobby.abandoned).toBe(1);
    expect(result.lobby.conversionRate).toBe(66.7);
    expect(result.funnel.activation).toBe(2);
    expect(result.funnel.retention).toBe(2);
    expect(result.funnel.gmActivated).toBe(1);
    expect(result.funnel.playerActivated).toBe(1);
    expect(result.lobby.avgParticipantsAtLaunch).toBe(2);
    expect(result.lobby.soloGmLaunchRate).toBe(0);
    expect(result.live.launchedOpen).toBe(1);
    expect(result.launchedCampaignIds).toEqual(['camp-1']);
    expect(result.firstLaunchByUser).toHaveLength(2);
  });

  it('edge: empty period returns zeros and null median', () => {
    const result = service.compute('daily', from, to, [], [], []);

    expect(result.funnel.activation).toBe(0);
    expect(result.lobby.created).toBe(0);
    expect(result.lobby.conversionRate).toBe(0);
    expect(result.lobby.medianMinutesToLaunch).toBeNull();
    expect(result.live.launchedOpen).toBe(0);
    expect(result.firstLaunchByUser).toEqual([]);
  });

  it('edge: activated lobby has launchedAt null and does not count as launched', () => {
    const lobby = session({
      status: SessionStatus.activated,
      launchedAt: null,
      deletedAt: null,
      participants: [{ userId: 'gm-1', status: ParticipantStatus.gameMaster }],
    });

    const result = service.compute('daily', from, to, [lobby], [], []);

    expect(result.lobby.launched).toBe(0);
    expect(result.lobby.openLobbies).toBe(1);
    expect(result.funnel.activation).toBe(0);
  });
});
