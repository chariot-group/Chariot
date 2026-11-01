import { describe, expect, it } from "vitest";
import {
  NPC_EDIT_SLOTS,
  NPC_VIEW_SLOTS,
  PLAYER_EDIT_SLOTS,
  PLAYER_VIEW_SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";

type Breakpoint = { prefixes: string[]; columns: number };

const BREAKPOINTS: Record<string, Breakpoint> = {
  mobile: { prefixes: [""], columns: 2 },
  tablet: { prefixes: ["", "sm:"], columns: 4 },
  desktop: { prefixes: ["", "sm:", "xl:"], columns: 12 },
};

/** Effective `col-span` / `row-span` at a breakpoint (mobile-first: the last matching prefix wins). */
const spanAt = (classes: string, kind: "col" | "row", bp: Breakpoint) => {
  let span = 1;
  for (const prefix of bp.prefixes) {
    const match = classes.split(/\s+/).find((c) => new RegExp(`^${prefix}${kind}-span-(\\d+)$`).test(c));
    if (match) span = Number(match.split("-").pop());
  }
  return span;
};

/** Sparse row auto-placement (CSS Grid default); returns the occupancy matrix. */
const place = (slots: string[], bp: Breakpoint) => {
  const grid: boolean[][] = [];
  const free = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y]?.[x]) return false;
    return true;
  };
  let cursorRow = 0;
  let cursorCol = 0;
  for (const classes of slots) {
    const w = Math.min(spanAt(classes, "col", bp), bp.columns);
    const h = spanAt(classes, "row", bp);
    let r = cursorRow;
    let c = cursorCol;
    while (c + w > bp.columns || !free(r, c, w, h)) {
      c++;
      if (c + w > bp.columns) {
        c = 0;
        r++;
      }
    }
    for (let y = r; y < r + h; y++) {
      grid[y] ??= Array(bp.columns).fill(false);
      for (let x = c; x < c + w; x++) grid[y][x] = true;
    }
    cursorRow = r;
    cursorCol = c + w;
  }
  return grid.map((row) => row ?? Array(bp.columns).fill(false));
};

const emptyCells = (slots: string[], bp: Breakpoint) =>
  place(slots, bp).flatMap((row, r) => row.map((filled, c) => (filled ? null : `${r}:${c}`)).filter(Boolean));

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
