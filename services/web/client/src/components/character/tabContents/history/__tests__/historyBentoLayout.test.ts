import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place } from "@/components/character/tabContents/__tests__/bentoPlacement";
import {
  HISTORY_SLOTS,
  HISTORY_TEXT_FIELDS,
} from "@/components/character/tabContents/history/shared/historyBentoLayout";

/** DOM order of the cards (read and edit share it). */
const LAYOUT = [HISTORY_SLOTS.appearance, ...HISTORY_TEXT_FIELDS.map(({ slot }) => slot)];

/** @see FR-character-history-bento-layout */
describe("History tab bento layout", () => {
  for (const [bpName, bp] of Object.entries(BREAKPOINTS)) {
    it(`nominal: leaves no empty cell on ${bpName} (${bp.columns} columns)`, () => {
      expect(emptyCells(LAYOUT, bp)).toEqual([]);
    });
  }

  it("nominal: three bands on desktop (appearance with its description, four personality cards, allies + backstory)", () => {
    expect(place(LAYOUT, BREAKPOINTS.desktop)).toHaveLength(3);
  });

  it("edge: tablet gives appearance a full row, pairs the personality cards, then allies and backstory full rows", () => {
    expect(place(LAYOUT, BREAKPOINTS.tablet)).toHaveLength(5);
    expect(place(LAYOUT, BREAKPOINTS.mobile)).toHaveLength(7);
  });

  it("guard: appearance is full width at every breakpoint (a long description never stretches a sibling)", () => {
    expect(HISTORY_SLOTS.appearance.split(" ")).toEqual(
      expect.arrayContaining(["col-span-2", "sm:col-span-4", "xl:col-span-12"]),
    );
    expect(HISTORY_TEXT_FIELDS.map(({ key }) => key)).not.toContain("description");
  });

  it("failure: no slot uses h-fit, self-start or order-* (stretch and reading order)", () => {
    for (const classes of LAYOUT) {
      expect(classes).not.toMatch(/h-fit|self-start|order-/);
      expect(classes.split(" ")).toContain("min-w-0");
    }
  });
});
