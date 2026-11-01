import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place } from "@/components/character/tabContents/__tests__/bentoPlacement";
import {
  NPC_EDIT_SLOTS,
  NPC_VIEW_SLOTS,
  PLAYER_EDIT_SLOTS,
  PLAYER_VIEW_SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

/** DOM order of the cards, mirroring the General tab components. */
const LAYOUTS = {
  "player view": (s = PLAYER_VIEW_SLOTS) => [
    s.character,
    s.statistics,
    s.tile,
    s.tile,
    s.tile,
    s.tile,
    s.abilityScores,
    s.savingThrows,
    s.sideTile,
    s.sideTile,
    s.skills,
    s.proficiencies,
    s.abilities,
  ],
  "player edit": (s = PLAYER_EDIT_SLOTS) => [
    s.character,
    s.statistics,
    s.tile,
    s.tile,
    s.tile,
    s.tile,
    s.abilityScores,
    s.savingThrows,
    s.sideTile,
    s.sideTile,
    s.skills,
    s.proficiencies,
    s.abilities,
  ],
  "npc view": (s = NPC_VIEW_SLOTS) => [
    s.character,
    s.statistics,
    s.abilityScores,
    s.savingThrows,
    s.proficiencies,
    s.skills,
    s.tile,
    s.tile,
    s.abilities,
  ],
  "npc edit": (s = NPC_EDIT_SLOTS) => [
    s.character,
    s.statistics,
    s.abilityScores,
    s.savingThrows,
    s.proficiencies,
    s.skills,
    s.tile,
    s.tile,
    s.abilities,
  ],
} as const;

/** @see FR-character-general-bento-layout */
describe("General tab bento layout", () => {
  for (const [layoutName, slotsOf] of Object.entries(LAYOUTS)) {
    for (const [bpName, bp] of Object.entries(BREAKPOINTS)) {
      it(`nominal: ${layoutName} leaves no empty cell on ${bpName} (${bp.columns} columns)`, () => {
        expect(emptyCells([...slotsOf()], bp)).toEqual([]);
      });
    }
  }

  it("nominal: player view places the four tiles on one row next to the character card on desktop", () => {
    const grid = place([...LAYOUTS["player view"]()].slice(0, 6), BREAKPOINTS.desktop);

    expect(grid).toHaveLength(2);
    expect(grid[1].every(Boolean)).toBe(true);
  });

  it("edge: the NPC character card never spans rows, so a sparse identity is not stretched", () => {
    for (const slots of [NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) expect(slots.character).not.toMatch(/row-span/);
  });

  it("nominal: NPC tiles stack next to the skills on desktop", () => {
    const grid = place([...LAYOUTS["npc view"]()].slice(0, 8), BREAKPOINTS.desktop);

    expect(grid).toHaveLength(4);
    expect(grid.slice(2).every((row) => row.every(Boolean))).toBe(true);
  });

  it("edge: every slot keeps min-w-0 so long values cannot widen the grid", () => {
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) expect(classes.split(" ")).toContain("min-w-0");
    }
  });

  it("failure: an extra half-width card after the abilities would leave a hole on tablet", () => {
    const slots = [...LAYOUTS["npc view"](), PLAYER_VIEW_SLOTS.sideTile];

    expect(emptyCells(slots, BREAKPOINTS.tablet)).not.toEqual([]);
  });
});
