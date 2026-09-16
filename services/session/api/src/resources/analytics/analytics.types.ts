export type Period = 'daily' | 'weekly' | 'monthly';

export interface TimePoint {
    date: string;
    count: number;
}

export interface UserTimestamp {
    userId: string;
    at: string;
}

export interface GmTableCount {
    userId: string;
    count: number;
}

export interface SessionBusinessAnalytics {
    funnel: {
        activation: number;
        retention: number;
        gmActivated: number;
        playerActivated: number;
        activationOverTime: TimePoint[];
        retentionOverTime: TimePoint[];
    };
    lobby: {
        created: number;
        launched: number;
        abandoned: number;
        openLobbies: number;
        conversionRate: number;
        medianMinutesToLaunch: number | null;
        avgParticipantsAtLaunch: number;
        soloGmLaunchRate: number;
        earlyCloseRate: number;
        repeatGmCount: number;
        repeatPlayerCount: number;
    };
    live: {
        launchedOpen: number;
        connectedParticipants: number;
    };
    launchedCampaignIds: string[];
    gmTableCounts: GmTableCount[];
    firstLaunchByUser: UserTimestamp[];
}
