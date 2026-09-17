/** @see FR-admin-business-kpis */

import { KPI_INFO } from "@/lib/businessKpiCopy";

export function conversionRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${rate}%`;
}

export function formatKpiCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

export function spentGiftNeverBoughtCount(economy: {
  spentGiftNeverBought?: number;
  unusedGiftUsers?: number;
  blockedUsers?: number;
}): number {
  if (typeof economy.spentGiftNeverBought === "number" && Number.isFinite(economy.spentGiftNeverBought)) {
    return economy.spentGiftNeverBought;
  }
  const unused = economy.unusedGiftUsers ?? 0;
  const blocked = economy.blockedUsers ?? 0;
  return Math.max(0, blocked - unused);
}

export function composeFunnelSteps(input: {
  acquisition: number;
  activation: number;
  retention: number;
  referral: number;
  revenue: number;
}) {
  return [
    {
      id: "acquisition",
      label: "Acquisition",
      hint: "Comptes créés",
      info: KPI_INFO.acquisition,
      count: input.acquisition,
      rateFromPrevious: null,
    },
    {
      id: "activation",
      label: "Activation",
      hint: "1re table lancée",
      info: KPI_INFO.activation,
      count: input.activation,
      rateFromPrevious: conversionRate(input.activation, input.acquisition),
    },
    {
      id: "retention",
      label: "Rétention",
      hint: "2e table",
      info: KPI_INFO.retention,
      count: input.retention,
      rateFromPrevious: conversionRate(input.retention, input.activation),
    },
    {
      id: "referral",
      label: "Recommandation",
      hint: "Filleuls validés",
      info: KPI_INFO.referral,
      count: input.referral,
      rateFromPrevious: conversionRate(input.referral, input.acquisition),
    },
    {
      id: "revenue",
      label: "Revenu",
      hint: "1er achat wheels",
      info: KPI_INFO.revenue,
      count: input.revenue,
      rateFromPrevious: conversionRate(input.revenue, input.activation),
    },
  ];
}

export function deadCampaignCount(createdIds: string[], launchedIds: string[]): number {
  const launched = new Set(launchedIds);
  return createdIds.filter((id) => !launched.has(id)).length;
}

export function topShare(counts: number[], percentile = 0.1): number | null {
  if (counts.length === 0) {
    return null;
  }
  const sorted = [...counts].sort((a, b) => b - a);
  const n = Math.max(1, Math.ceil(sorted.length * percentile));
  const top = sorted.slice(0, n).reduce((sum, count) => sum + count, 0);
  const total = sorted.reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return null;
  }
  return Math.round((top / total) * 1000) / 10;
}

export function medianDelayHours(
  firstLaunch: { userId: string; at: string }[],
  firstPurchase: { userId: string; at: string }[],
): number | null {
  const launchByUser = new Map(firstLaunch.map((row) => [row.userId, Date.parse(row.at)]));
  const delays: number[] = [];
  for (const row of firstPurchase) {
    const launch = launchByUser.get(row.userId);
    const purchase = Date.parse(row.at);
    if (launch === undefined || !Number.isFinite(launch) || !Number.isFinite(purchase) || purchase < launch) {
      continue;
    }
    delays.push((purchase - launch) / 36e5);
  }
  if (delays.length === 0) {
    return null;
  }
  delays.sort((a, b) => a - b);
  const mid = Math.floor(delays.length / 2);
  const value = delays.length % 2 === 0 ? (delays[mid - 1] + delays[mid]) / 2 : delays[mid];
  return Math.round(value * 10) / 10;
}

export function mergeTimeSeries(
  series: Record<string, { date: string; count: number }[]>,
): { date: string; [key: string]: string | number }[] {
  const dates = new Set<string>();
  for (const points of Object.values(series)) {
    for (const point of points) {
      dates.add(point.date);
    }
  }
  return [...dates].sort().map((date) => {
    const row: { date: string; [key: string]: string | number } = { date };
    for (const [key, points] of Object.entries(series)) {
      row[key] = points.find((point) => point.date === date)?.count ?? 0;
    }
    return row;
  });
}
