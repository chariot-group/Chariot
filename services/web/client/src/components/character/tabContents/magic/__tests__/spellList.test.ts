import { describe, expect, it } from "vitest";
import type { Spell } from "@/types/character";
import { BREAKPOINTS, emptyCells } from "@/components/character/tabContents/__tests__/bentoPlacement";
import {
  buildSpellGroups,
  magicBentoGridClass,
  MAGIC_SLOTS,
  MAGIC_TAB_BODY_CLASS,
  MAGIC_TAB_PANEL_CLASS,
  magicWideSlots,
  resolveSelectedSpellIndex,
  spellSummaryParts,
} from "@/components/character/tabContents/magic/shared/spellList";

const spell = (fields: Pick<Spell, "name" | "level"> & Partial<Spell>) => fields as Spell;
const identity = (range: string) => range;

const SPELLS = [
  spell({ name: "Shield", level: 1, prepared: false }),
  spell({ name: "Fire Bolt", level: 0 }),
  spell({ name: "Fireball", level: 3, prepared: true }),
  spell({ name: "Alarm", level: 1, prepared: true }),
  spell({ name: "Mage Hand", level: 0 }),
];

/** @see FR-character-magic-list-card */
describe("Magic tab — spell groups", () => {
  it("nominal: groups by level, only for levels that have spells, cantrips first", () => {
    const groups = buildSpellGroups(SPELLS, { isInnate: false, sort: true });

    expect(groups.map((group) => group.key)).toEqual(["level-0", "level-1", "level-3"]);
    expect(groups[0].indices.map((i) => SPELLS[i].name)).toEqual(["Fire Bolt", "Mage Hand"]);
  });

  it("nominal: read mode puts prepared spells first (level ≥ 1), then by name", () => {
    const groups = buildSpellGroups(SPELLS, { isInnate: false, sort: true, preparedFirst: true });

    expect(groups[1].indices.map((i) => SPELLS[i].name)).toEqual(["Alarm", "Shield"]);
  });

  it("edge: edit mode keeps the list order inside a group (a row never moves while its name is typed)", () => {
    const groups = buildSpellGroups(SPELLS, { isInnate: false, sort: false });

    expect(groups[1].indices).toEqual([0, 3]);
  });

  it("edge: innate blocks group by uses per day, at will first", () => {
    const innate = [
      spell({ name: "Fly", level: 3, usesPerDay: 1 }),
      spell({ name: "Light", level: 0, usesPerDay: null }),
      spell({ name: "Darkness", level: 2, usesPerDay: 3 }),
    ];
    const groups = buildSpellGroups(innate, { isInnate: true, sort: true });

    expect(groups.map((group) => [group.kind, group.value])).toEqual([
      ["uses", null],
      ["uses", 1],
      ["uses", 3],
    ]);
  });

  it("failure: an empty list has no group", () => {
    expect(buildSpellGroups([], { isInnate: false, sort: true })).toEqual([]);
  });
});

/** @see FR-character-magic-list-card, FR-character-spell-multi-damage */
describe("Magic tab — collapsed row summary", () => {
  it("nominal: casting time · range · damage dice joined with +, without school nor types", () => {
    const parts = spellSummaryParts(
      spell({
        name: "Chromatic Orb",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "90 feet",
        damageDetails: [
          { diceCount: 3, diceType: "d8", bonus: null, damageType: "fire" },
          { diceCount: 1, diceType: "d6", bonus: null, damageType: "cold" },
        ],
      }),
      (range) => range.replace("90 feet", "27 m"),
    );

    expect(parts).toEqual(["1 action", "27 m", "3d8 + 1d6"]);
  });

  it("edge: healing is shown when there is no damage, empty parts are dropped", () => {
    const parts = spellSummaryParts(
      spell({
        name: "Cure Wounds",
        level: 1,
        school: "",
        castingTime: "1 action",
        range: "",
        healingDetails: { diceCount: 1, diceType: "d8", bonus: 3 },
      }),
      identity,
    );

    expect(parts).toEqual(["1 action", "1d8+3"]);
  });
});

