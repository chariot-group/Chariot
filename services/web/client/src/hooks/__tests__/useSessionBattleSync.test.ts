import { describe, expect, it } from "vitest";
import { shouldBroadcastBattleStateSnapshot } from "@/hooks/useSessionBattleSync";

describe("FR-021 / FR-023 — battle state realtime broadcast gate", () => {
  it("edge: keeps initialized-but-not-started combat GM-only", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: true, battleStarted: false },
        false,
      ),
    ).toBe(false);
  });

  it("edge: broadcasts started combat updates", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: true, battleStarted: true },
        false,
      ),
    ).toBe(true);
  });

  it("error: broadcasts the cleanup snapshot after a started combat ends", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: false, battleStarted: false },
        true,
      ),
    ).toBe(true);
  });

  it("edge: ignores empty combat state when nothing had been broadcast", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: false, battleStarted: false },
        false,
      ),
    ).toBe(false);
  });
});
