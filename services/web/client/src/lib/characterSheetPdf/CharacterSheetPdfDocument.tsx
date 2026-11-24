/** @see FR-character-sheet-pdf-export */

import React from "react";
import { Document, Page, View, Text, Image, Link, StyleSheet, Font } from "@react-pdf/renderer";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import {
  getPageOneFeaturesMaxHeight,
  splitFeaturesForPdfPages,
} from "@/lib/characterSheetPdf/splitFeaturesForPdfPages";
import type { PdfNarrativeCard } from "@/lib/characterSheetPdf/splitFeaturesForPdfPages";
import { PDF_EQUIPMENT_PAGE1_MAX_CHARS, splitTextForPdfPages } from "@/lib/characterSheetPdf/splitTextForPdfPages";
import { buildLucideSvgDataUrl } from "@/lib/characterSheetPdf/buildLucideSvgString";
import { PDF_SKILL_LUCIDE_NODES } from "@/lib/characterSheetPdf/lucidePdfIconNodes";
import { getMasteryIconSvg } from "@/lib/characterSheetPdf/masteryIconSvg";
import { svgDataUrl } from "@/lib/characterSheetPdf/svgDataUrl";
import { splitWordToFit, truncateText } from "@/lib/characterSheetPdf/pdfTextMetrics";
import {
  PDF_ABILITY_COLUMN,
  PDF_CARD,
  PDF_CARD_GAP,
  PDF_CARD_RADIUS,
  PDF_COMBAT_TILE,
  PDF_FEATURE_ITEM,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_ONE_HALF_WIDTH,
  PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH,
  PDF_PAGE_PADDING,
  PDF_PAGE_PADDING_BOTTOM,
  PDF_SECTION_GAP,
  PDF_SKILL_CELL,
  PDF_TEXT_BLOCK,
  PDF_TILE_RADIUS,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import {
  getPageOneAttackRowCount,
  getPageOneBodyHeight,
  PDF_ATTACK_NAME_WIDTH,
  PDF_ATTACK_ROW_HEIGHT,
  PDF_ATTACK_TABLE,
  PDF_DEATH_SAVES,
  PDF_HIT_DICE_PILL,
  PDF_HP_FIELD,
} from "@/lib/characterSheetPdf/pageOneCombatLayout";
import {
  buildSpellOverviewColumns,
  buildSpellPdfPages,
  getSpellDetailCardLayout,
  PDF_SPELL_DETAIL_CARD,
  PDF_SPELL_DETAIL_CARD_MAX_HEIGHT,
  PDF_SPELL_DETAIL_CARD_WIDTH,
  PDF_SPELL_DETAIL_GAP,
  PDF_SPELL_DETAIL_PAGE_TITLE_HEIGHT,
  PDF_SPELL_OVERVIEW,
  PDF_SPELL_OVERVIEW_CARD_CHROME_HEIGHT,
} from "@/lib/characterSheetPdf/buildSpellPdfPages";
import type { SpellOverviewCard } from "@/lib/characterSheetPdf/buildSpellPdfPages";
import type { CharacterSheetPdfTheme, CharacterSheetPdfThemeTokens } from "@/lib/characterSheetPdf/themes";
import type {
  CharacterSheetPdfData,
  CharacterSheetPdfLabels,
  PdfAbilityFeature,
  PdfAttackRow,
  PdfClassEntry,
  PdfHitDiceEntry,
  PdfSkillRow,
  PdfSpellLevelGroup,
  PdfSpellRow,
  PdfSpellcastingBlock,
} from "@/lib/characterSheetPdf/types";

Font.registerHyphenationCallback((word) => [word]);

/** Page 1 header: 4:5 avatar (48×60 pt), three text columns, then the QR code. */
const PDF_HEADER = {
  rowHeight: 60,
  avatarWidth: 48,
  qrSize: 42,
  /** Added to the QR code right inset so it stays clear of the card's rounded corners. */
  qrExtraRightInset: 4,
  /** Space between the three text columns, also kept before the QR code. */
  columnGap: 16,
  paddingLeft: 11,
  /** Smallest space kept above and below the identity column when it grows. */
  textInset: 6,
  nameFontSize: 15,
  nameLineHeight: 1.15,
  nameMarginBottom: 3,
  classFontSize: 8.8,
  classLineHeight: 1.25,
  multiclassFontSize: 7.6,
  multiclassLineHeight: 1.25,
  multiclassLineGap: 1.5,
} as const;
/** Inset of the QR code above and below it; its right inset is a little larger. */
const PDF_HEADER_QR_INSET = (PDF_HEADER.rowHeight - PDF_HEADER.qrSize) / 2;

/** Blank space kept at the bottom of the treasure card for items added by hand. */
const PDF_TREASURE_WRITE_IN_MIN_HEIGHT = 110;

/** Site address printed in the footer, linked in the PDF. */
export const PDF_FOOTER_SITE_LABEL = "www.chariot.tools";
export const PDF_FOOTER_SITE_URL = "https://www.chariot.tools";

/** Narrative cards of page 1 keep their text short; the biography page shows it in full. */
const PDF_PAGE_ONE_NARRATIVE_MAX_CHARS = 180;

/** Slot pips drawn on a spell level card; above this the total is written as a number. */
const PDF_SPELL_SLOT_PIPS_MAX = 9;

/** Header height: fixed, unless a multiclass stack under the name needs more room. */
function getHeaderRowHeight(classCount: number): number {
  const h = PDF_HEADER;
  const classLines = Math.max(1, classCount);
  const classHeight =
    classLines === 1
      ? h.classFontSize * h.classLineHeight
      : classLines * h.multiclassFontSize * h.multiclassLineHeight + (classLines - 1) * h.multiclassLineGap;
  const identityHeight = h.nameFontSize * h.nameLineHeight + h.nameMarginBottom + classHeight;
  return Math.max(h.rowHeight, Math.ceil(identityHeight + 2 * h.textInset));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

/**
 * Sober card language of the app (`docs/design.md` §5.3): cards have no border, their title sits
 * inside in the accent color, pills use the raised fill, and lines are minor separators only.
 */
function createStyles(t: CharacterSheetPdfThemeTokens) {
  const c = PDF_SPELL_DETAIL_CARD;
  const o = PDF_SPELL_OVERVIEW;
  const h = PDF_HEADER;
  const separator = { borderBottomWidth: 0.5, borderBottomColor: t.border };
  // Line a hand-written value sits on: muted text color, so it stays visible once printed.
  const writeInLine = { borderBottomWidth: 0.5, borderBottomColor: t.textMuted };
  const f = PDF_HP_FIELD;
  const pill = PDF_HIT_DICE_PILL;
  const d = PDF_DEATH_SAVES;
  const a = PDF_ATTACK_TABLE;

  return StyleSheet.create({
    page: {
      backgroundColor: t.pageBackground,
      color: t.text,
      paddingTop: PDF_PAGE_PADDING,
      paddingHorizontal: PDF_PAGE_PADDING,
      paddingBottom: PDF_PAGE_PADDING_BOTTOM,
      fontSize: 8.4,
      fontFamily: "Helvetica",
    },
    // A non-wrapping page takes its content height (the Page node ignores `height`): min and max
    // pin it to LETTER, so the level columns stretch to the bottom and float rounding cannot grow it.
    spellOverviewPage: { minHeight: PDF_PAGE_HEIGHT, maxHeight: PDF_PAGE_HEIGHT },
    footer: {
      position: "absolute",
      bottom: 16,
      left: PDF_PAGE_PADDING,
      right: PDF_PAGE_PADDING,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 0.5,
      borderTopColor: t.border,
      paddingTop: 6,
    },
    footerText: { fontSize: 7, color: t.footerText },
    footerLink: { fontSize: 7, color: t.link, textDecoration: "none" },

    // Cards
    card: {
      backgroundColor: t.cardBackground,
      borderRadius: PDF_CARD_RADIUS,
      paddingVertical: PDF_CARD.paddingVertical,
      paddingHorizontal: PDF_CARD.paddingHorizontal,
      marginBottom: PDF_CARD_GAP,
    },
    // Card title: one size step above the card body, bold, accent color (app `GeneralSectionCard`).
    cardTitle: {
      fontSize: PDF_CARD.titleFontSize,
      fontWeight: "bold",
      lineHeight: PDF_CARD.titleLineHeight,
      marginBottom: PDF_CARD.titleMarginBottom,
    },
    tile: {
      backgroundColor: t.cardBackground,
      borderRadius: PDF_TILE_RADIUS,
      alignItems: "center",
      justifyContent: "center",
    },
    pill: {
      backgroundColor: t.raisedBackground,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
    },
    lastRowNoMargin: { marginBottom: 0 },
    row: { flexDirection: "row", gap: PDF_CARD_GAP },
    col: { flex: 1 },

    // Fact cells and text
    label: { fontSize: 6.6, color: t.textMuted, marginBottom: 2 },
    value: { fontSize: 8.8, fontWeight: "bold", lineHeight: 1.25 },
    factGrid: { flexDirection: "row", gap: PDF_CARD_GAP, marginBottom: 6 },
    textBlock: { fontSize: PDF_TEXT_BLOCK.fontSize, lineHeight: PDF_TEXT_BLOCK.lineHeight },
    proficient: { fontStyle: "italic" },

    // Page 1 header
    pageOneHeader: {
      backgroundColor: t.cardBackground,
      borderRadius: PDF_CARD_RADIUS,
      marginBottom: PDF_SECTION_GAP,
      overflow: "hidden",
    },
    headerRow: { flexDirection: "row", alignItems: "center" },
    headerAvatar: {
      width: h.avatarWidth,
      objectFit: "cover",
      flexShrink: 0,
      borderTopLeftRadius: PDF_CARD_RADIUS,
      borderBottomLeftRadius: PDF_CARD_RADIUS,
    },
    // Columns grow from their content width by the same amount, so the space between them is even.
    headerColumns: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: h.columnGap,
      paddingLeft: h.paddingLeft,
      paddingRight: h.columnGap,
      minWidth: 0,
    },
    headerColumn: { flexGrow: 1, flexShrink: 1, flexBasis: "auto", minWidth: 0, justifyContent: "center" },
    headerFact: { marginTop: 5 },
    // The link box is the QR code square: the right inset sits outside it, so the clickable area
    // does not spill past the code.
    qrLink: {
      width: h.qrSize,
      height: h.qrSize,
      marginRight: PDF_HEADER_QR_INSET + h.qrExtraRightInset,
      flexShrink: 0,
    },
    qrCode: { width: h.qrSize, height: h.qrSize, objectFit: "contain" },
    charName: {
      fontSize: h.nameFontSize,
      fontWeight: "bold",
      lineHeight: h.nameLineHeight,
      marginBottom: h.nameMarginBottom,
    },
    headerClass: { fontSize: h.classFontSize, fontWeight: "bold", lineHeight: h.classLineHeight },
    headerClassSub: { fontWeight: "normal", color: t.textMuted },
    multiclassLine: { fontSize: h.multiclassFontSize, fontWeight: "bold", lineHeight: h.multiclassLineHeight },
    multiclassSubclass: { fontWeight: "normal", color: t.textMuted },

    // Page 1 body grid: ability scores + skills on the left half, combat + narrative on the right half.
    // Fixed height (set from the header): every column ends at the bottom of the page.
    bodyGrid: { flexDirection: "row", gap: PDF_CARD_GAP, alignItems: "stretch" },
    colLeftRegion: { width: PDF_PAGE_ONE_HALF_WIDTH, flexDirection: "column" },
    // Stretch: the ability column takes the height of the skills column next to it.
    leftTopRow: { flexDirection: "row", gap: PDF_CARD_GAP, alignItems: "stretch", marginBottom: PDF_CARD_GAP },
    colAbilities: { width: PDF_ABILITY_COLUMN.width, flexDirection: "column", gap: PDF_CARD_GAP },
    colSkills: { flex: 1, minWidth: 0 },
    colCombat: { width: PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH, flexDirection: "column" },
    colNarrative: { width: PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH, flexDirection: "column" },

    scoreCard: { flexGrow: 1, paddingVertical: 5, paddingHorizontal: PDF_ABILITY_COLUMN.tilePaddingHorizontal },
    scoreLabel: {
      fontSize: PDF_ABILITY_COLUMN.labelFontSize,
      fontWeight: "bold",
      textTransform: "uppercase",
      textAlign: "center",
      color: t.textMuted,
    },
    // Same space under the label in every tile, a two-line label (passive perception) included.
    scoreMod: { fontSize: 13, fontWeight: "bold", marginTop: 3 },
    scoreValue: { fontSize: 7.5, color: t.textMuted, marginTop: 2 },

    statPill: {
      backgroundColor: t.cardBackground,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 11,
      marginBottom: PDF_CARD_GAP,
    },
    inlineStatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    statPillLabel: { fontSize: 6.8, color: t.textMuted, textTransform: "uppercase" },
    statPillValue: { fontSize: 8.8, fontWeight: "bold" },
    checkbox: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: t.textMuted,
      borderRadius: 2,
      alignItems: "center",
      justifyContent: "center",
    },

    savingThrowsGrid: { flexDirection: "row", flexWrap: "wrap" },
    savingThrowCell: { width: "33.33%", alignItems: "center", paddingVertical: 3 },
    savingThrowTopRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 1 },
    savingThrowAbbr: { fontSize: 6.2, fontWeight: "bold", textTransform: "uppercase", color: t.textMuted },
    savingThrowBonus: { fontSize: 10, fontWeight: "bold", marginTop: 2 },
    masteryIcon: { width: 12, height: 12, flexShrink: 0 },

    skillsRow: { flexDirection: "row", gap: PDF_SKILL_CELL.columnGap, marginBottom: 2 },
    skillCell: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 2,
      gap: PDF_SKILL_CELL.gap,
    },
    skillIcon: { width: PDF_SKILL_CELL.iconSize, height: PDF_SKILL_CELL.iconSize, flexShrink: 0 },
    skillNameBlock: { flex: 1, minWidth: 0 },
    skillName: { fontSize: PDF_SKILL_CELL.nameFontSize, lineHeight: 1.2 },
    skillAbilityName: { fontSize: 6.2, color: t.textMuted, lineHeight: 1.2, marginTop: 1 },
    skillBonus: {
      fontSize: PDF_SKILL_CELL.bonusFontSize,
      fontWeight: "bold",
      width: PDF_SKILL_CELL.bonusWidth,
      textAlign: "right",
    },
    skillBonusGroup: { flexDirection: "row", alignItems: "center", gap: PDF_SKILL_CELL.bonusGap },

    profRow: { flexDirection: "row", marginBottom: 3, gap: 6 },
    profLabel: { fontSize: 7, fontWeight: "bold", color: t.textMuted, width: 54, flexShrink: 0 },
    profValue: { fontSize: 7.5, flex: 1, lineHeight: 1.35 },
    proficienciesCard: { minHeight: 90, marginBottom: 0 },

    statTile: {
      flex: 1,
      height: PDF_COMBAT_TILE.height,
      paddingHorizontal: PDF_COMBAT_TILE.paddingHorizontal,
      paddingVertical: 5,
      gap: 1,
      minWidth: 0,
    },
    statTileLabel: {
      fontSize: PDF_COMBAT_TILE.labelFontSize,
      color: t.textMuted,
      textTransform: "uppercase",
      textAlign: "center",
    },
    statTileValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
    combatStatsRow: { flexDirection: "row", gap: PDF_COMBAT_TILE.gap, marginBottom: PDF_CARD_GAP },

    // Hit points card: fixed-height rows, so the attack rows below can be counted ahead.
    fieldRow: { flexDirection: "row", alignItems: "flex-end", height: f.rowHeight, marginBottom: f.rowGap, gap: 4 },
    fieldLabel: { fontSize: f.labelFontSize, color: t.textMuted, width: f.labelWidth, maxLines: 1 },
    fieldValue: { fontSize: f.valueFontSize, flex: 1, maxLines: 1 },
    writeIn: { flex: 1, height: f.rowHeight, ...writeInLine },
    hitDiceBlock: { marginTop: pill.blockMarginTop, marginBottom: f.rowGap },
    npcHitPointsRoll: { fontSize: f.valueFontSize, height: f.rowHeight, marginTop: pill.marginTop, maxLines: 1 },
    hitDiceLabel: { fontSize: f.labelFontSize, color: t.textMuted, height: pill.labelHeight },
    hitDiceChips: { flexDirection: "row", flexWrap: "wrap", gap: pill.gap, marginTop: pill.marginTop },
    hitDiceChip: { height: pill.height, gap: pill.innerGap, paddingHorizontal: pill.paddingHorizontal },
    hitDiceChipClass: { fontSize: pill.classFontSize, color: t.textMuted },
    hitDiceChipValue: { fontSize: pill.notationFontSize, fontWeight: "bold" },

    deathSavesSection: {
      marginTop: d.marginTop,
      paddingTop: d.paddingTop,
      borderTopWidth: 0.5,
      borderTopColor: t.border,
    },
    deathSavesHeading: {
      fontSize: d.headingFontSize,
      lineHeight: d.headingLineHeight,
      marginBottom: d.headingMarginBottom,
      fontWeight: "bold",
      color: t.textMuted,
      textTransform: "uppercase",
    },
    deathSaveRow: { flexDirection: "row", alignItems: "center", height: d.rowHeight, marginBottom: d.rowGap, gap: 6 },
    deathSaveLabel: { fontSize: 7.5, fontWeight: "bold", width: 44 },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "flex-end" },
    dot: { width: 10, height: 10, borderRadius: 999, borderWidth: 1, borderColor: t.textMuted },

    // Attacks and equipment share the combat column height left under the hit points card.
    combatFillCard: { flexGrow: 1, flexShrink: 1, flexBasis: 0, overflow: "hidden" },
    attacksTableHeader: {
      height: a.headerHeight,
      flexDirection: "row",
      alignItems: "flex-end",
      paddingBottom: 2,
      gap: a.columnGap,
      ...separator,
    },
    attackRows: { flex: 1 },
    // Rows grow or shrink a little around their two-line height so they fill the card exactly.
    attackRow: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: PDF_ATTACK_ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: a.rowPaddingVertical,
      gap: a.columnGap,
      ...separator,
    },
    attackName: { flex: 1, minWidth: 0, fontSize: 6.5, fontWeight: "bold", color: t.textMuted },
    attackBonus: { width: a.bonusWidth, fontSize: 6.5, fontWeight: "bold", color: t.textMuted, textAlign: "center" },
    attackDamage: { width: a.damageWidth, fontSize: 6.5, fontWeight: "bold", color: t.textMuted, textAlign: "right" },
    // The name takes the rest of the row on up to two lines, then ends with an ellipsis.
    attackCellName: {
      flex: 1,
      minWidth: 0,
      fontSize: a.fontSize,
      lineHeight: a.lineHeight,
      maxLines: 2,
      textOverflow: "ellipsis",
    },
    attackCellBonus: { width: a.bonusWidth, fontSize: a.fontSize, textAlign: "center" },
    attackCellDamage: { width: a.damageWidth, alignItems: "flex-end" },
    attackDamageDice: {
      fontSize: a.fontSize,
      lineHeight: a.lineHeight,
      textAlign: "right",
      maxLines: 1,
      textOverflow: "ellipsis",
    },
    attackDamageType: {
      fontSize: a.damageTypeFontSize,
      lineHeight: a.lineHeight,
      color: t.textMuted,
      textAlign: "right",
      maxLines: 1,
      textOverflow: "ellipsis",
    },

    coinRow: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 4 },
    coinIcon: { width: 10, height: 9 },
    coinText: { fontSize: 7.3, fontWeight: "bold" },
    // Takes the height left under the narrative cards, down to the bottom of the page.
    featuresCard: { flexGrow: 1, marginBottom: 0 },
    // Last card of the biography page: blank space down to the bottom of the page, never less than
    // a few lines, so the player can add items by hand. Unbreakable: it moves whole to the next page.
    treasureCard: { flexGrow: 1, marginBottom: 0 },
    treasureWriteInSpace: { flexGrow: 1, minHeight: PDF_TREASURE_WRITE_IN_MIN_HEIGHT },
    featureItem: { marginBottom: PDF_FEATURE_ITEM.marginBottom },
    featureName: {
      fontSize: PDF_FEATURE_ITEM.nameFontSize,
      lineHeight: PDF_FEATURE_ITEM.nameLineHeight,
      fontWeight: "bold",
      marginBottom: PDF_FEATURE_ITEM.nameMarginBottom,
    },
    featureDescription: {
      fontSize: PDF_FEATURE_ITEM.descriptionFontSize,
      lineHeight: PDF_FEATURE_ITEM.descriptionLineHeight,
    },

    // Spell overview page
    // Facts take their content width and spread evenly: the same space between each of them.
    spellOverviewHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: o.headerMinGap,
      paddingVertical: o.headerPaddingVertical,
      paddingHorizontal: o.headerPaddingHorizontal,
      marginBottom: PDF_SECTION_GAP,
    },
    spellOverviewStatCell: { flexShrink: 1, minWidth: 0 },
    spellOverviewWriteIn: { width: 28, height: o.statValueFontSize * o.statValueLineHeight, ...writeInLine },
    spellOverviewStatLabel: {
      fontSize: o.statLabelFontSize,
      lineHeight: o.statLabelLineHeight,
      marginBottom: o.statLabelMarginBottom,
      fontWeight: "bold",
      color: t.textMuted,
      textTransform: "uppercase",
      maxLines: 1,
      textOverflow: "ellipsis",
    },
    spellOverviewStatValue: {
      fontSize: o.statValueFontSize,
      lineHeight: o.statValueLineHeight,
      fontWeight: "bold",
      maxLines: 1,
      textOverflow: "ellipsis",
    },
    // Columns and cards stretch to the bottom of the page: no empty space under the level cards.
    spellOverviewColumns: { flex: 1, flexDirection: "row", gap: PDF_CARD_GAP },
    spellOverviewColumn: { flex: 1, minWidth: 0, flexDirection: "column", gap: PDF_CARD_GAP },
    spellLevelCard: {
      flexBasis: PDF_SPELL_OVERVIEW_CARD_CHROME_HEIGHT,
      flexShrink: 1,
      backgroundColor: t.cardBackground,
      borderRadius: PDF_TILE_RADIUS,
      paddingVertical: o.levelCardPaddingVertical,
      paddingHorizontal: o.levelCardPaddingHorizontal,
    },
    spellLevelHeader: {
      height: o.levelHeaderHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      ...separator,
    },
    spellLevelTitle: { fontSize: 8, fontWeight: "bold", color: t.pink, flex: 1, minWidth: 0 },
    spellSlots: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 },
    spellSlotsLabel: { fontSize: 5.6, color: t.textMuted, textTransform: "uppercase" },
    spellSlotPips: { flexDirection: "row", gap: 2.5 },
    spellSlotPip: { width: 7, height: 7, borderRadius: 999, borderWidth: 0.8, borderColor: t.textMuted },
    spellSlotWriteIn: { width: 18, height: 8, borderBottomWidth: 0.5, borderBottomColor: t.textMuted },
    spellSlotTotal: { fontSize: 7.2, fontWeight: "bold" },
    spellLevelLines: { flex: 1 },
    // Every line, the last one included, ends with a separator.
    spellOverviewLine: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, ...separator },
    spellOverviewCheckbox: {
      width: 7,
      height: 7,
      borderWidth: 0.8,
      borderColor: t.textMuted,
      borderRadius: 1.5,
      flexShrink: 0,
    },
    spellOverviewSpellName: {
      flex: 1,
      fontSize: o.spellNameFontSize,
      lineHeight: o.spellNameLineHeight,
      maxLines: 1,
      textOverflow: "ellipsis",
    },

    // Spell detail pages
    spellPageTitle: {
      fontSize: 14,
      fontWeight: "bold",
      lineHeight: 1.2,
      color: t.pink,
      marginBottom: PDF_SPELL_DETAIL_PAGE_TITLE_HEIGHT - 14 * 1.2,
    },
    spellDetailRow: { flexDirection: "row", gap: PDF_SPELL_DETAIL_GAP, marginBottom: PDF_SPELL_DETAIL_GAP },
    // Fixed width: a lone card on the last row keeps the width of the others.
    spellCard: {
      width: PDF_SPELL_DETAIL_CARD_WIDTH,
      maxHeight: PDF_SPELL_DETAIL_CARD_MAX_HEIGHT,
      overflow: "hidden",
      backgroundColor: t.cardBackground,
      borderRadius: PDF_CARD_RADIUS,
      paddingVertical: c.paddingVertical,
      paddingHorizontal: c.paddingHorizontal,
    },
    spellCardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      marginBottom: c.titleMarginBottom,
    },
    spellCardTitle: {
      fontSize: c.titleFontSize,
      lineHeight: c.titleLineHeight,
      fontWeight: "bold",
      color: t.pink,
      flex: 1,
      maxLines: 1,
      textOverflow: "ellipsis",
    },
    spellCardLevel: { fontSize: 7.5, color: t.textMuted, fontWeight: "bold", flexShrink: 0 },
    spellCardMeta: { flexDirection: "row", flexWrap: "wrap", gap: c.pillGap, marginBottom: c.metaMarginBottom },
    spellCardPill: { paddingHorizontal: c.pillPaddingHorizontal, paddingVertical: c.pillPaddingVertical },
    spellCardPillText: { fontSize: c.pillFontSize, lineHeight: c.pillLineHeight, color: t.text },
    spellCardDescriptionSection: {
      borderTopWidth: c.descriptionSeparatorWidth,
      borderTopColor: t.border,
      paddingTop: c.descriptionPaddingTop,
    },
    spellCardDescriptionLabel: {
      fontSize: c.descriptionLabelFontSize,
      lineHeight: c.descriptionLabelLineHeight,
      fontWeight: "bold",
      color: t.textMuted,
      textTransform: "uppercase",
      marginBottom: c.descriptionLabelMarginBottom,
    },
    spellCardDescription: {
      fontSize: c.descriptionFontSize,
      lineHeight: c.descriptionLineHeight,
      textOverflow: "ellipsis",
    },
  });
}

