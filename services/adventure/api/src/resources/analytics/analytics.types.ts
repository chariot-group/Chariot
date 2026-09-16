export type Period = 'daily' | 'weekly' | 'monthly';

export interface TimePoint {
  date: string;
  count: number;
}

export interface AdventureBusinessAnalytics {
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
}
