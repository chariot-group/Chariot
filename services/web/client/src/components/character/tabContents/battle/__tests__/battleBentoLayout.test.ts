import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place } from "@/components/character/tabContents/__tests__/bentoPlacement";
import {
  NPC_BATTLE_SLOTS,
  PLAYER_BATTLE_SLOTS,
} from "@/components/character/tabContents/battle/shared/battleBentoLayout";

/** DOM order of the cards, mirroring the Combat tab components (read and edit share it). */
const LAYOUTS = {
  player: (s = PLAYER_BATTLE_SLOTS) => [
    s.statistics,
    s.savingThrows,
    s.deathSaves,
    s.affinities,
    s.actions,
    s.abilities,
  ],
  npc: (s = NPC_BATTLE_SLOTS) => [
    s.statistics,
    s.savingThrows,
    s.affinities,
    s.actions,
    s.actions,
    s.actions,
    s.abilities,
  ],
} as const;

/** @see FR-character-battle-bento-layout */
describe("Combat tab bento layout", () => {
  for (const [layoutName, slotsOf] of Object.entries(LAYOUTS)) {
    for (const [bpName, bp] of Object.entries(BREAKPOINTS)) {
      it(`nominal: ${layoutName} leaves no empty cell on ${bpName} (${bp.columns} columns)`, () => {
        expect(emptyCells([...slotsOf()], bp)).toEqual([]);
      });
    }
  }

  it("nominal: player band 1 is filled next to the statistics (saving throws, death saves, affinities)", () => {
    const grid = place([...LAYOUTS.player()].slice(0, 4), BREAKPOINTS.desktop);

    expect(grid).toHaveLength(2);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
  });

  it("nominal: list cards are paired side by side on desktop (6 + 6)", () => {
    const player = place([...LAYOUTS.player()], BREAKPOINTS.desktop);
    const npc = place([...LAYOUTS.npc()], BREAKPOINTS.desktop);

    expect(player).toHaveLength(3);
    expect(npc).toHaveLength(4);
    for (const slots of [PLAYER_BATTLE_SLOTS, NPC_BATTLE_SLOTS]) {
      for (const classes of [slots.actions, slots.abilities]) expect(classes).toContain("xl:col-span-6");
    }
  });

  it("edge: list cards take the full width below desktop", () => {
    for (const bp of [BREAKPOINTS.mobile, BREAKPOINTS.tablet]) {
      for (const slots of [PLAYER_BATTLE_SLOTS, NPC_BATTLE_SLOTS]) {
        for (const classes of [slots.actions, slots.abilities])
          expect(place([classes], bp)[0].every(Boolean)).toBe(true);
      }
    }
  });

  it("failure: no slot uses h-fit or order-* (stretch and reading order)", () => {
    for (const slots of [PLAYER_BATTLE_SLOTS, NPC_BATTLE_SLOTS]) {
      for (const classes of Object.values(slots)) {
        expect(classes).not.toMatch(/h-fit|order-/);
        expect(classes.split(" ")).toContain("min-w-0");
      }
    }
  });
});
