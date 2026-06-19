import type { History } from "@/types/user";

export const TOKEN_PURCHASE_CAMPAIGN_NAME = "Shop";

export interface TokenHistoryFilters {
  showPurchases: boolean;
  showExpenses: boolean;
}

export const DEFAULT_TOKEN_HISTORY_FILTERS: TokenHistoryFilters = {
  showPurchases: true,
  showExpenses: true,
};

export function isTokenPurchase(value: number): boolean {
  return value < 0;
}

export function isTokenExpense(value: number): boolean {
  return value > 0;
}

export function matchesTokenHistoryFilters(
  value: number,
  filters: TokenHistoryFilters,
): boolean {
  if (!filters.showPurchases && !filters.showExpenses) {
    return false;
  }
  if (isTokenPurchase(value)) {
    return filters.showPurchases;
  }
  if (isTokenExpense(value)) {
    return filters.showExpenses;
  }
  return filters.showPurchases || filters.showExpenses;
}

export function filterAndSortTokenHistory(
  history: History[],
  filters: TokenHistoryFilters,
): History[] {
  return history
    .filter((entry) => matchesTokenHistoryFilters(entry.value, filters))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function formatTokenAmount(value: number): string {
  if (isTokenPurchase(value)) {
    return `+${Math.abs(value)}`;
  }
  if (isTokenExpense(value)) {
    return `-${value}`;
  }
  return String(value);
}

export function isShopPurchaseEntry(campaignName: string): boolean {
  return campaignName === TOKEN_PURCHASE_CAMPAIGN_NAME;
}
