import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOKEN_HISTORY_FILTERS,
  filterAndSortTokenHistory,
  formatTokenAmount,
  isTokenExpense,
  isTokenPurchase,
  matchesTokenHistoryFilters,
} from "@/lib/tokenHistory";
import type { History } from "@/types/user";

const entry = (overrides: Partial<History>): History => ({
  date: new Date("2024-06-01T10:00:00Z"),
  campaignName: "Campaign",
  value: 1,
  ...overrides,
});

describe("FR-027 — token history helpers", () => {
  it("nominal: classifies purchases and expenses by sign", () => {
    expect(isTokenPurchase(-10)).toBe(true);
    expect(isTokenExpense(5)).toBe(true);
    expect(isTokenPurchase(5)).toBe(false);
    expect(isTokenExpense(-10)).toBe(false);
  });

  it("nominal: default filters include both purchases and expenses", () => {
    const history = [
      entry({ value: -10, date: new Date("2024-06-02T10:00:00Z") }),
      entry({ value: 3, date: new Date("2024-06-01T10:00:00Z") }),
    ];

    const result = filterAndSortTokenHistory(history, DEFAULT_TOKEN_HISTORY_FILTERS);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(-10);
    expect(result[1].value).toBe(3);
  });

  it("edge: purchases-only filter hides expenses", () => {
    const history = [entry({ value: -4 }), entry({ value: 2 })];
    const result = filterAndSortTokenHistory(history, {
      showPurchases: true,
      showExpenses: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(-4);
  });

  it("edge: expenses-only filter hides purchases", () => {
    const history = [entry({ value: -4 }), entry({ value: 2 })];
    const result = filterAndSortTokenHistory(history, {
      showPurchases: false,
      showExpenses: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(2);
  });

  it("error: both filters disabled excludes every entry", () => {
    const history = [entry({ value: -4 }), entry({ value: 2 })];
    expect(
      matchesTokenHistoryFilters(-4, { showPurchases: false, showExpenses: false }),
    ).toBe(false);
    expect(filterAndSortTokenHistory(history, { showPurchases: false, showExpenses: false })).toEqual(
      [],
    );
  });

  it("nominal: formats signed amounts for display", () => {
    expect(formatTokenAmount(-12)).toBe("+12");
    expect(formatTokenAmount(7)).toBe("-7");
    expect(formatTokenAmount(0)).toBe("0");
  });
});
