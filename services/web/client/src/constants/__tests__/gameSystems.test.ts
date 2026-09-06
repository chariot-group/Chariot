import { describe, expect, it } from "vitest";
import {
  GAME_SYSTEMS,
  HAS_MULTIPLE_CODEX_GAME_SYSTEMS,
  getDefaultCodexGameSystemFilter,
} from "@/constants/gameSystems";

/** @see FR-codex-game-system-filter */
describe("FR-codex-game-system-filter — getDefaultCodexGameSystemFilter", () => {
  it("nominal: preselects the sole game system when only one is supported", () => {
    expect(GAME_SYSTEMS).toHaveLength(1);
    expect(HAS_MULTIPLE_CODEX_GAME_SYSTEMS).toBe(false);
    expect(getDefaultCodexGameSystemFilter()).toBe("DND_5E");
  });

  it("edge: returns null when multiple game systems would be supported", () => {
    const systems = ["DND_5E", "PATHFINDER_2E"] as const;
    const hasMultiple = systems.length > 1;
    const defaultFilter = hasMultiple ? null : systems[0];

    expect(hasMultiple).toBe(true);
    expect(defaultFilter).toBeNull();
  });
});
