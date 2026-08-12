/** @see FR-character-sheet-pdf-export */

import type { PdfSpellLevelGroup, PdfSpellRow, PdfSpellcastingBlock, SpellPdfPageDescriptor } from "@/lib/characterSheetPdf/types";

/** Approximate vertical budget per spell detail page (two-column grid, letter). */
export const PDF_SPELL_DETAIL_PAGE_MAX_HEIGHT = 680;

/** Base card height: title, meta chips, padding. */
const PDF_SPELL_DETAIL_CARD_BASE_HEIGHT = 72;

/** Estimated height per description line in a detail card (~48 chars per line). */
const PDF_SPELL_DETAIL_DESC_LINE_HEIGHT = 11;
const PDF_SPELL_DETAIL_DESC_CHARS_PER_LINE = 48;

/** Blank spell lines reserved on the overview sheet per level. */
export const PDF_SPELL_OVERVIEW_LINES_PER_LEVEL = 10;

/** Truncated description length on detail cards before overflow pages. */
export const PDF_SPELL_COMPACT_DESCRIPTION_MAX_CHARS = 650;

/** Char budget per spell description overflow page. */
export const PDF_SPELL_DESCRIPTION_MAX_CHARS = 2400;

const SPELL_OVERVIEW_COLUMN_LEVELS: number[][] = [
  [0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
];

/** Blank lines for spell levels without slots or known spells. */
export const PDF_SPELL_OVERVIEW_LINES_EMPTY_LEVEL = 3;

export function getSpellOverviewLineCount(group: PdfSpellLevelGroup): number {
  const spellCount = group.spells.length;
  const hasSlots = group.slots != null && group.slots.total > 0;
  if (group.level === 0 || spellCount > 0 || hasSlots) {
    return PDF_SPELL_OVERVIEW_LINES_PER_LEVEL;
  }
  return PDF_SPELL_OVERVIEW_LINES_EMPTY_LEVEL;
}

export function getSpellOverviewDisplaySpells(group: PdfSpellLevelGroup): PdfSpellRow[] {
  return group.spells.slice(0, PDF_SPELL_OVERVIEW_LINES_PER_LEVEL);
}

export function getSpellOverviewColumnLevels(): readonly (readonly number[])[] {
  return SPELL_OVERVIEW_COLUMN_LEVELS;
}

export function truncateSpellDescription(description: string, maxChars: number): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function estimateSpellDetailCardHeight(spell: PdfSpellRow, showPreparedBadge: boolean): number {
  const description = spell.description.replace(/\s+/g, " ").trim();
  const descriptionLines = description
    ? Math.max(
        1,
        Math.ceil(
          Math.min(description.length, PDF_SPELL_COMPACT_DESCRIPTION_MAX_CHARS) /
            PDF_SPELL_DETAIL_DESC_CHARS_PER_LINE,
        ),
      )
    : 0;
  const preparedExtra = 0;
  return PDF_SPELL_DETAIL_CARD_BASE_HEIGHT + preparedExtra + descriptionLines * PDF_SPELL_DETAIL_DESC_LINE_HEIGHT;
}

export function batchSpellsForDetailPages(
  spells: PdfSpellRow[],
  showPreparedBadge: boolean,
  pageMaxHeight: number = PDF_SPELL_DETAIL_PAGE_MAX_HEIGHT,
): PdfSpellRow[][] {
  if (spells.length === 0) return [];

  const batches: PdfSpellRow[][] = [];
  let currentBatch: PdfSpellRow[] = [];
  let currentRowHeight = 0;
  let rowMaxHeight = 0;

  const flushRow = () => {
    if (rowMaxHeight <= 0) return;
    currentRowHeight += rowMaxHeight + 8;
    rowMaxHeight = 0;
  };

  for (const spell of spells) {
    const cardHeight = estimateSpellDetailCardHeight(spell, showPreparedBadge);
    const isSecondInRow = currentBatch.length % 2 === 1;

    if (isSecondInRow) {
      rowMaxHeight = Math.max(rowMaxHeight, cardHeight);
      currentBatch.push(spell);
      flushRow();
      continue;
    }

    if (currentBatch.length > 0 && currentRowHeight + cardHeight > pageMaxHeight) {
      batches.push(currentBatch);
      currentBatch = [];
      currentRowHeight = 0;
      rowMaxHeight = 0;
    }

    rowMaxHeight = cardHeight;
    currentBatch.push(spell);
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export function getLevelGroupForOverview(
  block: PdfSpellcastingBlock,
  level: number,
  groups: PdfSpellLevelGroup[],
): PdfSpellLevelGroup {
  const existing = groups.find((group) => group.level === level);
  if (existing) return existing;

  return {
    level,
    usesPerDay: null,
    spells: level === 0 ? block.cantrips : (block.spellsByLevel[level] ?? []),
    slots: level > 0 ? (block.slotsByLevel[level] ?? null) : null,
  };
}

/**
 * Overview rows reserve a fixed line budget per level regardless of how many spells a
 * character actually knows (see PDF_SPELL_OVERVIEW_LINES_PER_LEVEL). A caster using only
 * 2-3 spell levels renders a very sparse, cramped-looking page, while a caster with every
 * level 1-9 populated can already nearly fill a LETTER page at the tightest spacing. Density
 * interpolates row/header/margin sizes between that safe tight baseline (t=0, identical to
 * the original fixed values) and a generous "airy" ceiling (t=1) so the page fills out when
 * there's room, without ever risking overflow past a single page (wrap=false forbids a 4th
 * spell page, so overflowing content would simply be cut off rather than paginated).
 */
export const SPELL_OVERVIEW_DENSITY_SPARSE_LINES = 21;
export const SPELL_OVERVIEW_DENSITY_DENSE_LINES = 70;

export interface SpellOverviewDensity {
  pagePaddingVertical: number;
  headerBlockMarginBottom: number;
  headerCellPaddingVertical: number;
  statLabelFontSize: number;
  statLabelMarginBottom: number;
  statValueFontSize: number;
  columnsGap: number;
  sectionMarginBottom: number;
  levelHeaderMinHeight: number;
  levelTitleBarPaddingVertical: number;
  rowMinHeight: number;
  rowPaddingVertical: number;
  spellNameFontSize: number;
  spellNameLineHeight: number;
}

function lerpDensity(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

export function densityFromDriverLines(driverLines: number): SpellOverviewDensity {
  const t = Math.min(
    1,
    Math.max(
      0,
      (SPELL_OVERVIEW_DENSITY_DENSE_LINES - driverLines) /
        (SPELL_OVERVIEW_DENSITY_DENSE_LINES - SPELL_OVERVIEW_DENSITY_SPARSE_LINES),
    ),
  );
  return {
    pagePaddingVertical: lerpDensity(12, 18, t),
    headerBlockMarginBottom: lerpDensity(4, 10, t),
    headerCellPaddingVertical: lerpDensity(4, 7, t),
    statLabelFontSize: lerpDensity(5.4, 5.8, t),
    statLabelMarginBottom: lerpDensity(1, 2, t),
    statValueFontSize: lerpDensity(9, 10, t),
    columnsGap: lerpDensity(5, 14, t),
    sectionMarginBottom: lerpDensity(1, 9, t),
    levelHeaderMinHeight: lerpDensity(14, 19, t),
    levelTitleBarPaddingVertical: lerpDensity(2, 4, t),
    rowMinHeight: lerpDensity(8, 15, t),
    rowPaddingVertical: lerpDensity(0.5, 2.5, t),
    spellNameFontSize: lerpDensity(6.8, 7.4, t),
    spellNameLineHeight: lerpDensity(1.15, 1.3, t),
  };
}

export function computeSpellOverviewDensity(block: PdfSpellcastingBlock): SpellOverviewDensity {
  const levelGroups = getSpellLevelGroups(block);

  if (block.isInnate) {
    const driverLines = levelGroups.reduce((max, group) => Math.max(max, getSpellOverviewLineCount(group)), 0);
    return densityFromDriverLines(driverLines);
  }

  const driverLines = getSpellOverviewColumnLevels().reduce((max, columnLevels) => {
    const columnLines = columnLevels.reduce(
      (sum, level) => sum + getSpellOverviewLineCount(getLevelGroupForOverview(block, level, levelGroups)),
      0,
    );
    return Math.max(max, columnLines);
  }, 0);
  return densityFromDriverLines(driverLines);
}

function compareSpellNames(a: PdfSpellRow, b: PdfSpellRow): number {
  return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
}

function sortSpellsPreparedFirst(spells: PdfSpellRow[], level: number): PdfSpellRow[] {
  const copy = [...spells];
  if (level <= 0) {
    copy.sort(compareSpellNames);
    return copy;
  }
  copy.sort((a, b) => {
    const preparedOrder = (a.prepared ? 0 : 1) - (b.prepared ? 0 : 1);
    if (preparedOrder !== 0) return preparedOrder;
    return compareSpellNames(a, b);
  });
  return copy;
}

function getInnateUsesGroups(block: PdfSpellcastingBlock): Array<number | null> {
  const seen = new Set<number | null>();
  for (const spell of [...block.cantrips, ...Object.values(block.spellsByLevel).flat()]) {
    seen.add(spell.usesPerDay ?? null);
  }
  const groups = Array.from(seen);
  groups.sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a - b;
  });
  return groups;
}

function getSpellsByUses(block: PdfSpellcastingBlock, uses: number | null): PdfSpellRow[] {
  const all = [...block.cantrips, ...Object.values(block.spellsByLevel).flat()];
  return all.filter((spell) => (spell.usesPerDay ?? null) === uses).sort(compareSpellNames);
}

export function getSpellLevelGroups(block: PdfSpellcastingBlock): PdfSpellLevelGroup[] {
  if (block.isInnate) {
    return getInnateUsesGroups(block)
      .map((uses) => ({
        level: -1,
        usesPerDay: uses,
        spells: getSpellsByUses(block, uses),
        slots: null,
      }))
      .filter((group) => group.spells.length > 0);
  }

  const levels = new Set<number>();
  if (block.cantrips.length > 0) levels.add(0);
  for (const levelKey of Object.keys(block.slotsByLevel)) {
    const level = Number(levelKey);
    if (Number.isFinite(level)) levels.add(level);
  }
  for (const levelKey of Object.keys(block.spellsByLevel)) {
    const level = Number(levelKey);
    if (Number.isFinite(level)) levels.add(level);
  }

  return Array.from(levels)
    .sort((a, b) => a - b)
    .map((level) => {
      const spells =
        level === 0
          ? sortSpellsPreparedFirst(block.cantrips, level)
          : sortSpellsPreparedFirst(block.spellsByLevel[level] ?? [], level);
      return {
        level,
        usesPerDay: null,
        spells,
        slots: level > 0 ? (block.slotsByLevel[level] ?? null) : null,
      };
    })
    .filter((group) => group.spells.length > 0 || group.slots != null);
}

function getCompactDescriptionOverflow(description: string, maxChars: number): string | null {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length <= maxChars) return null;

  let cut = maxChars - 1;
  while (cut > 0 && normalized[cut] !== " ") {
    cut -= 1;
  }
  if (cut <= 0) cut = maxChars - 1;

  const overflow = normalized.slice(cut).trimStart();
  return overflow || null;
}

function splitDescriptionForPdfPages(description: string): string[] {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];

  const parts: string[] = [];
  let remaining = normalized;
  while (remaining.length > PDF_SPELL_DESCRIPTION_MAX_CHARS) {
    let cut = PDF_SPELL_DESCRIPTION_MAX_CHARS;
    while (cut > 0 && remaining[cut] !== " ") {
      cut -= 1;
    }
    if (cut <= 0) cut = PDF_SPELL_DESCRIPTION_MAX_CHARS;
    parts.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  parts.push(remaining);
  return parts;
}

export function buildSpellPdfPages(
  blocks: PdfSpellcastingBlock[],
  options: { showPreparedBadge?: boolean } = {},
): SpellPdfPageDescriptor[] {
  const showPreparedBadge = options.showPreparedBadge ?? true;
  const pages: SpellPdfPageDescriptor[] = [];

  blocks.forEach((block, blockIndex) => {
    pages.push({ kind: "overview", blockIndex });

    const orderedSpells = getSpellLevelGroups(block).flatMap((group) => group.spells);
    for (const spellBatch of batchSpellsForDetailPages(orderedSpells, showPreparedBadge)) {
      pages.push({ kind: "detailBatch", blockIndex, spells: spellBatch });
    }

    for (const spell of orderedSpells) {
      const overflow = getCompactDescriptionOverflow(
        spell.description,
        PDF_SPELL_COMPACT_DESCRIPTION_MAX_CHARS,
      );
      if (!overflow) continue;

      const descriptionParts = splitDescriptionForPdfPages(overflow);
      descriptionParts.forEach((descriptionText) => {
        pages.push({
          kind: "detailContinuation",
          blockIndex,
          spell,
          descriptionText,
        });
      });
    }
  });

  return pages;
}
