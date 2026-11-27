/**
 * Page 1 combat column: hit points card, then attacks and equipment sharing the height left down to
 * the bottom of the page. The document styles read these sizes; the attack row count is estimated
 * from them so the ruled rows fill the attacks card.
 * @see FR-character-sheet-pdf-export
 */

import {
  PDF_CARD,
  PDF_CARD_GAP,
  PDF_COMBAT_TILE,
  PDF_PAGE_CONTENT_HEIGHT,
  PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH,
  PDF_SECTION_GAP,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import { estimateTextLineCount, measureTextWidth, truncateText } from "@/lib/characterSheetPdf/pdfTextMetrics";
import type { PdfHitDiceEntry } from "@/lib/characterSheetPdf/types";

/** Kept free under the page 1 body so float rounding never pushes it onto a second page. */
const PDF_PAGE_ONE_BODY_SAFETY = 1;

/** Text width inside a card of the combat column. */
export const PDF_COMBAT_CARD_INNER_WIDTH = PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH - 2 * PDF_CARD.paddingHorizontal;

/** A labelled row of the hit points card: a value, or a blank line to write on. */
export const PDF_HP_FIELD = {
  rowHeight: 13,
  rowGap: 4,
  labelWidth: 74,
  labelFontSize: 7.5,
  valueFontSize: 8.8,
} as const;

/** One hit dice pill per class (class name + dice), wrapping across the card. */
export const PDF_HIT_DICE_PILL = {
  blockMarginTop: 3,
  labelHeight: 9,
  marginTop: 3,
  height: 14,
  gap: 4,
  paddingHorizontal: 6,
  innerGap: 3,
  classFontSize: 6.6,
  notationFontSize: 7.8,
  classMaxChars: 14,
} as const;

/** Death saves block closing the hit points card (player only). */
export const PDF_DEATH_SAVES = {
  marginTop: 6,
  paddingTop: 7,
  headingFontSize: 6.6,
  headingLineHeight: 1.2,
  headingMarginBottom: 4,
  rowHeight: 10,
  rowGap: 5,
} as const;

/** Attacks table: a header line, then rows two text lines high. */
export const PDF_ATTACK_TABLE = {
  headerHeight: 12,
  fontSize: 7.2,
  lineHeight: 1.25,
  damageTypeFontSize: 6.2,
  rowPaddingVertical: 2,
  columnGap: 3,
  /** Fits the widest translated header (« Bonus ») and a two-digit bonus. */
  bonusWidth: 21,
  /** Fits two damage dice (`1d8+3 + 1d6`). */
  damageWidth: 42,
} as const;
/** The attack name takes the rest of the row, on up to two lines. */
export const PDF_ATTACK_NAME_WIDTH =
  PDF_COMBAT_CARD_INNER_WIDTH -
  PDF_ATTACK_TABLE.bonusWidth -
  PDF_ATTACK_TABLE.damageWidth -
  2 * PDF_ATTACK_TABLE.columnGap;
export const PDF_ATTACK_ROW_HEIGHT =
  2 * PDF_ATTACK_TABLE.fontSize * PDF_ATTACK_TABLE.lineHeight + 2 * PDF_ATTACK_TABLE.rowPaddingVertical;

/** Height of the page 1 body under the header card: every column ends at the bottom of the page. */
export function getPageOneBodyHeight(headerHeight: number): number {
  return PDF_PAGE_CONTENT_HEIGHT - headerHeight - PDF_SECTION_GAP - PDF_PAGE_ONE_BODY_SAFETY;
}

/** Title band of a combat column card (a long translated title can take two lines). */
export function estimateCombatCardChromeHeight(title: string): number {
  const lines = Math.max(1, estimateTextLineCount(title, PDF_CARD.titleFontSize, PDF_COMBAT_CARD_INNER_WIDTH, "bold"));
  return (
    2 * PDF_CARD.paddingVertical +
    lines * PDF_CARD.titleFontSize * PDF_CARD.titleLineHeight +
    PDF_CARD.titleMarginBottom
  );
}

function getHitDicePillWidth(entry: PdfHitDiceEntry): number {
  const p = PDF_HIT_DICE_PILL;
  return (
    2 * p.paddingHorizontal +
    measureTextWidth(truncateText(entry.className, p.classMaxChars), p.classFontSize) +
    p.innerGap +
    measureTextWidth(entry.notation, p.notationFontSize, "bold")
  );
}

/** Rows taken by the hit dice pills, packed left to right as the renderer wraps them. */
export function estimateHitDicePillRows(entries: PdfHitDiceEntry[]): number {
  if (entries.length === 0) return 0;
  let rows = 1;
  let rowWidth = 0;
  for (const entry of entries) {
    const width = getHitDicePillWidth(entry);
    const needed = rowWidth === 0 ? width : rowWidth + PDF_HIT_DICE_PILL.gap + width;
    if (needed <= PDF_COMBAT_CARD_INNER_WIDTH || rowWidth === 0) {
      rowWidth = needed;
      continue;
    }
    rows += 1;
    rowWidth = width;
  }
  return rows;
}

export interface HitPointsCardInput {
  isPlayer: boolean;
  title: string;
  /** Death saves heading (player), uppercase; a long translation wraps. */
  deathSavesTitle: string;
  hitDiceEntries: PdfHitDiceEntry[];
}

/**
 * Hit points card: max / current / temp rows, then (player) hit dice pills, the remaining hit dice
 * line and the death saves, or (NPC) the hit points roll.
 */
export function estimateHitPointsCardHeight({
  isPlayer,
  title,
  deathSavesTitle,
  hitDiceEntries,
}: HitPointsCardInput): number {
  const f = PDF_HP_FIELD;
  const fieldRows = 3 * (f.rowHeight + f.rowGap);
  const chrome = estimateCombatCardChromeHeight(title);
  const p = PDF_HIT_DICE_PILL;
  // NPC: the hit points roll under its label (translated labels are too long for one row).
  if (!isPlayer) return chrome + fieldRows + p.labelHeight + p.marginTop + f.rowHeight;

  const pillRows = estimateHitDicePillRows(hitDiceEntries);
  const hitDice =
    pillRows === 0
      ? f.rowHeight + f.rowGap
      : p.blockMarginTop + p.labelHeight + p.marginTop + pillRows * p.height + (pillRows - 1) * p.gap + f.rowGap;
  const remaining = f.rowHeight;
  const d = PDF_DEATH_SAVES;
  const headingLines = Math.max(
    1,
    estimateTextLineCount(deathSavesTitle.toUpperCase(), d.headingFontSize, PDF_COMBAT_CARD_INNER_WIDTH, "bold"),
  );
  const heading = headingLines * d.headingFontSize * d.headingLineHeight + d.headingMarginBottom;
  const deathSaves = d.marginTop + d.paddingTop + heading + 2 * d.rowHeight + d.rowGap;
  return chrome + fieldRows + hitDice + remaining + deathSaves;
}

export interface AttackRowCountInput extends HitPointsCardInput {
  headerHeight: number;
  attacksTitle: string;
}

/**
 * Ruled rows of the attacks card. Attacks and equipment share equally the combat column height
 * left under the AC tiles and the hit points card; the attacks rows fill their card.
 */
export function getPageOneAttackRowCount({ headerHeight, attacksTitle, ...hitPoints }: AttackRowCountInput): number {
  const sharedHeight =
    getPageOneBodyHeight(headerHeight) -
    PDF_COMBAT_TILE.height -
    PDF_CARD_GAP -
    estimateHitPointsCardHeight(hitPoints) -
    PDF_CARD_GAP -
    PDF_CARD_GAP;
  const tableHeight = sharedHeight / 2 - estimateCombatCardChromeHeight(attacksTitle) - PDF_ATTACK_TABLE.headerHeight;
  return Math.max(1, Math.floor(tableHeight / PDF_ATTACK_ROW_HEIGHT));
}
