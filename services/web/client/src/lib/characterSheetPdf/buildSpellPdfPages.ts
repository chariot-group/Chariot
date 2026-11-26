/** @see FR-character-sheet-pdf-export */

import {
  PDF_CARD_GAP,
  PDF_PAGE_CONTENT_HEIGHT,
  PDF_PAGE_CONTENT_WIDTH,
  PDF_SECTION_GAP,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import { measureTextWidth, PDF_HELVETICA_AVG_CHAR_EM, truncateText } from "@/lib/characterSheetPdf/pdfTextMetrics";
import type {
  PdfSpellLevelGroup,
  PdfSpellRow,
  PdfSpellcastingBlock,
  SpellPdfPageDescriptor,
} from "@/lib/characterSheetPdf/types";

/** Page heading (« Sorts ») above the first detail page of a block. */
export const PDF_SPELL_DETAIL_PAGE_TITLE_HEIGHT = 26;
/** Gap between detail cards, horizontally and vertically. */
export const PDF_SPELL_DETAIL_GAP = PDF_CARD_GAP;

/**
 * A spell card never exceeds half of the page content height (two rows per page), so its
 * description is cut with an ellipsis instead of spilling onto extra pages.
 */
export const PDF_SPELL_DETAIL_CARD_MAX_HEIGHT = Math.floor(
  (PDF_PAGE_CONTENT_HEIGHT - PDF_SPELL_DETAIL_PAGE_TITLE_HEIGHT - PDF_SPELL_DETAIL_GAP) / 2,
);

/** Spell detail card geometry: the document styles and the height estimate read the same values. */
export const PDF_SPELL_DETAIL_CARD = {
  paddingVertical: 10,
  paddingHorizontal: 12,
  titleFontSize: 11,
  titleLineHeight: 1.2,
  titleMarginBottom: 6,
  pillFontSize: 7,
  pillLineHeight: 1.2,
  pillPaddingHorizontal: 6,
  pillPaddingVertical: 2,
  pillGap: 4,
  pillMaxChars: 40,
  metaMarginBottom: 8,
  descriptionSeparatorWidth: 0.5,
  descriptionPaddingTop: 6,
  descriptionLabelFontSize: 6.6,
  descriptionLabelLineHeight: 1.2,
  descriptionLabelMarginBottom: 4,
  descriptionFontSize: 8.2,
  descriptionLineHeight: 1.4,
} as const;

/** Detail card width: two cards per row across the page content width, a lone card included. */
export const PDF_SPELL_DETAIL_CARD_WIDTH = (PDF_PAGE_CONTENT_WIDTH - PDF_SPELL_DETAIL_GAP) / 2;
const PDF_SPELL_DETAIL_CARD_INNER_WIDTH = PDF_SPELL_DETAIL_CARD_WIDTH - 2 * PDF_SPELL_DETAIL_CARD.paddingHorizontal;

/** Safety margin kept free at the bottom of a capped card. */
const PDF_SPELL_DETAIL_CARD_SAFETY = 2;

/** Short facts shown as pills on a spell detail card, each clamped to one pill line. */
export function getSpellDetailMetaParts(spell: PdfSpellRow, attackBonus: string): string[] {
  return [
    spell.school,
    spell.castingTime,
    spell.range,
    spell.components,
    spell.duration,
    spell.damage,
    spell.healing,
    spell.effectType === "attack" ? attackBonus : null,
  ]
    .map((part) => (part ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((part) => truncateText(part, PDF_SPELL_DETAIL_CARD.pillMaxChars));
}

function estimatePillRows(parts: string[]): number {
  const c = PDF_SPELL_DETAIL_CARD;
  let rows = 0;
  let rowWidth = 0;
  for (const part of parts) {
    const width = measureTextWidth(part, c.pillFontSize) + 2 * c.pillPaddingHorizontal;
    if (rows === 0 || rowWidth + c.pillGap + width > PDF_SPELL_DETAIL_CARD_INNER_WIDTH) {
      rows += 1;
      rowWidth = width;
    } else {
      rowWidth += c.pillGap + width;
    }
  }
  return rows;
}

export interface SpellDetailCardLayout {
  metaParts: string[];
  /** Description pre-clamped to a little more than fits; the renderer ends it with `…`. */
  description: string;
  /** Description lines that fit under the half-page cap. */
  descriptionMaxLines: number;
}

/**
 * Works out how a spell detail card fits under the half-page cap: the meta pills take what they
 * need (estimated on the wide side) and the description gets the remaining lines, cut with an
 * ellipsis by the renderer when longer.
 */
export function getSpellDetailCardLayout(spell: PdfSpellRow, attackBonus: string = ""): SpellDetailCardLayout {
  const c = PDF_SPELL_DETAIL_CARD;
  const metaParts = getSpellDetailMetaParts(spell, attackBonus);
  const pillRows = estimatePillRows(metaParts);
  const pillHeight = c.pillFontSize * c.pillLineHeight + 2 * c.pillPaddingVertical;
  const metaHeight = pillRows > 0 ? pillRows * pillHeight + (pillRows - 1) * c.pillGap + c.metaMarginBottom : 0;
  const titleHeight = c.titleFontSize * c.titleLineHeight + c.titleMarginBottom;
  const baseHeight = 2 * c.paddingVertical + titleHeight + metaHeight;

  const normalized = spell.description.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { metaParts, description: "", descriptionMaxLines: 0 };
  }

  const descriptionHeaderHeight =
    c.descriptionSeparatorWidth +
    c.descriptionPaddingTop +
    c.descriptionLabelFontSize * c.descriptionLabelLineHeight +
    c.descriptionLabelMarginBottom;
  const lineHeight = c.descriptionFontSize * c.descriptionLineHeight;
  const available =
    PDF_SPELL_DETAIL_CARD_MAX_HEIGHT - PDF_SPELL_DETAIL_CARD_SAFETY - baseHeight - descriptionHeaderHeight;
  const descriptionMaxLines = Math.max(1, Math.floor(available / lineHeight));

  const charsPerLine = Math.max(
    1,
    Math.floor(PDF_SPELL_DETAIL_CARD_INNER_WIDTH / (c.descriptionFontSize * PDF_HELVETICA_AVG_CHAR_EM)),
  );
  // Keep more text than fits so the renderer always has enough to fill the last line before `…`.
  const description = truncateText(normalized, Math.ceil(descriptionMaxLines * charsPerLine * 1.5));

  return { metaParts, description, descriptionMaxLines };
}

function getLevelGroupForOverview(
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
 * Spell overview sheet geometry: one LETTER page per block (the page does not wrap). The document
 * styles and the line budget below read the same values.
 */
export const PDF_SPELL_OVERVIEW = {
  headerPaddingVertical: 9,
  headerPaddingHorizontal: 12,
  /** Smallest space between two header facts; the facts spread evenly over the card width. */
  headerMinGap: 12,
  /** Labels stay on one line (see the label fit test for every locale). */
  statLabelFontSize: 5.8,
  statLabelLineHeight: 1.2,
  statLabelMarginBottom: 2,
  statValueFontSize: 10,
  statValueLineHeight: 1.15,
  levelCardPaddingVertical: 6,
  levelCardPaddingHorizontal: 9,
  levelHeaderHeight: 19,
  /** Preferred spell line height: blank lines are added at this pitch, then lines stretch to fill the card. */
  targetRowHeight: 17,
  /** Smallest line that still holds a spell name; a level never lists more spells than fit at this pitch. */
  minRowHeight: 9,
  spellNameFontSize: 7.4,
  spellNameLineHeight: 1.05,
} as const;

/** Levels of each overview column; the third column holds four smaller cards. */
const SPELL_OVERVIEW_COLUMN_LEVELS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8, 9],
];
const PDF_SPELL_OVERVIEW_COLUMN_COUNT = SPELL_OVERVIEW_COLUMN_LEVELS.length;

const PDF_SPELL_OVERVIEW_HEADER_HEIGHT =
  2 * PDF_SPELL_OVERVIEW.headerPaddingVertical +
  PDF_SPELL_OVERVIEW.statLabelFontSize * PDF_SPELL_OVERVIEW.statLabelLineHeight +
  PDF_SPELL_OVERVIEW.statLabelMarginBottom +
  PDF_SPELL_OVERVIEW.statValueFontSize * PDF_SPELL_OVERVIEW.statValueLineHeight;

/** Height of one column of level cards: the page content below the header card. */
const PDF_SPELL_OVERVIEW_COLUMN_HEIGHT = PDF_PAGE_CONTENT_HEIGHT - PDF_SPELL_OVERVIEW_HEADER_HEIGHT - PDF_SECTION_GAP;

/** Height of a level card outside its lines (paddings and level header): the card flex basis. */
export const PDF_SPELL_OVERVIEW_CARD_CHROME_HEIGHT =
  2 * PDF_SPELL_OVERVIEW.levelCardPaddingVertical + PDF_SPELL_OVERVIEW.levelHeaderHeight;

export interface SpellOverviewCard {
  group: PdfSpellLevelGroup;
  /** Spells listed on the card, capped to what fits at the minimum line height. */
  spells: PdfSpellRow[];
  /** Lines drawn: the listed spells, then blank lines to write in. */
  lineCount: number;
}

/** Space left for spell lines in a column of `cardCount` level cards. */
function getSpellOverviewLinesHeight(cardCount: number): number {
  return (
    PDF_SPELL_OVERVIEW_COLUMN_HEIGHT -
    Math.max(0, cardCount - 1) * PDF_CARD_GAP -
    cardCount * PDF_SPELL_OVERVIEW_CARD_CHROME_HEIGHT
  );
}

/** Splits items in order over `columnCount` columns (trailing columns may stay empty). */
function distributeIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const perColumn = Math.max(1, Math.ceil(items.length / columnCount));
  return Array.from({ length: columnCount }, (_, column) => items.slice(column * perColumn, (column + 1) * perColumn));
}

