/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  buildSpellOverviewColumns,
  buildSpellPdfPages,
  getSpellDetailCardLayout,
  getSpellDetailMetaParts,
  getSpellLevelGroups,
  getSpellOverviewRowHeight,
  PDF_SPELL_DETAIL_CARD_MAX_HEIGHT,
  PDF_SPELL_OVERVIEW,
} from "@/lib/characterSheetPdf/buildSpellPdfPages";
import { PDF_PAGE_CONTENT_HEIGHT } from "@/lib/characterSheetPdf/pdfPageGeometry";
import type { PdfSpellcastingBlock } from "@/lib/characterSheetPdf/types";

const baseSpell = {
  name: "Magic Missile",
  level: 1,
  prepared: true,
  school: "Evocation",
  description: "Three darts of force.",
  components: "V, S",
  castingTime: "1 action",
  duration: "Instantaneous",
  range: "120 ft",
  damage: "1d4+1 force",
  healing: null,
  effectType: "attack" as const,
  usesPerDay: null,
  used: null,
};

const baseBlock: PdfSpellcastingBlock = {
  className: "Wizard",
  ability: "Intelligence",
  saveDc: "13",
  attackBonus: "+5",
  cantrips: [
    {
      name: "Fire Bolt",
      level: 0,
      prepared: false,
      school: "Evocation",
      description: "Hurl a mote of fire.",
      components: "V, S",
      castingTime: "1 action",
      duration: "Instantaneous",
      range: "120 ft",
      damage: "1d10 fire",
      healing: null,
      effectType: "attack",
      usesPerDay: null,
      used: null,
    },
  ],
  spellsByLevel: {
    1: [baseSpell],
  },
  slotsByLevel: {
    1: { used: 1, total: 2 },
  },
  isInnate: false,
};

const denseBlock: PdfSpellcastingBlock = {
  ...baseBlock,
  cantrips: Array.from({ length: 12 }, (_, index) => ({ ...baseSpell, level: 0, name: `Cantrip ${index}` })),
  spellsByLevel: Object.fromEntries(
    Array.from({ length: 9 }, (_, level) => [
      level + 1,
      Array.from({ length: 12 }, (_, index) => ({
        ...baseSpell,
        level: level + 1,
        name: `Spell ${level + 1}-${index}`,
      })),
    ]),
  ),
  slotsByLevel: Object.fromEntries(Array.from({ length: 9 }, (_, level) => [level + 1, { used: 0, total: 4 }])),
};

describe("FR-character-sheet-pdf-export — buildSpellPdfPages", () => {
  it("nominal: builds an overview page then one flowing details page per block", () => {
    const pages = buildSpellPdfPages([baseBlock]);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({ kind: "overview", blockIndex: 0 });
    expect(pages[1]).toMatchObject({ kind: "details", blockIndex: 0 });
    expect(pages[1]?.spells?.map((spell) => spell.name)).toEqual(["Fire Bolt", "Magic Missile"]);
  });

  it("edge: a very long description adds no continuation page", () => {
    const block: PdfSpellcastingBlock = {
      ...baseBlock,
      cantrips: [],
      spellsByLevel: { 1: [{ ...baseSpell, description: "word ".repeat(5000).trim() }] },
    };

    const pages = buildSpellPdfPages([block]);
    expect(pages.map((page) => page.kind)).toEqual(["overview", "details"]);
    expect(pages[1]?.spells).toHaveLength(1);
  });

  it("guard: a block without any spell only gets its overview page", () => {
    const block: PdfSpellcastingBlock = { ...baseBlock, cantrips: [], spellsByLevel: {} };
    expect(buildSpellPdfPages([block]).map((page) => page.kind)).toEqual(["overview"]);
  });

  it("edge: innate blocks group spells by uses per day", () => {
    const innateBlock: PdfSpellcastingBlock = {
      ...baseBlock,
      isInnate: true,
      cantrips: [],
      spellsByLevel: {
        3: [
          { ...baseSpell, level: 3, name: "Fireball", usesPerDay: 3, used: 1 },
          { ...baseSpell, level: 3, name: "Lightning Bolt", usesPerDay: null, used: null },
        ],
      },
      slotsByLevel: {},
    };

    const groups = getSpellLevelGroups(innateBlock);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.usesPerDay).toBeNull();
    expect(groups[1]?.usesPerDay).toBe(3);
  });
});

