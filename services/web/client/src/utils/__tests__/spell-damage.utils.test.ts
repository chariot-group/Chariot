/** @see FR-character-spell-multi-damage */

import { describe, expect, it } from "vitest";
import {
  coerceSpellDamageDetailsList,
  formatSpellDamageList,
  hydrateSpellDamageDetails,
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
