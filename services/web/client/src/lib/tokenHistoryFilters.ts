import {
  DEFAULT_TOKEN_HISTORY_FILTERS,
  type TokenHistoryFilters,
} from "@/lib/tokenHistory";

export const TOKEN_HISTORY_FILTERS_STORAGE_KEY = "chariot_token_history_filters";

function isValidFilters(value: unknown): value is TokenHistoryFilters {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.showPurchases === "boolean" &&
    typeof candidate.showExpenses === "boolean"
  );
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function loadTokenHistoryFilters(): TokenHistoryFilters {
  if (!canUseLocalStorage()) {
    return DEFAULT_TOKEN_HISTORY_FILTERS;
  }

  try {
    const raw = localStorage.getItem(TOKEN_HISTORY_FILTERS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TOKEN_HISTORY_FILTERS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidFilters(parsed)) {
      return DEFAULT_TOKEN_HISTORY_FILTERS;
    }
    return parsed;
  } catch {
    return DEFAULT_TOKEN_HISTORY_FILTERS;
  }
}

export function saveTokenHistoryFilters(filters: TokenHistoryFilters): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    localStorage.setItem(TOKEN_HISTORY_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Non-blocking: preferences are optional UX enhancement
  }
}
