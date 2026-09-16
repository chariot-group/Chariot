export type Period = "daily" | "weekly" | "monthly";

export type TimePoint = {
  date: string;
  count: number;
};

export type UserTimestamp = {
  userId: string;
  at: string;
};

export type AdventureBusinessAnalytics = {
  funnel: {
    acquisition: number;
    acquisitionOverTime: TimePoint[];
  };
  economy: {
    wheelsInCirculation: number;
    wheelsSold: number;
    wheelsSpent: number;
    unusedGiftUsers: number;
    spentGiftNeverBought: number;
    blockedUsers: number;
    giftToPaidRate: number;
  };
  content: {
    medianHoursToFirstPlayer: number | null;
    medianHoursToFirstCampaign: number | null;
    campaignIdsCreated: string[];
  };
};

export type SessionBusinessAnalytics = {
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
  gmTableCounts: { userId: string; count: number }[];
  firstLaunchByUser: UserTimestamp[];
};

export type PaymentBusinessAnalytics = {
  funnel: {
    referralValidated: number;
    firstPurchase: number;
    referralOverTime: TimePoint[];
    firstPurchaseOverTime: TimePoint[];
  };
  monetization: {
    payingUsers: number;
    firstPurchasers: number;
    repeatPurchasers: number;
    repeatPurchaseRate: number;
    firstPurchaseByUser: UserTimestamp[];
  };
};
