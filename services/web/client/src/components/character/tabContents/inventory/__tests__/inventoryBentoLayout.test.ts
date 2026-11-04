import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place, spanAt } from "@/components/character/tabContents/__tests__/bentoPlacement";
import { INVENTORY_BENTO_GRID_CLASS, INVENTORY_SLOTS } from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
import { nextCoinValue, normalizeCoinAmount } from "@/components/character/tabContents/inventory/shared/coins";

/** DOM order of the cards (read and edit share it). */
const LAYOUT = [INVENTORY_SLOTS.coins, INVENTORY_SLOTS.equipment, INVENTORY_SLOTS.treasure];

/** @see FR-character-inventory-bento-layout */
describe("Inventory tab bento layout", () => {
  for (const [bpName, bp] of Object.entries(BREAKPOINTS)) {
    it(`nominal: leaves no empty cell on ${bpName} (${bp.columns} columns)`, () => {
      expect(emptyCells(LAYOUT, bp)).toEqual([]);
    });
  }

  it("nominal: coins then equipment on the left half, treasure on the right half over both rows from tablet", () => {
    for (const bp of [BREAKPOINTS.tablet, BREAKPOINTS.desktop]) {
      const half = bp.columns / 2;
      const owner = (slot: string) => place([slot], bp);
      expect(place(LAYOUT, bp)).toHaveLength(2);
      // Coins alone: first row, left half only.
      expect(owner(INVENTORY_SLOTS.coins)[0].filter(Boolean)).toHaveLength(half);
      // Treasure alone (explicit start): right half of both rows.
      const treasure = owner(INVENTORY_SLOTS.treasure);
      expect(treasure).toHaveLength(2);
      for (const row of treasure) expect(row.slice(half).every(Boolean) && !row.slice(0, half).some(Boolean)).toBe(true);
    }
  });

  it("edge: a growing treasure stretches the equipment row, never the coins row", () => {
    expect(INVENTORY_BENTO_GRID_CLASS.split(" ")).toContain("sm:grid-rows-[auto_1fr]");
  });

  it("edge: the coins card is never wider than half the grid from tablet", () => {
    for (const bp of [BREAKPOINTS.tablet, BREAKPOINTS.desktop]) {
      expect(spanAt(INVENTORY_SLOTS.coins, "col", bp)).toBe(bp.columns / 2);
    }
  });

  it("edge: every card takes the full width on mobile", () => {
    expect(place(LAYOUT, BREAKPOINTS.mobile)).toHaveLength(3);
  });

  it("failure: no slot uses h-fit or order-* (stretch and reading order)", () => {
    for (const classes of LAYOUT) {
      expect(classes).not.toMatch(/h-fit|order-/);
      expect(classes.split(" ")).toContain("min-w-0");
    }
  });
});

/** @see FR-character-inventory-bento-layout (in-session coin dialog, behavior unchanged) */
describe("In-session coin operations", () => {
  it("nominal: add, subtract and set", () => {
    expect(nextCoinValue(10, "5", "add")).toBe(15);
    expect(nextCoinValue(10, "4", "subtract")).toBe(6);
    expect(nextCoinValue(10, "3", "set")).toBe(3);
  });

  it("edge: subtracting more than owned stops at 0 and decimals are floored", () => {
    expect(nextCoinValue(3, "10", "subtract")).toBe(0);
    expect(nextCoinValue(0, "2.9", "add")).toBe(2);
  });

  it("failure: non-numeric or negative amounts count as 0", () => {
    expect(normalizeCoinAmount("abc")).toBe(0);
    expect(normalizeCoinAmount("-7")).toBe(0);
    expect(nextCoinValue(10, "-7", "add")).toBe(10);
    expect(nextCoinValue(10, "abc", "set")).toBe(0);
  });
});
