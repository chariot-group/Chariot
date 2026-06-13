import { describe, expect, it } from "vitest";
import {
  getCharacterTabsWithErrors,
  getErrorFieldPaths,
  getFirstCharacterTabWithError,
  getSpellIndicesWithErrors,
  getSpellLevelsWithErrors,
  getSpellUsesGroupsWithErrors,
} from "@/components/character/characterFormErrors";

describe("characterFormErrors", () => {
  it("flattens nested field error paths", () => {
    expect(
      getErrorFieldPaths({
        stats: {
          currentHitPoints: { message: "Invalid HP" },
        },
        spellcasting: [
          {
            spells: [{ name: { message: "Required" } }],
          },
        ],
      }),
    ).toEqual(["stats.currentHitPoints", "spellcasting.0.spells.0.name"]);
  });

  it("maps field errors to character tabs", () => {
    expect(
      getCharacterTabsWithErrors({
        firstname: { message: "Required" },
        actions: {
          standard: [{ damage: [{ type: { message: "Duplicate type" } }] }],
        },
        treasure: {
          gp: { message: "Must be positive" },
        },
        appearance: {
          age: { message: "Must be positive" },
        },
        spellcasting: [{ className: { message: "Required" } }],
      }),
    ).toEqual({
      general: true,
      battle: true,
      inventory: true,
      history: true,
      magic: true,
    });
  });

  it("returns the first tab with errors in navigation order", () => {
    expect(
      getFirstCharacterTabWithError({
        treasure: {
          gp: { message: "Must be positive" },
        },
        spellcasting: [{ className: { message: "Required" } }],
      }),
    ).toBe("magic");

    expect(getFirstCharacterTabWithError({})).toBeNull();
  });

  it("identifies spells and spell level categories containing errors", () => {
    const spells = [
      { name: "Light", level: 0 },
      { name: "Shield", level: 1 },
      { name: "Fireball", level: 3 },
    ];
    const errors = {
      spellcasting: [
        {
          spells: [
            undefined,
            { name: { message: "Required" } },
            { damageDetails: { diceCount: { message: "Invalid" } } },
          ],
          spellSlotsByLevel: {
            2: { total: { message: "Invalid" } },
          },
        },
      ],
    };

    expect(getSpellIndicesWithErrors(errors, 0)).toEqual([1, 2]);
    expect(getSpellLevelsWithErrors(errors, 0, spells)).toEqual({
      1: true,
      2: true,
      3: true,
    });
  });

  it("identifies NPC uses-per-day spell categories containing errors", () => {
    const spells = [
      { name: "Detect Magic", usesPerDay: null },
      { name: "Invisibility", usesPerDay: 3 },
    ];

    expect(
      getSpellUsesGroupsWithErrors(
        {
          spellcasting: [
            {
              spells: [undefined, { used: { message: "Invalid" } }],
              spellSlotsByUses: {
                atwill: { message: "Invalid" },
              },
            },
          ],
        },
        0,
        spells,
        (uses) => (uses === null ? "atwill" : `k${uses}`),
      ),
    ).toEqual({
      atwill: true,
      k3: true,
    });
  });
});
