/**
 * LETTER page geometry (points) shared by the PDF document styles and the pagination estimates.
 * @see FR-character-sheet-pdf-export
 */

const PDF_PAGE_WIDTH = 612;
export const PDF_PAGE_HEIGHT = 792;
export const PDF_PAGE_PADDING = 24;
/** Space kept free above the fixed footer, added to the bottom page padding. */
const PDF_FOOTER_RESERVE = 20;
export const PDF_PAGE_PADDING_BOTTOM = PDF_PAGE_PADDING + PDF_FOOTER_RESERVE;
/** Vertical space usable by flowing content on a page. */
export const PDF_PAGE_CONTENT_HEIGHT = PDF_PAGE_HEIGHT - PDF_PAGE_PADDING - PDF_PAGE_PADDING_BOTTOM;
export const PDF_PAGE_CONTENT_WIDTH = PDF_PAGE_WIDTH - 2 * PDF_PAGE_PADDING;

/** Gap between cards, horizontally and vertically (app `gap-3 md:gap-4` scaled to the page). */
export const PDF_CARD_GAP = 8;
/** Gap between a page header card and the body below it (one step above the card gap). */
export const PDF_SECTION_GAP = 12;
/** App `Card` radius (`rounded-[24px]`) scaled to the page. */
export const PDF_CARD_RADIUS = 14;
/** Small stat tiles (ability scores, AC / initiative / speed, spell level cards). */
export const PDF_TILE_RADIUS = 12;

/** Section card box and title (app `GeneralSectionCard`): the styles and the height estimates read these. */
export const PDF_CARD = {
  paddingVertical: 9,
  paddingHorizontal: 11,
  titleFontSize: 10.5,
  titleLineHeight: 1.2,
  titleMarginBottom: 6,
} as const;

/** Free text inside a card (personality, ideals, bonds, flaws, backstory…). */
export const PDF_TEXT_BLOCK = { fontSize: 7.5, lineHeight: 1.45 } as const;

/** One entry of the features & traits list. */
export const PDF_FEATURE_ITEM = {
  nameFontSize: 8,
  nameLineHeight: 1.2,
  nameMarginBottom: 1.5,
  descriptionFontSize: 7.2,
  descriptionLineHeight: 1.4,
  marginBottom: 6,
} as const;

/**
 * Page 1 body: two equal halves. The left half holds the ability scores and skills columns, the
 * right half the combat and narrative columns, which share it equally.
 */
export const PDF_PAGE_ONE_HALF_WIDTH = (PDF_PAGE_CONTENT_WIDTH - PDF_CARD_GAP) / 2;
export const PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH = (PDF_PAGE_ONE_HALF_WIDTH - PDF_CARD_GAP) / 2;

/** Page 1 ability scores column: score tiles, then passive perception (labels are uppercase). */
export const PDF_ABILITY_COLUMN = {
  width: 60,
  tilePaddingHorizontal: 3,
  labelFontSize: 6,
} as const;

/** Page 1 skill cell: icon, name block, bonus, mastery icon; two cells per row. */
export const PDF_SKILL_CELL = {
  /** Space between the two skill columns (mastery icon of the left one to the icon of the right one). */
  columnGap: 16,
  iconSize: 10,
  gap: 3,
  nameFontSize: 6.7,
  bonusFontSize: 7,
  bonusWidth: 11,
  bonusGap: 3,
} as const;

/** Skills card column: the left half minus the ability scores column. */
const PDF_SKILLS_CARD_INNER_WIDTH =
  PDF_PAGE_ONE_HALF_WIDTH - PDF_ABILITY_COLUMN.width - PDF_CARD_GAP - 2 * PDF_CARD.paddingHorizontal;

/** Width left for a skill name once the icons, gaps and bonus of its cell are placed. */
export const PDF_SKILL_NAME_WIDTH =
  (PDF_SKILLS_CARD_INNER_WIDTH - PDF_SKILL_CELL.columnGap) / 2 -
  2 * PDF_SKILL_CELL.iconSize -
  2 * PDF_SKILL_CELL.gap -
  PDF_SKILL_CELL.bonusWidth -
  PDF_SKILL_CELL.bonusGap;

/** Page 1 AC / initiative / speed tiles: three per row across the combat column. */
export const PDF_COMBAT_TILE = {
  height: 34,
  gap: 5,
  paddingHorizontal: 4,
  labelFontSize: 6,
} as const;

/** Label width inside a combat tile (labels are uppercase). */
export const PDF_COMBAT_TILE_LABEL_WIDTH =
  (PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH - 2 * PDF_COMBAT_TILE.gap) / 3 - 2 * PDF_COMBAT_TILE.paddingHorizontal;
