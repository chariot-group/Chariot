import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerConcentrationUpdateApplier,
  submitTrackerConcentrationUpdate,
} from "@/lib/sessionConcentrationBridge";
import { getPooledSessionSocket } from "@/lib/sessionSocketPool";

vi.mock("@/lib/sessionSocketPool", () => ({
  getPooledSessionSocket: vi.fn(),
}));

describe("FR-tracker-concentration — sessionConcentrationBridge", () => {
  beforeEach(() => {
    registerConcentrationUpdateApplier(null);
    vi.mocked(getPooledSessionSocket).mockReset();
  });

  it("nominal: relays player updates via WebSocket when applier does not handle them", () => {
    const emit = vi.fn();
    vi.mocked(getPooledSessionSocket).mockReturnValue({ connected: true, emit } as never);

    registerConcentrationUpdateApplier(() => false);

    submitTrackerConcentrationUpdate("ABC123", {
      characterId: "char-869",
      concentration: { spellName: "Bless" },
      pendingConcentrationCheck: null,
    });

    expect(emit).toHaveBeenCalledWith("session:player-concentration-updated", {
      sessionId: "ABC123",
      characterId: "char-869",
      concentration: { spellName: "Bless" },
      pendingConcentrationCheck: null,
    });
  });

  it("nominal: GM applier short-circuits socket relay when handled locally", () => {
    const emit = vi.fn();
    vi.mocked(getPooledSessionSocket).mockReturnValue({ connected: true, emit } as never);

    registerConcentrationUpdateApplier(() => true);

    submitTrackerConcentrationUpdate("ABC123", {
      characterId: "char-gm",
      concentration: { spellName: "Haste" },
      pendingConcentrationCheck: null,
    });

    expect(emit).not.toHaveBeenCalled();
  });

  it("failure: ignores empty characterId", () => {
    const emit = vi.fn();
    vi.mocked(getPooledSessionSocket).mockReturnValue({ connected: true, emit } as never);

    submitTrackerConcentrationUpdate("ABC123", {
      characterId: "  ",
      concentration: { spellName: "Bless" },
    });

    expect(emit).not.toHaveBeenCalled();
  });

  it("failure: skips emit when socket is disconnected", () => {
    const emit = vi.fn();
    vi.mocked(getPooledSessionSocket).mockReturnValue({ connected: false, emit } as never);

    submitTrackerConcentrationUpdate("ABC123", {
      characterId: "char-869",
      concentration: { spellName: "Bless" },
    });

    expect(emit).not.toHaveBeenCalled();
  });
});
