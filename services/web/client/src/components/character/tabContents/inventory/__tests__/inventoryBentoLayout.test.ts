import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place } from "@/components/character/tabContents/__tests__/bentoPlacement";
import { INVENTORY_SLOTS } from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
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

  it("nominal: coins take a full row, equipment and treasure share the next one from tablet", () => {
    for (const bp of [BREAKPOINTS.tablet, BREAKPOINTS.desktop]) expect(place(LAYOUT, bp)).toHaveLength(2);
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
