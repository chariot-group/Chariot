import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkHealthMock = vi.fn();

vi.mock("@/services/CodexService", () => ({
  default: {
    checkHealth: checkHealthMock,
  },
}));

async function flushHealthCheck() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("codexHealthStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    checkHealthMock.mockReset();
    checkHealthMock.mockResolvedValue(true);
  });

  afterEach(async () => {
    const { resetCodexHealthStoreForTests } = await import("../codexHealthStore");
    resetCodexHealthStoreForTests();
    vi.useRealTimers();
  });

  it("nominal: un seul check malgré plusieurs abonnés", async () => {
    const {
      acquireCodexHealthSubscription,
      releaseCodexHealthSubscription,
      getCodexHealthSnapshot,
    } = await import("../codexHealthStore");

    acquireCodexHealthSubscription();
    acquireCodexHealthSubscription();
    await flushHealthCheck();

    expect(checkHealthMock).toHaveBeenCalledTimes(1);
    expect(getCodexHealthSnapshot().isAvailable).toBe(true);

    releaseCodexHealthSubscription();
    releaseCodexHealthSubscription();
  });

  it("edge: réutilise le cache récent sans relancer un check immédiat", async () => {
    const {
      acquireCodexHealthSubscription,
      releaseCodexHealthSubscription,
      runCodexHealthCheck,
      CODEX_HEALTH_CACHE_TTL_MS,
    } = await import("../codexHealthStore");

    acquireCodexHealthSubscription();
    await flushHealthCheck();
    expect(checkHealthMock).toHaveBeenCalledTimes(1);

    releaseCodexHealthSubscription();
    vi.advanceTimersByTime(CODEX_HEALTH_CACHE_TTL_MS - 1_000);

    acquireCodexHealthSubscription();
    await flushHealthCheck();
    expect(checkHealthMock).toHaveBeenCalledTimes(1);

    releaseCodexHealthSubscription();
  });

  it("error: arrête le polling quand plus aucun abonné", async () => {
    const {
      acquireCodexHealthSubscription,
      releaseCodexHealthSubscription,
      CODEX_HEALTH_INTERVAL_MS,
    } = await import("../codexHealthStore");

    acquireCodexHealthSubscription();
    await flushHealthCheck();
    expect(checkHealthMock).toHaveBeenCalledTimes(1);

    releaseCodexHealthSubscription();
    vi.advanceTimersByTime(CODEX_HEALTH_INTERVAL_MS);

    expect(checkHealthMock).toHaveBeenCalledTimes(1);
  });
});
