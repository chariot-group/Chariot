import { describe, expect, it } from "vitest";
import { shouldBroadcastBattleStateSnapshot } from "@/hooks/useSessionBattleSync";

describe("FR-session-combat-navigation / FR-tracker-bulk-display — battle state realtime broadcast gate", () => {
  it("edge: keeps initialized-but-not-started combat GM-only", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: true, battleStarted: false, allowPlayerInitiativeInput: false },
        false,
      ),
    ).toBe(false);
  });

  it("nominal: broadcasts initialized combat when player initiative entry is enabled", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: true, battleStarted: false, allowPlayerInitiativeInput: true },
        false,
      ),
    ).toBe(true);
  });

  it("edge: broadcasts started combat updates", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: true, battleStarted: true, allowPlayerInitiativeInput: false },
        false,
      ),
    ).toBe(true);
  });

  it("error: broadcasts the cleanup snapshot after a started combat ends", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: false, battleStarted: false, allowPlayerInitiativeInput: false },
        true,
      ),
    ).toBe(true);
  });

  it("edge: ignores empty combat state when nothing had been broadcast", () => {
    expect(
      shouldBroadcastBattleStateSnapshot(
        { battleInitialized: false, battleStarted: false, allowPlayerInitiativeInput: false },
        false,
      ),
    ).toBe(false);
  });
});