type PdfStyles = ReturnType<typeof createStyles>;
type PdfStyleProp = React.ComponentProps<typeof View>["style"];

/** Truncated text, or a blank so an empty field still takes its line. */
function clampText(value: string, max: number): string {
  return truncateText(value, max) || " ";
}

const COIN_FILLS = { cp: "#A45918", sp: "#BDBDBD", ep: "#7F8F9E", gp: "#FFC400", pp: "#BEBAA3" } as const;
type CoinKey = keyof typeof COIN_FILLS;

/** Coin icon; the outline takes the card color so the coin edge reads as a cut-out. */
function coinSvg(fill: string, outline: string): string {
  return `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="${fill}"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="${fill}" stroke="${outline}" stroke-width="2"/></svg>`;
}

function PageFooter({ labels, styles }: { labels: CharacterSheetPdfLabels; styles: PdfStyles }) {
  return (
    <View
      style={styles.footer}
      fixed>
      <Text style={styles.footerText}>{labels.appName}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          labels.pageOf.replace("{page}", String(pageNumber)).replace("{total}", String(totalPages))
        }
      />
      <Link
        src={PDF_FOOTER_SITE_URL}
        style={styles.footerLink}>
        {PDF_FOOTER_SITE_LABEL}
      </Link>
    </View>
  );
}

