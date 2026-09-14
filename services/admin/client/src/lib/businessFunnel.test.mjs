import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirrors src/lib/businessFunnel.ts for node:test without a TS runner.
function conversionRate(numerator, denominator) {
  if (denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

function formatKpiCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

function spentGiftNeverBoughtCount(economy) {
  if (typeof economy.spentGiftNeverBought === "number" && Number.isFinite(economy.spentGiftNeverBought)) {
    return economy.spentGiftNeverBought;
  }
  return Math.max(0, (economy.blockedUsers ?? 0) - (economy.unusedGiftUsers ?? 0));
}

function composeFunnelSteps(input) {
  return [
    { id: "acquisition", count: input.acquisition, rateFromPrevious: null },
    {
      id: "activation",
      count: input.activation,
      rateFromPrevious: conversionRate(input.activation, input.acquisition),
    },
    {
      id: "retention",
      count: input.retention,
      rateFromPrevious: conversionRate(input.retention, input.activation),
    },
    {
      id: "referral",
      count: input.referral,
      rateFromPrevious: conversionRate(input.referral, input.acquisition),
    },
    {
      id: "revenue",
      count: input.revenue,
      rateFromPrevious: conversionRate(input.revenue, input.activation),
    },
  ];
}

function deadCampaignCount(createdIds, launchedIds) {
  const launched = new Set(launchedIds);
  return createdIds.filter((id) => !launched.has(id)).length;
}

function topShare(counts, percentile = 0.1) {
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

function medianDelayHours(firstLaunch, firstPurchase) {
  const launchByUser = new Map(firstLaunch.map((row) => [row.userId, Date.parse(row.at)]));
  const delays = [];
  for (const row of firstPurchase) {
    const launch = launchByUser.get(row.userId);
    const purchase = Date.parse(row.at);
    if (!Number.isFinite(launch) || !Number.isFinite(purchase) || purchase < launch) {
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

describe("FR-admin-business-kpis conversionRate", () => {
  it("nominal: divides successive funnel steps", () => {
    assert.equal(conversionRate(40, 80), 50);
    const steps = composeFunnelSteps({
      acquisition: 100,
      activation: 40,
      retention: 20,
      referral: 10,
      revenue: 8,
    });
    assert.equal(steps[1].rateFromPrevious, 40);
    assert.equal(steps[2].rateFromPrevious, 50);
    assert.equal(steps[3].rateFromPrevious, 10);
    assert.equal(steps[4].rateFromPrevious, 20);
  });

  it("edge: returns null when the denominator is 0", () => {
    assert.equal(conversionRate(5, 0), null);
    const steps = composeFunnelSteps({
      acquisition: 0,
      activation: 0,
      retention: 0,
      referral: 0,
      revenue: 0,
    });
    assert.equal(steps[1].rateFromPrevious, null);
  });
});

describe("FR-admin-business-kpis deadCampaignCount", () => {
  it("counts campaigns never launched", () => {
    assert.equal(deadCampaignCount(["a", "b", "c"], ["b"]), 2);
  });
});

describe("FR-admin-business-kpis topShare", () => {
  it("returns the share of tables held by the top 10% GMs", () => {
    assert.equal(topShare([9, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 50);
  });

  it("edge: empty counts return null", () => {
    assert.equal(topShare([]), null);
  });
});

describe("FR-admin-business-kpis medianDelayHours", () => {
  it("nominal: median delay from first table to first purchase", () => {
    assert.equal(
      medianDelayHours(
        [
          { userId: "a", at: "2026-09-01T00:00:00.000Z" },
          { userId: "b", at: "2026-09-01T00:00:00.000Z" },
        ],
        [
          { userId: "a", at: "2026-09-02T00:00:00.000Z" },
          { userId: "b", at: "2026-09-03T00:00:00.000Z" },
        ],
      ),
      36,
    );
  });

  it("edge: ignores purchases before the first table", () => {
    assert.equal(
      medianDelayHours(
        [{ userId: "a", at: "2026-09-10T00:00:00.000Z" }],
        [{ userId: "a", at: "2026-09-01T00:00:00.000Z" }],
      ),
      null,
    );
  });
});

describe("FR-admin-business-kpis formatKpiCount", () => {
  it("nominal: stringifies a finite number", () => {
    assert.equal(formatKpiCount(0), "0");
  });

  it("edge: missing values become an em dash", () => {
    assert.equal(formatKpiCount(undefined), "—");
    assert.equal(formatKpiCount(null), "—");
  });
});

describe("FR-admin-business-kpis spentGiftNeverBoughtCount", () => {
  it("nominal: uses the explicit exclusive count", () => {
    assert.equal(
      spentGiftNeverBoughtCount({
        spentGiftNeverBought: 3,
        unusedGiftUsers: 1,
        blockedUsers: 99,
      }),
      3,
    );
  });

  it("edge: falls back to blocked minus unused when the field is missing", () => {
    assert.equal(
      spentGiftNeverBoughtCount({ unusedGiftUsers: 1, blockedUsers: 1 }),
      0,
    );
  });
});
