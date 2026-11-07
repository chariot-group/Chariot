import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SHEET_BREAKPOINTS as BREAKPOINTS,
  emptyCells,
  place,
  spanAt,
  startAt,
} from "@/components/character/tabContents/__tests__/bentoPlacement";
import {
  BENTO_GRID_CLASS,
  GENERAL_BENTO_GRID_CLASS,
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
    s.abilities,
    s.proficiencies,
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
    s.abilities,
    s.proficiencies,
  ],
  "npc view": (s = NPC_VIEW_SLOTS) => [
    s.character,
    s.statistics,
    s.skills,
    s.abilityScores,
    s.savingThrows,
    s.abilities,
    s.proficiencies,
  ],
  "npc edit": (s = NPC_EDIT_SLOTS) => [
    s.character,
    s.statistics,
    s.skills,
    s.abilityScores,
    s.savingThrows,
    s.abilities,
    s.proficiencies,
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

  /** Rows of the skills band (and the row after it) as "1"/"0" strings, after placing the band cards picked by `keep`. */
  const bandRows = (name: keyof typeof LAYOUTS, bp: (typeof BREAKPOINTS)[string], keep: (index: number) => boolean) => {
    const all: string[] = [...LAYOUTS[name]()];
    // Skills follow the character, the statistics and (PC) the four tiles; band DOM order:
    // skills · ability scores · saving throws · abilities · proficiencies
    const skillsIndex = name.startsWith("player") ? 6 : 2;
    const band = all.slice(skillsIndex);
    // A band card explicitly placed in the first band (PC proficiencies from `3xl`) belongs to it
    const inFirstBand = (c: string) => c === band[4] && startAt(c, "row", bp) !== undefined;
    const firstBand = [...all.slice(0, skillsIndex), ...band.filter(inFirstBand)];
    const before = place(firstBand, bp).length;
    const grid = place([...firstBand, ...band.filter((c, i) => !inFirstBand(c) && keep(i))], bp);
    return [before, before + 1, before + 2].map((r) => (grid[r] ?? []).map((f) => (f ? 1 : 0)).join(""));
  };
  const firstN = (n: number) => (i: number) => i < n;

  it("nominal: laptop L — skills 6 × 2 rows, ability scores and saving throws side by side, abilities under both, proficiencies under the skills", () => {
    for (const name of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      const bp = BREAKPOINTS.desktop;
      expect(bandRows(name, bp, firstN(1)).slice(0, 2), name).toEqual(["111111000000", "111111000000"]);
      expect(bandRows(name, bp, firstN(3)).slice(0, 2), name).toEqual(["111111111111", "111111000000"]);
      expect(bandRows(name, bp, firstN(4)), name).toEqual(["111111111111", "111111111111", "000000111111"]);
      expect(bandRows(name, bp, firstN(5)), name).toEqual(["111111111111", "111111111111", "111111111111"]);
    }
  });

  it("nominal: very large screens — skills 6 × 2 rows, ability scores over saving throws, abilities on the right", () => {
    for (const name of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      const bp = BREAKPOINTS.wide;
      // Abilities are placed explicitly on the band rows, before the auto-placed cards
      expect(bandRows(name, bp, (i) => i === 3).slice(0, 2), name).toEqual(["000000000111", "000000000111"]);
      expect(bandRows(name, bp, (i) => i < 2 || i === 3).slice(0, 2), name).toEqual(["111111111111", "111111000111"]);
      expect(bandRows(name, bp, firstN(4)).slice(0, 2), name).toEqual(["111111111111", "111111111111"]);
    }
  });

  it("edge: on tablet skills take the left half over three rows, ability scores, saving throws then abilities on the right", () => {
    for (const name of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      const slots: string[] = [...LAYOUTS[name]()];
      const skillsIndex = name.startsWith("player") ? 6 : 2;
      const before = place(slots.slice(0, skillsIndex), BREAKPOINTS.tablet).length;
      const withSkills = place(slots.slice(0, skillsIndex + 1), BREAKPOINTS.tablet);
      // DOM order: skills · ability scores · saving throws · abilities (index + 4), then full-width proficiencies
      const band = place(slots.slice(0, skillsIndex + 4), BREAKPOINTS.tablet);

      for (const row of [before, before + 1, before + 2]) {
        expect(withSkills[row], `${name} row ${row}`).toEqual([true, true, false, false]);
      }
      expect(band, name).toHaveLength(before + 3);
      expect(
        band.every((row) => row.every(Boolean)),
        name,
      ).toBe(true);
      expect(spanAt(slots[skillsIndex + 4], "col", BREAKPOINTS.tablet), name).toBe(4);
    }
  });

  it("edge: every slot keeps min-w-0 so long values cannot widen the grid", () => {
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) expect(classes.split(" ")).toContain("min-w-0");
    }
  });

  it("nominal: on very large screens the four PC tiles sit side by side next to the statistics, proficiencies right under them", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    const tiles = place(slots.slice(0, 6), BREAKPOINTS.wide);
    const proficiencies = slots[10];
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

  it("edge: on very large screens the skills band comes right after the first band", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    const grid = place(slots, BREAKPOINTS.wide);

    // Band 1 (2 rows, proficiencies under the tiles) · skills band (2 rows)
    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
  });

  it("edge: on very large screens player edit keeps the 2 × 2 tiles and a full-width proficiencies card", () => {
    const slots: string[] = [...LAYOUTS["player edit"]()];
    const grid = place(slots.slice(0, 6), BREAKPOINTS.wide);

    expect(grid).toHaveLength(2);
    expect(grid.every((row) => row.every(Boolean))).toBe(true);
    expect(startAt(slots[10], "row", BREAKPOINTS.wide)).toBeUndefined();
    expect(spanAt(slots[10], "col", BREAKPOINTS.wide)).toBe(12);
  });

  it("edge: the wide placement does not change desktop spans (laptop L layout untouched)", () => {
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) {
        const withoutWide = classes
          .split(" ")
          .filter((c) => !c.startsWith("@sheet-xl:"))
          .join(" ");
        expect(spanAt(withoutWide, "col", BREAKPOINTS.desktop)).toBe(spanAt(classes, "col", BREAKPOINTS.desktop));
      }
    }
  });

  it("nominal: the General grid and its slots follow the sheet width (container queries), never the viewport", () => {
    expect(GENERAL_BENTO_GRID_CLASS).toMatch(/@sheet-md:grid-cols-4/);
    expect(GENERAL_BENTO_GRID_CLASS).toMatch(/@sheet-lg:grid-cols-12/);
    for (const slots of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      for (const classes of Object.values(slots)) {
        expect(classes.split(" ").filter((c) => /^(sm|md|lg|xl|2xl|3xl):/.test(c))).toEqual([]);
      }
    }
  });

  it("edge: with the sidebar open on a tablet (≈ 30rem left) the General tab falls back to the stacked layout", () => {
    // 820px viewport − 16rem sidebar − page padding ≈ 30rem: below `@sheet-md` (36rem)
    const grid = place([...LAYOUTS["npc view"]()], BREAKPOINTS.mobile);

    expect(grid.every((row) => row.every(Boolean))).toBe(true);
    expect(grid).toHaveLength(LAYOUTS["npc view"]().length);
  });

  it("edge: the other sheet tabs keep the viewport grid", () => {
    expect(BENTO_GRID_CLASS).toMatch(/(^| )sm:grid-cols-4( |$)/);
    expect(BENTO_GRID_CLASS).not.toContain("@sheet-");
  });

  it("failure: the container sizes used by the General slots are declared in the theme", () => {
    const css = readFileSync(`${process.cwd()}/src/app/[locale]/globals.css`, "utf8");

    for (const size of ["md", "lg", "xl"]) expect(css).toMatch(new RegExp(`--container-sheet-${size}:\\s*\\d+rem;`));
  });

  it("failure: NPC skills without their row span would leave a hole under the skills", () => {
    const slots: string[] = [...LAYOUTS["npc view"]()];
    slots[2] = slots[2].replace("@sheet-md:row-span-3", "").replace("@sheet-lg:row-span-2", "");

    expect(emptyCells(slots, BREAKPOINTS.desktop)).not.toEqual([]);
  });

  it("failure: on tablet, skills over two rows only would push proficiencies down and leave a hole", () => {
    const slots: string[] = [...LAYOUTS["npc view"]()];
    slots[2] = slots[2].replace("@sheet-md:row-span-3", "@sheet-md:row-span-2");

    expect(emptyCells(slots, BREAKPOINTS.tablet)).not.toEqual([]);
  });

  it("failure: proficiencies without its explicit wide placement would leave a hole under the tiles", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    slots[10] = slots[10].replace("@sheet-xl:row-start-2", "");

    expect(emptyCells(slots, BREAKPOINTS.wide)).not.toEqual([]);
  });

  it("failure: statistics without its wide row span would leave holes next to the tiles", () => {
    const slots: string[] = [...LAYOUTS["player view"]()];
    slots[1] = slots[1].replace("@sheet-xl:row-span-2", "");

    expect(emptyCells(slots, BREAKPOINTS.wide)).not.toEqual([]);
  });

  it("failure: abilities before the saving throws would leave holes on laptop L", () => {
    const slots: string[] = [...LAYOUTS["npc view"]()];
    [slots[4], slots[5]] = [slots[5], slots[4]];

    expect(emptyCells(slots, BREAKPOINTS.desktop)).not.toEqual([]);
  });

  it("failure: abilities without their explicit wide row would leave holes on very large screens", () => {
    for (const name of ["player view", "npc view"] as const) {
      const slots: string[] = [...LAYOUTS[name]()];
      const i = slots.length - 2;
      slots[i] = slots[i].replace(/@sheet-xl:row-start-\d+/, "");

      expect(emptyCells(slots, BREAKPOINTS.wide), name).not.toEqual([]);
    }
  });

  it("failure: an extra half-width card after the proficiencies would leave a hole on tablet", () => {
    const slots = [...LAYOUTS["npc view"](), PLAYER_VIEW_SLOTS.abilityScores];

    expect(emptyCells(slots, BREAKPOINTS.tablet)).not.toEqual([]);
  });

  it("nominal: from @sheet-md the Abilities slot lets its rows fill the stretched card (variables set on the card)", () => {
    for (const layout of [PLAYER_VIEW_SLOTS, PLAYER_EDIT_SLOTS, NPC_VIEW_SLOTS, NPC_EDIT_SLOTS]) {
      expect(layout.abilities).toContain("@sheet-md:[--abilities-rows-h:0px]");
      expect(layout.abilities).toContain("@sheet-md:[--abilities-rows-max:none]");
      expect(layout.abilities).not.toMatch(/\[&>\[role=group\]\]/);
    }
  });
});