/**
 * A section card holds its own title (accent color) and its content, like the app
 * `GeneralSectionCard`. `breakable` lets long text cards continue on the next page.
 */
function SectionCard({
  title,
  color,
  styles,
  style,
  breakable = false,
  children,
}: {
  title: string;
  color: string;
  styles: PdfStyles;
  style?: PdfStyleProp;
  breakable?: boolean;
  children: React.ReactNode;
}) {
  const extra = Array.isArray(style) ? style : style ? [style] : [];
  return (
    <View
      style={[styles.card, ...extra]}
      wrap={breakable}>
      <Text
        style={[styles.cardTitle, { color }]}
        minPresenceAhead={breakable ? PDF_CARD.titleFontSize * 3 : undefined}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function TextCard({
  title,
  color,
  text,
  maxChars,
  styles,
  style,
  breakable,
}: {
  title: string;
  color: string;
  text: string;
  maxChars: number;
  styles: PdfStyles;
  style?: PdfStyleProp;
  breakable?: boolean;
}) {
  return (
    <SectionCard
      title={title}
      color={color}
      styles={styles}
      style={style}
      breakable={breakable}>
      <Text style={styles.textBlock}>{clampText(text, maxChars)}</Text>
    </SectionCard>
  );
}

/** Class & level under the character name, without a label: one line, or one line per class. */
function HeaderClasses({
  entries,
  classPrimary,
  subclassPrimary,
  styles,
}: {
  entries: PdfClassEntry[];
  classPrimary: string;
  subclassPrimary: string;
  styles: PdfStyles;
}) {
  if (entries.length <= 1) {
    const subclass = subclassPrimary.trim();
    return (
      <Text style={styles.headerClass}>
        {clampText(classPrimary, 24)}
        {subclass ? <Text style={styles.headerClassSub}> ({subclass})</Text> : null}
      </Text>
    );
  }

  return (
    <View>
      {entries.map((entry, index) => (
        <Text
          key={`${entry.name}-${entry.level}-${index}`}
          style={[styles.multiclassLine, index > 0 ? { marginTop: PDF_HEADER.multiclassLineGap } : {}]}>
          {entry.label.trim() || " "}
          {entry.subclass ? <Text style={styles.multiclassSubclass}> · {entry.subclass.trim()}</Text> : null}
        </Text>
      ))}
    </View>
  );
}

/** A labelled fact of the page 1 header. */
function HeaderFact({
  label,
  value,
  maxChars,
  styles,
  style,
}: {
  label: string;
  value: string;
  maxChars: number;
  styles: PdfStyles;
  style?: PdfStyleProp;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{clampText(value, maxChars)}</Text>
    </View>
  );
}

/** A labelled row of the hit points card holding a printed value. */
function FieldRow({ label, value, styles }: { label: string; value: string; styles: PdfStyles }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

/** A labelled row left blank: the player writes the value on its line. */
export function WriteInField({
  label,
  styles,
  isLast = false,
}: {
  label: string;
  styles: PdfStyles;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, isLast ? styles.lastRowNoMargin : {}]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.writeIn} />
    </View>
  );
}

/** Total hit dice of a class (class name + dice), one pill per class. */
export function HitDicePill({ entry, styles }: { entry: PdfHitDiceEntry; styles: PdfStyles }) {
  return (
    <View style={[styles.pill, styles.hitDiceChip]}>
      <Text style={styles.hitDiceChipClass}>{clampText(entry.className, PDF_HIT_DICE_PILL.classMaxChars)}</Text>
      <Text style={styles.hitDiceChipValue}>{entry.notation}</Text>
    </View>
  );
}

/** Player hit dice, closing the hit points rows: one pill per class (a write-in line when there is none). */
function HitDiceBlock({ label, entries, styles }: { label: string; entries: PdfHitDiceEntry[]; styles: PdfStyles }) {
  if (entries.length === 0) {
    return (
      <WriteInField
        label={label}
        styles={styles}
        isLast
      />
    );
  }

  return (
    <View style={[styles.hitDiceBlock, styles.lastRowNoMargin]}>
      <Text style={styles.hitDiceLabel}>{label}</Text>
      <View style={styles.hitDiceChips}>
        {entries.map((entry, index) => (
          <HitDicePill
            key={`${entry.className}-${entry.notation}-${index}`}
            entry={entry}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

/** Empty circles the player fills by hand (death saves). */
export function EmptyDots({ styles, total }: { styles: PdfStyles; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={`dot-${i}`}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

/** Breaks a word too long for the attack name column, so it never runs over the next columns. */
const breakAttackNameWord = (word: string) => splitWordToFit(word, PDF_ATTACK_TABLE.fontSize, PDF_ATTACK_NAME_WIDTH);

/** A ruled row of the attacks table: name, bonus, then the damage type under the dice. */
export function AttackRow({ attack, styles }: { attack: PdfAttackRow | null; styles: PdfStyles }) {
  return (
    <View style={styles.attackRow}>
      {attack ? (
        <>
          <Text
            style={styles.attackCellName}
            hyphenationCallback={breakAttackNameWord}>
            {attack.name.trim() || " "}
          </Text>
          <Text style={styles.attackCellBonus}>{attack.bonus}</Text>
          <View style={styles.attackCellDamage}>
            <Text style={styles.attackDamageDice}>{clampText(attack.damage, 24)}</Text>
            {attack.damageType ? <Text style={styles.attackDamageType}>{attack.damageType}</Text> : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

function FeaturesList({ features, styles }: { features: PdfAbilityFeature[]; styles: PdfStyles }) {
  if (features.length === 0) {
    return <Text style={styles.textBlock}> </Text>;
  }

  return (
    <>
      {features.map((feature, index) => (
        <View
          key={`${feature.name}-${index}`}
          wrap={false}
          style={[styles.featureItem, index === features.length - 1 ? styles.lastRowNoMargin : {}]}>
          <Text style={styles.featureName}>{feature.name.trim() || " "}</Text>
          {feature.description.trim() ? (
            <Text style={styles.featureDescription}>{feature.description.trim()}</Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

function MasteryIcon({
  level,
  theme,
  t,
  styles,
  style,
}: {
  level: number;
  theme: CharacterSheetPdfTheme;
  t: CharacterSheetPdfThemeTokens;
  styles: PdfStyles;
  style?: PdfStyleProp;
}) {
  return (
    <Image
      src={svgDataUrl(getMasteryIconSvg(level, "blue", theme, { blue: t.blue, red: t.red, textMuted: t.textMuted }))}
      style={style ?? styles.masteryIcon}
    />
  );
}

function SkillCell({
  skill,
  theme,
  t,
  styles,
}: {
  skill: PdfSkillRow;
  theme: CharacterSheetPdfTheme;
  t: CharacterSheetPdfThemeTokens;
  styles: PdfStyles;
}) {
  const iconNode = PDF_SKILL_LUCIDE_NODES[skill.key];
  const iconSrc = skill.iconDataUrl ?? (iconNode ? buildLucideSvgDataUrl(iconNode, t.textMuted) : null);

  return (
    <View style={styles.skillCell}>
      {iconSrc ? (
        <Image
          src={iconSrc}
          style={styles.skillIcon}
        />
      ) : (
        <View style={styles.skillIcon} />
      )}
      <View style={styles.skillNameBlock}>
        <Text style={[styles.skillName, skill.proficient ? styles.proficient : {}]}>{clampText(skill.name, 18)}</Text>
        <Text style={styles.skillAbilityName}>{clampText(skill.abilityName, 16)}</Text>
      </View>
      <View style={styles.skillBonusGroup}>
        <Text style={styles.skillBonus}>{skill.bonus}</Text>
        <MasteryIcon
          level={skill.masteryLevel}
          theme={theme}
          t={t}
          styles={styles}
          style={styles.skillIcon}
        />
      </View>
    </View>
  );
}

function getSpellOverviewLevelTitle(group: PdfSpellLevelGroup, labels: CharacterSheetPdfLabels): string {
  if (group.usesPerDay !== null && group.level < 0) {
    return labels.npcUsesPerDay.replace("{count}", String(group.usesPerDay));
  }
  if (group.level < 0) return labels.npcAtWill;
  if (group.level === 0) return labels.spellLevelCantrips;
  return `${labels.spellLevel} ${group.level}`;
}

/** Slots of a spell level: one empty pip per slot (ticked by hand), or a write-in line when unknown. */
function SpellSlotsIndicator({
  slots,
  labels,
  styles,
}: {
  slots: { used: number; total: number } | null;
  labels: CharacterSheetPdfLabels;
  styles: PdfStyles;
}) {
  const total = slots?.total ?? 0;
  return (
    <View style={styles.spellSlots}>
      <Text style={styles.spellSlotsLabel}>{labels.spellSlots}</Text>
      {total <= 0 ? (
        <View style={styles.spellSlotWriteIn} />
      ) : total > PDF_SPELL_SLOT_PIPS_MAX ? (
        <Text style={styles.spellSlotTotal}>{total}</Text>
      ) : (
        <View style={styles.spellSlotPips}>
          {Array.from({ length: total }).map((_, index) => (
            <View
              key={`pip-${index}`}
              style={styles.spellSlotPip}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * A level card of the overview sheet. It grows with its line count so every line of a column has
 * the same height; levels 1-9 get an empty prepared checkbox on every line (ticked by hand).
 */
function SpellLevelCard({
  card,
  labels,
  styles,
  showPreparedMarks,
  showSlots,
}: {
  card: SpellOverviewCard;
  labels: CharacterSheetPdfLabels;
  styles: PdfStyles;
  showPreparedMarks: boolean;
  showSlots: boolean;
}) {
  const { group, spells, lineCount } = card;
  const showCheckbox = showPreparedMarks && group.level > 0;

  return (
    <View
      style={[styles.spellLevelCard, { flexGrow: lineCount }]}
      wrap={false}>
      <View style={styles.spellLevelHeader}>
        <Text style={styles.spellLevelTitle}>{getSpellOverviewLevelTitle(group, labels)}</Text>
        {showSlots && group.level > 0 ? (
          <SpellSlotsIndicator
            slots={group.slots}
            labels={labels}
            styles={styles}
          />
        ) : null}
      </View>

      <View style={styles.spellLevelLines}>
        {Array.from({ length: lineCount }).map((_, index) => {
          const spell: PdfSpellRow | undefined = spells[index];
          return (
            <View
              key={spell ? `${spell.name}-${index}` : `empty-${index}`}
              style={styles.spellOverviewLine}>
              {showCheckbox ? <View style={styles.spellOverviewCheckbox} /> : null}
              {spell ? <Text style={styles.spellOverviewSpellName}>{spell.name.trim() || " "}</Text> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** A fact of the spell overview header; without a value it is a line the player writes on. */
function SpellOverviewStat({ label, value, styles }: { label: string; value?: string; styles: PdfStyles }) {
  return (
    <View style={styles.spellOverviewStatCell}>
      <Text style={styles.spellOverviewStatLabel}>{label}</Text>
      {value === undefined ? (
        <View style={styles.spellOverviewWriteIn} />
      ) : (
        <Text style={styles.spellOverviewStatValue}>{value || " "}</Text>
      )}
    </View>
  );
}

/** Overview sheet of a spellcasting block: header facts, then three columns of level cards. */
function SpellOverviewPage({
  block,
  labels,
  styles,
  showPreparedMarks,
}: {
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: PdfStyles;
  showPreparedMarks: boolean;
}) {
  const columns = buildSpellOverviewColumns(block);

  return (
    <>
      <View
        style={[styles.card, styles.spellOverviewHeader]}
        wrap={false}>
        <SpellOverviewStat
          label={labels.spellcastingClass}
          value={block.className}
          styles={styles}
        />
        <SpellOverviewStat
          label={labels.spellcastingAbility}
          value={block.ability}
          styles={styles}
        />
        {!block.isInnate ? (
          <SpellOverviewStat
            label={labels.preparedSpells}
            styles={styles}
          />
        ) : null}
        <SpellOverviewStat
          label={labels.spellSaveDc}
          value={block.saveDc}
          styles={styles}
        />
        <SpellOverviewStat
          label={labels.spellAttackBonus}
          value={block.attackBonus}
          styles={styles}
        />
      </View>

      <View style={styles.spellOverviewColumns}>
        {columns.map((cards, columnIndex) => (
          <View
            key={`spell-col-${columnIndex}`}
            style={styles.spellOverviewColumn}>
            {cards.map((card) => (
              <SpellLevelCard
                key={`group-${card.group.level}-${card.group.usesPerDay ?? "none"}`}
                card={card}
                labels={labels}
                styles={styles}
                showPreparedMarks={showPreparedMarks}
                showSlots={!block.isInnate}
              />
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

/** Spell detail card, capped at half the page: the description ends with `…` when cut. */
function SpellDetailCard({
  spell,
  block,
  labels,
  styles,
}: {
  spell: PdfSpellRow;
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: PdfStyles;
}) {
  const layout = getSpellDetailCardLayout(spell, block.attackBonus);
  const levelLabel = spell.level === 0 ? labels.spellLevelCantrip : `${labels.spellLevel} ${spell.level}`;

  return (
    <View
      style={styles.spellCard}
      wrap={false}>
      <View style={styles.spellCardTitleRow}>
        <Text style={styles.spellCardTitle}>{spell.name.trim() || " "}</Text>
        <Text style={styles.spellCardLevel}>{levelLabel}</Text>
      </View>
      {layout.metaParts.length > 0 ? (
        <View style={styles.spellCardMeta}>
          {layout.metaParts.map((part, index) => (
            <View
              key={`${part}-${index}`}
              style={[styles.pill, styles.spellCardPill]}>
              <Text style={styles.spellCardPillText}>{part}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {layout.description ? (
        <View style={styles.spellCardDescriptionSection}>
          <Text style={styles.spellCardDescriptionLabel}>{labels.spellDescription}</Text>
          <Text style={[styles.spellCardDescription, { maxLines: layout.descriptionMaxLines }]}>
            {layout.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function SpellDetailPages({
  spells,
  block,
  labels,
  styles,
}: {
  spells: PdfSpellRow[];
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: PdfStyles;
}) {
  return (
    <>
      <Text style={styles.spellPageTitle}>{labels.spellsSection}</Text>
      {chunk(spells, 2).map((row, rowIndex) => (
        <View
          key={`spell-row-${rowIndex}`}
          style={styles.spellDetailRow}
          wrap={false}>
          {row.map((spell, index) => (
            <SpellDetailCard
              key={`${spell.name}-${index}`}
              spell={spell}
              block={block}
              labels={labels}
              styles={styles}
            />
          ))}
        </View>
      ))}
    </>
  );
}

interface CharacterSheetPdfDocumentProps {
  data: CharacterSheetPdfData;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
}

export function CharacterSheetPdfDocument({ data, labels, theme }: CharacterSheetPdfDocumentProps) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];
  const styles = createStyles(t);
  const headerRowHeight = getHeaderRowHeight(data.isPlayer ? data.classEntries.length : 1);
  const attackRowCount = getPageOneAttackRowCount({
    headerHeight: headerRowHeight,
    attacksTitle: labels.attacksAndSpellcasting,
    isPlayer: data.isPlayer,
    title: labels.hitPoints,
    deathSavesTitle: labels.deathSaves,
    hitDiceEntries: data.hitDiceEntries,
  });
  const attackRows: (PdfAttackRow | null)[] = Array.from(
    { length: attackRowCount },
    (_, index) => data.attacks[index] ?? null,
  );
  // Rendered text of the narrative cards: the same values feed the features space estimate.
  const narrativeCards: PdfNarrativeCard[] = [
    { title: labels.personalityTraits, text: data.personalityTraits },
    { title: labels.ideals, text: data.ideals },
    { title: labels.bonds, text: data.bonds },
    { title: labels.flaws, text: data.flaws },
  ].map((card) => ({ ...card, text: clampText(card.text, PDF_PAGE_ONE_NARRATIVE_MAX_CHARS) }));
  const { pageOne: featuresPageOne, pageTwo: featuresPageTwo } = splitFeaturesForPdfPages(
    data.features,
    getPageOneFeaturesMaxHeight({
      headerHeight: headerRowHeight,
      narrativeCards,
      featuresTitle: labels.featuresAndTraits,
    }),
  );
  const equipmentSource = data.equipment || data.treasureText;
  const equipmentSplit = splitTextForPdfPages(equipmentSource, PDF_EQUIPMENT_PAGE1_MAX_CHARS);
  const spellPages = data.hasSpellcasting ? buildSpellPdfPages(data.spellcastingBlocks) : [];
  const appearanceRows = [
    [
      { label: labels.age, value: data.appearance.age },
      { label: labels.height, value: data.appearance.height },
      { label: labels.weight, value: data.appearance.weight },
    ],
    [
      { label: labels.eyes, value: data.appearance.eyes },
      { label: labels.skin, value: data.appearance.skin },
      { label: labels.hair, value: data.appearance.hair },
    ],
  ];

  return (
    <Document>
      {/* Core sheet — may span multiple PDF pages when content overflows */}
      <Page
        size="LETTER"
        style={styles.page}
        wrap>
        <View style={styles.pageOneHeader}>
          <View style={[styles.headerRow, { height: headerRowHeight }]}>
            {data.avatarDataUrl ? (
              <Image
                src={data.avatarDataUrl}
                style={[styles.headerAvatar, { height: headerRowHeight }]}
              />
            ) : null}
            <View style={styles.headerColumns}>
              <View style={styles.headerColumn}>
                <Text style={styles.charName}>{clampText(data.displayName, 34)}</Text>
                {data.isPlayer ? (
                  <HeaderClasses
                    entries={data.classEntries}
                    classPrimary={data.classPrimary}
                    subclassPrimary={data.subclassPrimary}
                    styles={styles}
                  />
                ) : (
                  <Text style={styles.headerClass}>{clampText(data.classOrCr, 26)}</Text>
                )}
              </View>
              <View style={styles.headerColumn}>
                {data.isPlayer ? (
                  <HeaderFact
                    label={labels.experience}
                    value={data.experience}
                    maxChars={14}
                    styles={styles}
                  />
                ) : null}
                <HeaderFact
                  label={labels.race}
                  value={[data.race, data.subrace].filter(Boolean).join(" ")}
                  maxChars={34}
                  styles={styles}
                  style={data.isPlayer ? styles.headerFact : undefined}
                />
              </View>
              <View style={styles.headerColumn}>
                <HeaderFact
                  label={labels.background}
                  value={data.backgroundOrSubtype}
                  maxChars={40}
                  styles={styles}
                />
                <HeaderFact
                  label={labels.alignment}
                  value={data.alignment}
                  maxChars={22}
                  styles={styles}
                  style={styles.headerFact}
                />
              </View>
            </View>
            {data.qrCodeDataUrl ? (
              // Clicking the QR code opens the same character page its scan leads to.
              <Link
                src={data.characterPageUrl}
                style={styles.qrLink}>
                <Image
                  src={data.qrCodeDataUrl}
                  style={styles.qrCode}
                />
              </Link>
            ) : null}
          </View>
        </View>

        <View style={[styles.bodyGrid, { height: getPageOneBodyHeight(headerRowHeight) }]}>
          <View style={styles.colLeftRegion}>
            <View style={styles.leftTopRow}>
              <View style={styles.colAbilities}>
                {data.abilities.map((ab) => (
                  <View
                    key={ab.abbr}
                    style={[styles.tile, styles.scoreCard]}>
                    <Text style={styles.scoreLabel}>{ab.name}</Text>
                    <Text style={styles.scoreMod}>{ab.modifier}</Text>
                    <Text style={styles.scoreValue}>{ab.score}</Text>
                  </View>
                ))}
                <View style={[styles.tile, styles.scoreCard]}>
                  <Text style={[styles.scoreLabel, { color: t.blue }]}>{labels.passivePerception}</Text>
                  <Text style={styles.scoreMod}>{data.passivePerception}</Text>
                </View>
              </View>

              <View style={styles.colSkills}>
                <View style={styles.statPill}>
                  <View style={styles.inlineStatRow}>
                    <Text style={styles.statPillLabel}>{labels.inspiration}</Text>
                    <View style={styles.checkbox} />
                  </View>
                </View>
                <View style={styles.statPill}>
                  <View style={styles.inlineStatRow}>
                    <Text style={styles.statPillLabel}>{labels.proficiencyBonus}</Text>
                    <Text style={styles.statPillValue}>{data.proficiencyBonus}</Text>
                  </View>
                </View>

                <SectionCard
                  title={labels.savingThrows}
                  color={t.blue}
                  styles={styles}>
                  <View style={styles.savingThrowsGrid}>
                    {data.savingThrows.map((st) => (
                      <View
                        key={st.abbr}
                        style={styles.savingThrowCell}>
                        <View style={styles.savingThrowTopRow}>
                          <Text style={styles.savingThrowAbbr}>{st.abbr}</Text>
                          <MasteryIcon
                            level={st.masteryLevel}
                            theme={theme}
                            t={t}
                            styles={styles}
                          />
                        </View>
                        <Text style={[styles.savingThrowBonus, st.proficient ? styles.proficient : {}]}>
                          {st.bonus}
                        </Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>

                <SectionCard
                  title={labels.skills}
                  color={t.blue}
                  styles={styles}
                  style={styles.lastRowNoMargin}>
                  {chunk(data.skills, 2).map((pair) => (
                    <View
                      key={pair.map((skill) => skill.key).join("-")}
                      style={styles.skillsRow}>
                      {pair.map((skill) => (
                        <SkillCell
                          key={skill.key}
                          skill={skill}
                          theme={theme}
                          t={t}
                          styles={styles}
                        />
                      ))}
                      {pair.length === 1 ? <View style={styles.skillCell} /> : null}
                    </View>
                  ))}
                </SectionCard>
              </View>
            </View>

            <SectionCard
              title={labels.proficienciesAndLanguages}
              color={t.blue}
              styles={styles}
              style={styles.proficienciesCard}
              breakable>
              {[
                { label: labels.languages, value: data.languages },
                { label: labels.senses, value: data.senses },
                { label: labels.tools, value: data.tools },
                { label: labels.weapons, value: data.weapons },
                { label: labels.armors, value: data.armors },
              ].map((entry, index, arr) => (
                <View
                  key={entry.label}
                  style={[styles.profRow, index === arr.length - 1 ? styles.lastRowNoMargin : {}]}>
                  <Text style={styles.profLabel}>{entry.label}</Text>
                  <Text style={styles.profValue}>{clampText(entry.value, 220)}</Text>
                </View>
              ))}
            </SectionCard>
          </View>

          <View style={styles.colCombat}>
            <View style={styles.combatStatsRow}>
              {[
                { label: labels.armorClass, value: data.armorClass },
                { label: labels.initiativeShort, value: data.initiative },
                { label: labels.speedShort, value: clampText(data.speed, 14) },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={[styles.tile, styles.statTile]}>
                  <Text style={styles.statTileLabel}>{stat.label}</Text>
                  <Text style={styles.statTileValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <SectionCard
              title={labels.hitPoints}
              color={t.red}
              styles={styles}>
              <FieldRow
                label={labels.maxHp}
                value={data.maxHp}
                styles={styles}
              />
              <WriteInField
                label={labels.currentHp}
                styles={styles}
              />
              <WriteInField
                label={labels.tempHp}
                styles={styles}
              />
              {data.isPlayer ? (
                <>
                  <WriteInField
                    label={labels.hitDiceRemaining}
                    styles={styles}
                  />
                  <HitDiceBlock
                    label={labels.hitDice}
                    entries={data.hitDiceEntries}
                    styles={styles}
                  />
                  <View style={styles.deathSavesSection}>
                    <Text style={styles.deathSavesHeading}>{labels.deathSaves}</Text>
                    <View style={styles.deathSaveRow}>
                      <Text style={styles.deathSaveLabel}>{labels.successes}</Text>
                      <EmptyDots
                        styles={styles}
                        total={3}
                      />
                    </View>
                    <View style={[styles.deathSaveRow, styles.lastRowNoMargin]}>
                      <Text style={styles.deathSaveLabel}>{labels.failures}</Text>
                      <EmptyDots
                        styles={styles}
                        total={3}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <View style={[styles.hitDiceBlock, styles.lastRowNoMargin]}>
                  <Text style={styles.hitDiceLabel}>{labels.hitPointsRoll}</Text>
                  <Text style={styles.npcHitPointsRoll}>{clampText(data.hitDice, 36)}</Text>
                </View>
              )}
            </SectionCard>

            <SectionCard
              title={labels.attacksAndSpellcasting}
              color={t.red}
              styles={styles}
              style={styles.combatFillCard}>
              <View style={styles.attacksTableHeader}>
                <Text style={styles.attackName}>{labels.attackName}</Text>
                <Text style={styles.attackBonus}>{labels.attackBonusHeader}</Text>
                <Text style={styles.attackDamage}>{labels.attackDamageHeader}</Text>
              </View>
              <View style={styles.attackRows}>
                {attackRows.map((attack, index) => (
                  <AttackRow
                    key={attack ? `${attack.name}-${index}` : `empty-${index}`}
                    attack={attack}
                    styles={styles}
                  />
                ))}
              </View>
            </SectionCard>

            <SectionCard
              title={labels.equipment}
              color={t.yellow}
              styles={styles}
              style={[styles.combatFillCard, styles.lastRowNoMargin]}>
              {(Object.keys(COIN_FILLS) as CoinKey[]).map((key) => (
                <View
                  key={key}
                  style={styles.coinRow}>
                  <Image
                    src={svgDataUrl(coinSvg(COIN_FILLS[key], t.cardBackground))}
                    style={styles.coinIcon}
                  />
                  <Text style={styles.coinText}>
                    {key.toUpperCase()}: {data.currencies[key]}
                  </Text>
                </View>
              ))}
              <Text style={[styles.textBlock, { marginTop: 4 }]}>{equipmentSplit.pageOne || " "}</Text>
            </SectionCard>
          </View>

          <View style={styles.colNarrative}>
            {narrativeCards.map((card) => (
              <SectionCard
                key={card.title}
                title={card.title}
                color={t.green}
                styles={styles}>
                <Text style={styles.textBlock}>{card.text}</Text>
              </SectionCard>
            ))}
            <SectionCard
              title={labels.featuresAndTraits}
              color={t.blue}
              styles={styles}
              style={styles.featuresCard}
              breakable>
              <FeaturesList
                features={featuresPageOne}
                styles={styles}
              />
            </SectionCard>
          </View>
        </View>

        <PageFooter
          labels={labels}
          styles={styles}
        />
      </Page>

      {featuresPageTwo.length > 0 ? (
        <Page
          size="LETTER"
          style={styles.page}
          wrap>
          <SectionCard
            title={labels.featuresAndTraits}
            color={t.blue}
            styles={styles}
            breakable>
            <FeaturesList
              features={featuresPageTwo}
              styles={styles}
            />
          </SectionCard>
          <PageFooter
            labels={labels}
            styles={styles}
          />
        </Page>
      ) : null}

      {/* Biography — always its own page(s), never shared with features continuation */}
      <Page
        size="LETTER"
        style={styles.page}
        wrap>
        {equipmentSplit.pageTwo ? (
          <TextCard
            title={labels.equipmentContinuation}
            color={t.yellow}
            text={equipmentSplit.pageTwo}
            maxChars={Number.MAX_SAFE_INTEGER}
            styles={styles}
            breakable
          />
        ) : null}

        <SectionCard
          title={labels.appearance}
          color={t.green}
          styles={styles}>
          {appearanceRows.map((cells, rowIndex) => (
            <View
              key={`appearance-${rowIndex}`}
              style={styles.factGrid}>
              {cells.map((cell) => (
                <View
                  key={cell.label}
                  style={styles.col}>
                  <Text style={styles.label}>{cell.label}</Text>
                  <Text style={styles.value}>{cell.value || " "}</Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={styles.label}>{labels.appearance}</Text>
          <Text style={styles.textBlock}>{clampText(data.appearance.description, 420)}</Text>
        </SectionCard>

        <View style={styles.row}>
          <TextCard
            title={labels.personalityTraits}
            color={t.green}
            text={data.personalityTraits}
            maxChars={320}
            styles={styles}
            style={styles.col}
          />
          <TextCard
            title={labels.ideals}
            color={t.green}
            text={data.ideals}
            maxChars={320}
            styles={styles}
            style={styles.col}
          />
        </View>
        <View style={styles.row}>
          <TextCard
            title={labels.bonds}
            color={t.green}
            text={data.bonds}
            maxChars={320}
            styles={styles}
            style={styles.col}
          />
          <TextCard
            title={labels.flaws}
            color={t.green}
            text={data.flaws}
            maxChars={320}
            styles={styles}
            style={styles.col}
          />
        </View>

        <TextCard
          title={labels.alliesAndOrganizations}
          color={t.green}
          text={data.alliesAndOrgs}
          maxChars={520}
          styles={styles}
          breakable
        />
        <TextCard
          title={labels.backstory}
          color={t.green}
          text={data.backstory}
          maxChars={1400}
          styles={styles}
          breakable
        />
        <SectionCard
          title={labels.treasure}
          color={t.yellow}
          styles={styles}
          style={styles.treasureCard}>
          <Text style={styles.textBlock}>{clampText(data.treasureText, 420)}</Text>
          <View style={styles.treasureWriteInSpace} />
        </SectionCard>

        <PageFooter
          labels={labels}
          styles={styles}
        />
      </Page>

      {/* Spellcasting pages: overview sheet, then detail cards capped at half a page each */}
      {spellPages.map((pageDescriptor) => {
        const block = data.spellcastingBlocks[pageDescriptor.blockIndex];
        if (!block) return null;

        if (pageDescriptor.kind === "overview") {
          return (
            <Page
              key={`spell-overview-${pageDescriptor.blockIndex}`}
              size="LETTER"
              style={[styles.page, styles.spellOverviewPage]}
              wrap={false}>
              <SpellOverviewPage
                block={block}
                labels={labels}
                styles={styles}
                showPreparedMarks={data.isPlayer && !block.isInnate}
              />
              <PageFooter
                labels={labels}
                styles={styles}
              />
            </Page>
          );
        }

        if (!pageDescriptor.spells?.length) return null;
        return (
          <Page
            key={`spell-details-${pageDescriptor.blockIndex}`}
            size="LETTER"
            style={styles.page}
            wrap>
            <SpellDetailPages
              spells={pageDescriptor.spells}
              block={block}
              labels={labels}
              styles={styles}
            />
            <PageFooter
              labels={labels}
              styles={styles}
            />
          </Page>
        );
      })}
    </Document>
  );
}