it("edge: a legacy damage string is summarized as its dice only", () => {
  const parts = spellSummaryParts(
    spell({ name: "Old", level: 1, castingTime: "1 action", damage: "3d8+2 lightning" }),
    identity,
  );

  expect(parts).toEqual(["1 action", "3d8+2"]);
});

describe("Magic tab — bento slots", () => {
  for (const [name, bp] of Object.entries(BREAKPOINTS)) {
    it(`nominal: spellcasting + spells leave no empty cell on ${name}`, () => {
      expect(emptyCells([MAGIC_SLOTS.spellcasting, MAGIC_SLOTS.spells], bp)).toEqual([]);
    });
  }
});

/** @see FR-character-magic-list-card (height fill from `xl`) */
describe("Magic tab — height fill grid", () => {
  it("nominal: from xl the grid takes the panel height and the last row takes the rest", () => {
    const classes = magicBentoGridClass(false).split(" ");

    expect(classes).toEqual(expect.arrayContaining(["xl:flex-1", "xl:min-h-0", "xl:grid-rows-[auto_minmax(0,1fr)]"]));
  });

  it("nominal: the panel fills the sheet scroll area from the layout flex chain, not a viewport calc", () => {
    for (const cls of [MAGIC_TAB_PANEL_CLASS, MAGIC_TAB_BODY_CLASS]) {
      expect(cls.split(" ")).toContain("xl:flex-1");
      expect(cls).not.toMatch(/dvh|vh|calc\(/);
    }
  });

  it("edge: on a short screen the panel keeps a minimum height (the sheet scrolls instead)", () => {
    expect(MAGIC_TAB_PANEL_CLASS.split(" ")).toContain("xl:min-h-[28rem]");
  });

  it("edge: with the block selector, an extra auto row keeps the Spells card on the last row", () => {
    expect(magicBentoGridClass(true).split(" ")).toContain("xl:grid-rows-[auto_auto_minmax(0,1fr)]");
  });

  it("edge: below xl the grid has no fixed height nor explicit rows", () => {
    const unprefixed = magicBentoGridClass(true)
      .split(" ")
      .filter((cls) => !cls.includes(":"));

    expect(unprefixed.some((cls) => cls.startsWith("h-") || cls.startsWith("grid-rows-"))).toBe(false);
  });
});

/** @see FR-character-magic-list-card (wide read mode) */
describe("Magic tab — wide read selection", () => {
  const groups = buildSpellGroups(SPELLS, { isInnate: false, sort: true, preparedFirst: true });

  it("nominal: defaults to the first spell in display order", () => {
    expect(SPELLS[resolveSelectedSpellIndex(groups, null) ?? -1].name).toBe("Fire Bolt");
  });

  it("nominal: keeps a selected spell that is displayed", () => {
    expect(resolveSelectedSpellIndex(groups, 2)).toBe(2);
  });

  it("edge: an out-of-range selection falls back to the first spell", () => {
    expect(SPELLS[resolveSelectedSpellIndex(groups, 42) ?? -1].name).toBe("Fire Bolt");
  });

  it("failure: an empty block has no spell to show", () => {
    expect(resolveSelectedSpellIndex([], 0)).toBeNull();
  });

  it("edge: Spellcasting and Spells share the left 5 columns, the panel spans both rows on the right", () => {
    const slots = magicWideSlots(false);

    expect(slots.spellcasting).toContain("xl:col-span-5");
    expect(slots.spells).toContain("xl:col-span-5");
    expect(slots.detail).toEqual(expect.stringContaining("xl:col-start-6"));
    expect(slots.detail).toContain("xl:row-span-2");
    expect(slots.detail).toContain("xl:row-start-1");
    expect(slots.detail).toContain("xl:min-h-0");
  });

  it("edge: with the class selector the panel starts under it", () => {
    expect(magicWideSlots(true).detail).toContain("xl:row-start-2");
  });
});
