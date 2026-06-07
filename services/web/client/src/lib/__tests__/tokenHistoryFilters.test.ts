import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TOKEN_HISTORY_FILTERS } from "@/lib/tokenHistory";
import {
  loadTokenHistoryFilters,
  saveTokenHistoryFilters,
  TOKEN_HISTORY_FILTERS_STORAGE_KEY,
} from "@/lib/tokenHistoryFilters";

describe("FR-024 — token history filter persistence", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: () => null,
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("nominal: returns defaults when nothing is stored", () => {
    expect(loadTokenHistoryFilters()).toEqual(DEFAULT_TOKEN_HISTORY_FILTERS);
  });

  it("nominal: saves and restores user preferences", () => {
    saveTokenHistoryFilters({ showPurchases: false, showExpenses: true });
    expect(loadTokenHistoryFilters()).toEqual({
      showPurchases: false,
      showExpenses: true,
    });
  });

  it("edge: invalid stored payload falls back to defaults", () => {
    localStorage.setItem(TOKEN_HISTORY_FILTERS_STORAGE_KEY, '{"showPurchases":"yes"}');
    expect(loadTokenHistoryFilters()).toEqual(DEFAULT_TOKEN_HISTORY_FILTERS);
  });
});
