import { Period, TimePoint } from '@/resources/analytics/analytics.types';

export function resolveDateRange(
  from?: Date,
  to?: Date,
): { from: Date; to: Date } {
  return {
    from: from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: to ?? new Date(),
  };
}

export function getBucketKey(date: Date, period: Period): string {
  if (period === 'daily') {
    return date.toISOString().slice(0, 10);
  }
  if (period === 'weekly') {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    return d.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 7);
}

export function bucketCounts(dates: Date[], period: Period): TimePoint[] {
  const buckets = new Map<string, number>();
  for (const date of dates) {
    const key = getBucketKey(date, period);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function unusedGiftUsersFilter(): {
  balance: number;
  history: { $not: { $elemMatch: { value: { $gt: number } } } };
} {
  return {
    balance: 1,
    history: {
      $not: { $elemMatch: { value: { $gt: 0 } } },
    },
  };
}

export function spentGiftNeverBoughtFilter(shopCampaignName: string) {
  return {
    balance: 0,
    history: {
      $not: {
        $elemMatch: {
          campaignName: shopCampaignName,
          value: { $lt: 0 },
        },
      },
    },
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(value * 10) / 10;
}