describe("FR-character-sheet-pdf-export — spell detail card", () => {
  it("nominal: a short description is kept whole under the half-page cap", () => {
    const layout = getSpellDetailCardLayout(baseSpell, "+5");
    expect(layout.description).toBe("Three darts of force.");
    expect(layout.descriptionMaxLines).toBeGreaterThan(10);
  });

  it("edge: a long description is cut with an ellipsis and bounded by the line budget", () => {
    const long = "word ".repeat(5000).trim();
    const layout = getSpellDetailCardLayout({ ...baseSpell, description: long }, "+5");
    expect(layout.description.endsWith("…")).toBe(true);
    expect(layout.description.length).toBeLessThan(long.length);
    // Enough text to fill every allowed line, but nowhere near the full description.
    expect(layout.description.length).toBeLessThan(layout.descriptionMaxLines * 120);
  });

  it("layout: a card is capped at half of the page content height", () => {
    expect(PDF_SPELL_DETAIL_CARD_MAX_HEIGHT).toBeLessThanOrEqual(PDF_PAGE_CONTENT_HEIGHT / 2);
  });

  it("layout: more meta pills leave fewer description lines", () => {
    const few = getSpellDetailCardLayout({ ...baseSpell, components: "", duration: "", damage: null }, "");
    const many = getSpellDetailCardLayout(
      { ...baseSpell, components: "V, S, M (a long list of material components)", damage: "8d6 fire" },
      "+5",
    );
    expect(many.descriptionMaxLines).toBeLessThan(few.descriptionMaxLines);
  });

  it("guard: an empty description renders no description section", () => {
    const layout = getSpellDetailCardLayout({ ...baseSpell, description: "   " }, "+5");
    expect(layout.description).toBe("");
    expect(layout.descriptionMaxLines).toBe(0);
  });

  it("meta: lists filled facts, adds the attack bonus for attack spells only, clamps long values", () => {
    const parts = getSpellDetailMetaParts(
      { ...baseSpell, components: "x".repeat(80), healing: null, duration: "" },
      "+5",
    );
    expect(parts).toEqual(["Evocation", "1 action", "120 ft", `${"x".repeat(39)}…`, "1d4+1 force", "+5"]);
    expect(getSpellDetailMetaParts({ ...baseSpell, effectType: "utility" }, "+5")).not.toContain("+5");
  });
});

describe("FR-character-sheet-pdf-export — spell overview sheet", () => {
  const levelsOf = (columns: ReturnType<typeof buildSpellOverviewColumns>) =>
    columns.map((cards) => cards.map((card) => card.group.level));

  it("layout: three columns hold levels 0-2, 3-5 and 6-9", () => {
    expect(levelsOf(buildSpellOverviewColumns(baseBlock))).toEqual([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8, 9],
    ]);
  });

  it("nominal: blank lines fill every card at about the preferred line height", () => {
    for (const column of buildSpellOverviewColumns(baseBlock)) {
      const rowHeight = getSpellOverviewRowHeight(column);
      expect(rowHeight).toBeGreaterThanOrEqual(PDF_SPELL_OVERVIEW.targetRowHeight);
      expect(rowHeight).toBeLessThan(PDF_SPELL_OVERVIEW.targetRowHeight * 1.25);
      // Cards of a column share the blank lines evenly.
      expect(new Set(column.map((card) => card.lineCount)).size).toBe(1);
    }
  });

  it("edge: the third column, with four cards, gets fewer lines per card", () => {
    const [first, , third] = buildSpellOverviewColumns(baseBlock);
    expect(third![0]!.lineCount).toBeLessThan(first![0]!.lineCount);
  });

  it("edge: a level with many spells gets one line per spell and the column lines shrink", () => {
    const columns = buildSpellOverviewColumns(denseBlock);
    const [cantrips] = columns[0]!;
    expect(cantrips!.spells).toHaveLength(12);
    expect(cantrips!.lineCount).toBe(12);
    for (const column of columns) {
      expect(getSpellOverviewRowHeight(column)).toBeGreaterThanOrEqual(PDF_SPELL_OVERVIEW.minRowHeight);
    }
  });

  it("guard: a level with more spells than fit is capped so the sheet stays on one page", () => {
    const crowded: PdfSpellcastingBlock = {
      ...baseBlock,
      spellsByLevel: {
        7: Array.from({ length: 80 }, (_, index) => ({ ...baseSpell, level: 7, name: `Spell ${index}` })),
      },
    };
    const seventh = buildSpellOverviewColumns(crowded)[2]!.find((card) => card.group.level === 7)!;
    expect(seventh.spells.length).toBeLessThan(80);
    expect(seventh.lineCount).toBe(seventh.spells.length);
    expect(getSpellOverviewRowHeight(buildSpellOverviewColumns(crowded)[2]!)).toBeGreaterThanOrEqual(
      PDF_SPELL_OVERVIEW.minRowHeight,
    );
  });

  it("edge: innate groups are spread in order over the three columns", () => {
    const innateBlock: PdfSpellcastingBlock = {
      ...baseBlock,
      isInnate: true,
      cantrips: [{ ...baseSpell, name: "Light", usesPerDay: null }],
      spellsByLevel: {
        1: [{ ...baseSpell, name: "Charm", usesPerDay: 3 }],
        2: [{ ...baseSpell, name: "Fly", usesPerDay: 1 }],
      },
    };
    const columns = buildSpellOverviewColumns(innateBlock);
    expect(columns).toHaveLength(3);
    expect(columns.map((cards) => cards.map((card) => card.group.usesPerDay))).toEqual([[null], [1], [3]]);
  });

  it("guard: a block without spells or slots still yields three columns with finite line heights", () => {
    for (const isInnate of [false, true]) {
      const emptyBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        isInnate,
        cantrips: [],
        spellsByLevel: {},
        slotsByLevel: {},
      };
      const columns = buildSpellOverviewColumns(emptyBlock);
      expect(columns).toHaveLength(3);
      for (const column of columns) expect(Number.isFinite(getSpellOverviewRowHeight(column))).toBe(true);
    }
  });
});
