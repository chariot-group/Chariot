import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/CharacterService", () => ({ default: { getCharacterById: vi.fn() } }));

import { provisionalCharacterFromTrackerRow } from "@/components/initiativeTracker/InitiativeTrackerHealthDialog";
import { isPlayer } from "@/utils/global.utils";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

const row = {
  id: "row-1",
  characterId: "c-1",
  hitPoints: 4,
  maxHitPoints: 20,
  tempHitPoints: 3,
  kind: "player",
  deathSavesFailures: 2,
} as InitiativeTrackerRow;

describe("provisionalCharacterFromTrackerRow (HP dialog opens without loader)", () => {
  it("nominal: a player row gives a player with the mirrored HP and death save failures", () => {
    const character = provisionalCharacterFromTrackerRow(row);

    expect(isPlayer(character)).toBe(true);
    expect(character._id).toBe("c-1");
    expect(character.stats).toMatchObject({ currentHitPoints: 4, maxHitPoints: 20, tempHitPoints: 3 });
    expect(isPlayer(character) && character.deathSaves).toEqual({ successes: 0, failures: 2 });
  });

  it("edge: last known successes are reused so they do not flash back to 0", () => {
    const character = provisionalCharacterFromTrackerRow(row, 2);
    expect(isPlayer(character) && character.deathSaves.successes).toBe(2);
  });

  it("guard: an NPC row has no death saves", () => {
    const character = provisionalCharacterFromTrackerRow({ ...row, kind: "npc" });
    expect(isPlayer(character)).toBe(false);
    expect("deathSaves" in character).toBe(false);
  });
});