function getSpellOverviewGroupColumns(block: PdfSpellcastingBlock): PdfSpellLevelGroup[][] {
  const levelGroups = getSpellLevelGroups(block);
  if (block.isInnate) return distributeIntoColumns(levelGroups, PDF_SPELL_OVERVIEW_COLUMN_COUNT);
  return SPELL_OVERVIEW_COLUMN_LEVELS.map((levels) =>
    levels.map((level) => getLevelGroupForOverview(block, level, levelGroups)),
  );
}

/**
 * Level cards of the overview sheet, by column: levels 0-2, 3-5 and 6-9 (innate groups are spread
 * in order over the same three columns). Each card gets an even share of its column in blank lines and grows
 * with its spells, so the renderer can stretch the cards (flex grow = line count) to fill the column
 * with lines of one height.
 */
export function buildSpellOverviewColumns(block: PdfSpellcastingBlock): SpellOverviewCard[][] {
  return getSpellOverviewGroupColumns(block).map((groups) => {
    if (groups.length === 0) return [];
    const linesHeightPerCard = getSpellOverviewLinesHeight(groups.length) / groups.length;
    const blankLineCount = Math.max(1, Math.floor(linesHeightPerCard / PDF_SPELL_OVERVIEW.targetRowHeight));
    const maxSpells = Math.max(1, Math.floor(linesHeightPerCard / PDF_SPELL_OVERVIEW.minRowHeight));

    return groups.map((group) => {
      const spells = group.spells.slice(0, maxSpells);
      return { group, spells, lineCount: Math.max(blankLineCount, spells.length) };
    });
  });
}

/** Height of one spell line once the cards of a column are stretched to fill it. */
export function getSpellOverviewRowHeight(column: SpellOverviewCard[]): number {
  const lineCount = column.reduce((sum, card) => sum + card.lineCount, 0);
  return lineCount > 0 ? getSpellOverviewLinesHeight(column.length) / lineCount : 0;
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

/**
 * One overview page per spellcasting block, then one flowing details page: rows of two cards are
 * unbreakable and capped at half a page, so the renderer packs them and adds pages only as needed.
 */
export function buildSpellPdfPages(blocks: PdfSpellcastingBlock[]): SpellPdfPageDescriptor[] {
  const pages: SpellPdfPageDescriptor[] = [];

  blocks.forEach((block, blockIndex) => {
    pages.push({ kind: "overview", blockIndex });

    const spells = getSpellLevelGroups(block).flatMap((group) => group.spells);
    if (spells.length > 0) pages.push({ kind: "details", blockIndex, spells });
  });

  return pages;
}
