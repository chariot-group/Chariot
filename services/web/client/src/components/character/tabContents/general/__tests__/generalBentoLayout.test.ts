import { describe, expect, it } from "vitest";
import {
  BREAKPOINTS,
  emptyCells,
  place,
  spanAt,
  startAt,
} from "@/components/character/tabContents/__tests__/bentoPlacement";
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
    s.skills,
    s.abilityScores,
    s.savingThrows,
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
    s.skills,
    s.abilityScores,
    s.savingThrows,
    s.proficiencies,
    s.abilities,
  ],
  "npc view": (s = NPC_VIEW_SLOTS) => [
    s.character,
    s.statistics,
    s.skills,
    s.abilityScores,
    s.savingThrows,
    s.proficiencies,
    s.abilities,
  ],
  "npc edit": (s = NPC_EDIT_SLOTS) => [
    s.character,
    s.statistics,
    s.skills,
    s.abilityScores,
    s.savingThrows,
    s.proficiencies,
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

  it("nominal: PC and NPC skills are tall and leftmost, ability scores then saving throws stacked on their right", () => {
    for (const name of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      for (const bp of [BREAKPOINTS.desktop, BREAKPOINTS.wide]) {
        const all: string[] = [...LAYOUTS[name]()];
        // Skills follow the character, the statistics and (PC) the four tiles
        const skillsIndex = name.startsWith("player") ? 6 : 2;
        // A card explicitly placed in the first band (PC proficiencies from `3xl`) belongs to it
        const fixed = all.filter((c) => startAt(c, "row", bp) !== undefined);
        const slots = [
          ...all.slice(0, skillsIndex),
          ...fixed,
          ...all.slice(skillsIndex).filter((c) => !fixed.includes(c)),
        ];
        const before = place(slots.slice(0, skillsIndex + fixed.length), bp).length;
        const cols = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);
        const upTo = (n: number) => place(slots.slice(0, skillsIndex + fixed.length + n), bp);
        const withSkills = upTo(1);
        const withAbility = upTo(2);

        // Skills alone fill the 8 left columns of both rows; ability scores then saving throws take the 4 right ones
        for (const row of [before, before + 1]) {
          const label = `${name} row ${row}`;
          expect(
            cols(0, 8).every((c) => withSkills[row][c]) && cols(8, 12).every((c) => !withSkills[row][c]),
            label,
          ).toBe(true);
        }
        expect(
          cols(8, 12).every((c) => withAbility[before][c]),
          name,
        ).toBe(true);
        expect(
          cols(8, 12).every((c) => !withAbility[before + 1][c]),
          name,
        ).toBe(true);
        expect(
          upTo(3).every((row) => row.every(Boolean)),
          name,
        ).toBe(true);
      }
    }
  });

  it("edge: on tablet NPC skills take the left half over two rows, ability scores then saving throws on the right", () => {
    const withSkills = place([...LAYOUTS["npc view"]()].slice(0, 3), BREAKPOINTS.tablet);
    const grid = place([...LAYOUTS["npc view"]()].slice(0, 5), BREAKPOINTS.tablet);

    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
    for (const row of [2, 3]) expect(withSkills[row]).toEqual([true, true, false, false]);
  });

  it("edge: every slot keeps min-w-0 so long values cannot widen the grid", () => {
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) expect(classes.split(" ")).toContain("min-w-0");
    }
  });

  it("nominal: on very large screens the four PC tiles sit side by side next to the statistics, proficiencies right under them", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    const tiles = place(slots.slice(0, 6), BREAKPOINTS.wide);
    const proficiencies = slots[9];
    const withProficiencies = place([...slots.slice(0, 6), proficiencies], BREAKPOINTS.wide);

    // The four tiles complete the first row; the 4 right cells of the second row are left for proficiencies
    expect(tiles[0].every(Boolean)).toBe(true);
    expect(tiles[1].slice(8)).toEqual([false, false, false, false]);
    expect(spanAt(slots[2], "col", BREAKPOINTS.wide)).toBe(1);
    expect(spanAt(slots[1], "col", BREAKPOINTS.wide)).toBe(5);
    expect(withProficiencies).toHaveLength(2);
    expect(withProficiencies.every((row) => row.every(Boolean))).toBe(true);
    expect([startAt(proficiencies, "col", BREAKPOINTS.wide), startAt(proficiencies, "row", BREAKPOINTS.wide)]).toEqual([
      9, 2,
    ]);
  });

  it("edge: on very large screens the skills band starts right after the first band, abilities last", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    const grid = place(slots, BREAKPOINTS.wide);
    const withoutAbilities = place(slots.slice(0, -1), BREAKPOINTS.wide);

    // Band 1 (2 rows) · skills band (2 rows) · abilities (1 row)
    expect(withoutAbilities).toHaveLength(4);
    expect(grid).toHaveLength(5);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
  });

  it("edge: on very large screens player edit keeps the 2 × 2 tiles and a full-width proficiencies card", () => {
    const slots: string[] = [...LAYOUTS["player edit"]()];
    const grid = place(slots.slice(0, 6), BREAKPOINTS.wide);

    expect(grid).toHaveLength(2);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
    expect(startAt(slots[9], "row", BREAKPOINTS.wide)).toBeUndefined();
    expect(spanAt(slots[9], "col", BREAKPOINTS.wide)).toBe(12);
  });

  it("edge: the wide placement does not change desktop spans (xl layout untouched), NPC has no wide override", () => {
    for (const slots of [NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) expect(classes).not.toContain("3xl:");
    }
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) {
        const withoutWide = classes
          .split(" ")
          .filter((c) => !c.startsWith("3xl:"))
          .join(" ");
        expect(spanAt(withoutWide, "col", BREAKPOINTS.desktop)).toBe(spanAt(classes, "col", BREAKPOINTS.desktop));
      }
    }
  });

  it("failure: NPC skills without their row span would leave a hole under the skills", () => {
    const slots: string[] = [...LAYOUTS["npc view"]()];
    slots[2] = slots[2].replace("sm:row-span-2", "");

    expect(emptyCells(slots, BREAKPOINTS.desktop)).not.toEqual([]);
  });

  it("failure: proficiencies without its explicit wide placement would leave a hole under the tiles", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    slots[9] = slots[9].replace("3xl:row-start-2", "");

    expect(emptyCells(slots, BREAKPOINTS.wide)).not.toEqual([]);
  });

  it("failure: statistics without its wide row span would leave holes next to the tiles", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    slots[1] = slots[1].replace("3xl:row-span-2", "");

    expect(emptyCells(slots, BREAKPOINTS.wide)).not.toEqual([]);
  });

  it("failure: an extra half-width card after the abilities would leave a hole on tablet", () => {
    const slots = [...LAYOUTS["npc view"](), PLAYER_VIEW_SLOTS.abilityScores];

    expect(emptyCells(slots, BREAKPOINTS.tablet)).not.toEqual([]);
  });
});
