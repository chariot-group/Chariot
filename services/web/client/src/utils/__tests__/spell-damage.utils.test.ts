/** @see FR-character-spell-multi-damage */

import { describe, expect, it } from "vitest";
import {
  coerceSpellDamageDetailsList,
  ensureSpellDamageEditRows,
  formatSpellDamageList,
  formatSpellDiceFormula,
  hydrateSpellDamageDetails,
  parseSpellDiceFormula,
} from "@/utils/spell-damage.utils";

describe("FR-character-spell-multi-damage — spell damage helpers", () => {
  it("nominal: formats several typed damage entries with a plus separator", () => {
    const formula = formatSpellDamageList([
      { diceCount: 8, diceType: "d6", bonus: 0, damageType: "fire" },
      { diceCount: 1, diceType: "d8", bonus: 0, damageType: "radiant" },
    ]);

    expect(formula).toBe("8d6 fire + 1d8 radiant");
  });

  it("edge: hydrates a legacy single object and a formula string", () => {
    expect(
      coerceSpellDamageDetailsList({
        diceCount: 3,
        diceType: "d8",
        bonus: 2,
        damageType: "lightning",
      }),
    ).toEqual([
      {
        diceCount: 3,
        diceType: "d8",
        bonus: 2,
        damageType: "lightning",
      },
    ]);

    expect(hydrateSpellDamageDetails(undefined, "3d8+2 lightning")).toEqual([
      {
        diceCount: 3,
        diceType: "d8",
        bonus: 2,
        damageType: "lightning",
      },
    ]);
  });

  it("edge: edit mode keeps one blank row when there is no damage", () => {
    expect(ensureSpellDamageEditRows([])).toEqual([
      { diceCount: null, diceType: null, bonus: null, damageType: null },
    ]);
    expect(ensureSpellDamageEditRows(undefined)).toEqual([
      { diceCount: null, diceType: null, bonus: null, damageType: null },
    ]);
    expect(
      ensureSpellDamageEditRows([{ diceCount: 3, diceType: "d8", bonus: 0, damageType: "fire" }]),
    ).toEqual([{ diceCount: 3, diceType: "d8", bonus: 0, damageType: "fire" }]);
  });

  it("edge: incomplete extra rows stay hidden while remaining filled entries stay visible", () => {
    expect(
      formatSpellDamageList([
        { diceCount: 8, diceType: "d6", bonus: 0, damageType: "fire" },
        { diceCount: null, diceType: null, bonus: null, damageType: null },
      ]),
    ).toBe("8d6 fire");

    expect(formatSpellDamageList([])).toBeNull();
  });
});

/** @see FR-character-magic-list-card (spell dice field) */
describe("FR-character-magic-list-card — spell dice field parsing", () => {
  it("nominal: a typed formula is stored as structured dice and shown back as the same text", () => {
    const dice = parseSpellDiceFormula("8d6+2");

    expect(dice).toEqual({ diceCount: 8, diceType: "d6", bonus: 2 });
    expect(formatSpellDiceFormula(dice)).toBe("8d6+2");
  });

  it("edge: spaces, negative bonus, d% and an empty text are accepted", () => {
    expect(parseSpellDiceFormula(" 2d6 - 1 ")).toEqual({ diceCount: 2, diceType: "d6", bonus: -1 });
    expect(parseSpellDiceFormula("1D%")).toEqual({ diceCount: 1, diceType: "d100", bonus: null });
    expect(parseSpellDiceFormula("3d8+0")).toEqual({ diceCount: 3, diceType: "d8", bonus: null });
    expect(parseSpellDiceFormula("")).toEqual({ diceCount: null, diceType: null, bonus: null });
    expect(formatSpellDiceFormula(null)).toBe("");
  });

  it("failure: text, unfinished formulas, non-standard dice and zero dice are rejected", () => {
    for (const text of ["abc", "2d", "d6", "2d7", "0d6", "2d6+", "2d6 feu"]) {
      expect(parseSpellDiceFormula(text)).toBeNull();
    }
  });
});
