/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  batchSpellsForDetailPages,
  buildSpellPdfPages,
  computeSpellOverviewDensity,
  estimateSpellDetailCardHeight,
  getSpellLevelGroups,
  getSpellOverviewColumnLevels,
  getSpellOverviewDisplaySpells,
  getSpellOverviewLineCount,
  PDF_SPELL_OVERVIEW_LINES_PER_LEVEL,
  truncateSpellDescription,
} from "@/lib/characterSheetPdf/buildSpellPdfPages";
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

describe("buildSpellPdfPages", () => {
  it("nominal: builds overview plus compact detail batches", () => {
    const pages = buildSpellPdfPages([baseBlock]);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({ kind: "overview", blockIndex: 0 });
    expect(pages[1]).toMatchObject({ kind: "detailBatch", blockIndex: 0 });
    expect(pages[1]?.spells?.map((spell) => spell.name)).toEqual(["Fire Bolt", "Magic Missile"]);
  });

  it("nominal: batches more short spells per page than long descriptions", () => {
    const shortSpells = Array.from({ length: 6 }, (_, index) => ({
      ...baseSpell,
      name: `Spell ${index + 1}`,
      description: "Short.",
    }));
    const longSpells = Array.from({ length: 3 }, (_, index) => ({
      ...baseSpell,
      name: `Long ${index + 1}`,
      description: "word ".repeat(120).trim(),
    }));

    const shortBatches = batchSpellsForDetailPages(shortSpells);
    const longBatches = batchSpellsForDetailPages(longSpells);

    expect(shortBatches.flat()).toHaveLength(6);
    expect(longBatches.flat()).toHaveLength(3);
    expect(shortBatches[0]?.length ?? 0).toBeGreaterThan(longBatches[0]?.length ?? 0);
  });

  it("edge: splits long spell descriptions into continuation pages after batches", () => {
    const longDescription = "word ".repeat(900).trim();
    const block: PdfSpellcastingBlock = {
      ...baseBlock,
      cantrips: [],
      spellsByLevel: {
        1: [{ ...baseSpell, description: longDescription }],
      },
    };

    const pages = buildSpellPdfPages([block]);
    const batches = pages.filter((page) => page.kind === "detailBatch");
    const continuations = pages.filter((page) => page.kind === "detailContinuation");
    expect(batches).toHaveLength(1);
    expect(continuations.length).toBeGreaterThan(0);
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

  it("layout: overview uses two columns for spell levels", () => {
    const columns = getSpellOverviewColumnLevels();
    expect(columns).toHaveLength(2);
    expect(columns).toEqual([
      [0, 1, 2],
      [3, 4, 5, 6, 7, 8, 9],
    ]);
  });

  it("layout: caps overview spell rows at ten per level", () => {
    const spells = Array.from({ length: 14 }, (_, index) => ({
      ...baseSpell,
      name: `Spell ${index + 1}`,
    }));
    const group = {
      level: 2,
      usesPerDay: null,
      spells,
      slots: { used: 0, total: 3 },
    };
    expect(getSpellOverviewLineCount(group)).toBe(10);
    expect(getSpellOverviewDisplaySpells(group)).toHaveLength(10);
  });

  it("layout: empty inaccessible levels use fewer blank lines", () => {
    expect(
      getSpellOverviewLineCount({
        level: 9,
        usesPerDay: null,
        spells: [],
        slots: null,
      }),
    ).toBe(3);
    expect(
      getSpellOverviewLineCount({
        level: 1,
        usesPerDay: null,
        spells: [baseSpell],
        slots: { used: 0, total: 2 },
      }),
    ).toBe(10);
  });

  it("layout: truncates compact spell descriptions with ellipsis", () => {
    const truncated = truncateSpellDescription("alpha beta gamma delta", 12);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(12);
  });

  it("layout: reserves ten spell lines per overview level", () => {
    expect(PDF_SPELL_OVERVIEW_LINES_PER_LEVEL).toBe(10);
  });

  it("layout: taller cards consume more vertical budget", () => {
    const shortHeight = estimateSpellDetailCardHeight({ ...baseSpell, description: "Short." });
    const longHeight = estimateSpellDetailCardHeight(
      { ...baseSpell, description: "word ".repeat(80).trim() },
    );
    expect(longHeight).toBeGreaterThan(shortHeight);
  });

  describe("computeSpellOverviewDensity", () => {
    it("nominal: a caster with only cantrips (right column fully empty) gets the airy ceiling", () => {
      // Right column (levels 3-9) is always at least 21 lines (7 empty levels x 3), which is the
      // sparsest possible driver — this is the case that should render maximally airy.
      const sparseBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        spellsByLevel: {},
        slotsByLevel: {},
      };
      const density = computeSpellOverviewDensity(sparseBlock);
      expect(density.rowMinHeight).toBeCloseTo(15, 5);
      expect(density.sectionMarginBottom).toBeCloseTo(9, 5);
      expect(density.pagePaddingVertical).toBeCloseTo(18, 5);
    });

    it("edge: a caster with every spell level (1-9) populated falls back to the original tight baseline", () => {
      const denseBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        cantrips: [{ ...baseSpell, level: 0 }],
        spellsByLevel: Object.fromEntries(
          Array.from({ length: 9 }, (_, index) => [index + 1, [{ ...baseSpell, level: index + 1 }]]),
        ),
        slotsByLevel: Object.fromEntries(
          Array.from({ length: 9 }, (_, index) => [index + 1, { used: 0, total: 1 }]),
        ),
      };
      const density = computeSpellOverviewDensity(denseBlock);
      // Right column (levels 3-9) is fully populated: 7 levels x 10 lines = 70, the densest possible case.
      // This must reproduce the original fixed spacing exactly, since that baseline was already
      // validated to fit a single LETTER page for this worst case — any airier value here risks
      // the overview content overflowing past the physical page (wrap=false forbids a 4th page).
      expect(density.rowMinHeight).toBeCloseTo(8, 5);
      expect(density.sectionMarginBottom).toBeCloseTo(1, 5);
      expect(density.pagePaddingVertical).toBeCloseTo(12, 5);
    });

    it("failure/guard: a spellcasting block with no cantrips, spells, or slots never yields a negative or NaN metric", () => {
      const emptyBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        cantrips: [],
        spellsByLevel: {},
        slotsByLevel: {},
      };
      const density = computeSpellOverviewDensity(emptyBlock);
      for (const value of Object.values(density)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
    });

    it("failure/guard: an innate block with zero uses-per-day groups (empty reduce) never yields a negative or NaN metric", () => {
      const emptyInnateBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        isInnate: true,
        cantrips: [],
        spellsByLevel: {},
        slotsByLevel: {},
      };
      const density = computeSpellOverviewDensity(emptyInnateBlock);
      for (const value of Object.values(density)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
    });

    it("innate: density derives from the tallest single uses-per-day column, not a stacked total", () => {
      const innateBlock: PdfSpellcastingBlock = {
        ...baseBlock,
        isInnate: true,
        cantrips: [],
        spellsByLevel: {
          3: [{ ...baseSpell, level: 3, usesPerDay: 1 }],
        },
        slotsByLevel: {},
      };
      const density = computeSpellOverviewDensity(innateBlock);
      // A single populated uses-per-day group (10 lines) is far below the sparse threshold, so it stays airy.
      expect(density.rowMinHeight).toBeCloseTo(15, 5);
    });
  });
});
