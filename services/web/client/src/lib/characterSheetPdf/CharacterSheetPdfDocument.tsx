/** @see FR-character-sheet-pdf-export */

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import { splitFeaturesForPdfPages } from "@/lib/characterSheetPdf/splitFeaturesForPdfPages";
import {
  PDF_EQUIPMENT_PAGE1_MAX_CHARS,
  splitTextForPdfPages,
} from "@/lib/characterSheetPdf/splitTextForPdfPages";
import { buildLucideSvgDataUrl } from "@/lib/characterSheetPdf/buildLucideSvgString";
import { PDF_SKILL_LUCIDE_NODES } from "@/lib/characterSheetPdf/lucidePdfIconNodes";
import { getMasteryIconSvg } from "@/lib/characterSheetPdf/masteryIconSvg";
import { svgDataUrl } from "@/lib/characterSheetPdf/svgDataUrl";
import {
  buildSpellPdfPages,
  computeSpellOverviewDensity,
  getLevelGroupForOverview,
  getSpellLevelGroups,
  getSpellOverviewColumnLevels,
  getSpellOverviewDisplaySpells,
  getSpellOverviewLineCount,
  truncateSpellDescription,
  PDF_SPELL_COMPACT_DESCRIPTION_MAX_CHARS,
} from "@/lib/characterSheetPdf/buildSpellPdfPages";
import type { SpellOverviewDensity } from "@/lib/characterSheetPdf/buildSpellPdfPages";
import type { CharacterSheetPdfData, CharacterSheetPdfLabels, CharacterSheetPdfTheme, PdfAbilityFeature, PdfClassEntry, PdfHitDiceEntry, PdfSpellLevelGroup, PdfSpellRow, PdfSpellcastingBlock } from "@/lib/characterSheetPdf/types";

Font.registerHyphenationCallback((word) => [word]);

/** Fixed header height (4:5 avatar 48×60 pt) — grows only for dense multiclass stacks. */
const PDF_HEADER_ROW_HEIGHT = 60;
const PDF_HEADER_MULTICLASS_INLINE_THRESHOLD = 4;
const PDF_HEADER_MULTICLASS_EXTRA_HEIGHT = 11;
const PDF_HEADER_AVATAR_WIDTH = 48;

/** LETTER page height in points; forces the spell overview page to span a full page (wrap=false won't grow it on its own). */
const PDF_LETTER_PAGE_HEIGHT = 792;

function getHeaderRowHeight(classCount: number): number {
  if (classCount <= PDF_HEADER_MULTICLASS_INLINE_THRESHOLD) return PDF_HEADER_ROW_HEIGHT;
  return (
    PDF_HEADER_ROW_HEIGHT +
    (classCount - PDF_HEADER_MULTICLASS_INLINE_THRESHOLD) * PDF_HEADER_MULTICLASS_EXTRA_HEIGHT
  );
}

function createStyles(theme: CharacterSheetPdfTheme) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];
  return StyleSheet.create({
    page: {
      backgroundColor: t.pageBackground,
      color: t.text,
      padding: 24,
      fontSize: 8.4,
      fontFamily: "Helvetica",
    },
    spellOverviewPage: {
      minHeight: PDF_LETTER_PAGE_HEIGHT,
      paddingHorizontal: 18,
    },
    footer: {
      position: "absolute",
      bottom: 16,
      left: 24,
      right: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 6,
    },
    footerText: { fontSize: 7, color: t.footerText },
    sectionHeader: {
      alignSelf: "flex-start",
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 999,
      marginBottom: 3,
      marginLeft: 8,
    },
    sectionHeaderText: { fontSize: 8.8, fontWeight: "bold", color: t.sectionHeaderText },
    box: {
      backgroundColor: t.cardBackground,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      padding: 10,
      marginBottom: 7,
    },
    lastRowNoMargin: { marginBottom: 0 },
    row: { flexDirection: "row", gap: 7 },
    col: { flex: 1 },
    label: { fontSize: 6.6, color: t.textMuted, marginBottom: 2 },
    value: { fontSize: 8.8, fontWeight: "bold", lineHeight: 1.25 },
    valueSub: { fontSize: 8.8, fontWeight: "normal", color: t.textMuted },
    fieldRow: { flexDirection: "row", marginBottom: 4, gap: 4 },
    fieldLabel: { fontSize: 7.5, color: t.textMuted, width: 74 },
    fieldValue: { fontSize: 8.8, flex: 1 },
    abilityBox: {
      backgroundColor: t.cardBackground,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      padding: 4,
      alignItems: "center",
      marginBottom: 4,
      width: 52,
    },
    abilityAbbr: { fontSize: 7, color: t.textMuted },
    abilityScore: { fontSize: 12, fontWeight: "bold" },
    abilityMod: { fontSize: 8 },
    skillRow: { flexDirection: "row", alignItems: "center", paddingVertical: 2, gap: 4 },
    skillNameBlock: { flex: 1, minWidth: 0 },
    skillName: { fontSize: 7.2, lineHeight: 1.2 },
    skillAbilityName: { fontSize: 6.2, color: t.textMuted, lineHeight: 1.2, marginTop: 1 },
    skillBonus: { fontSize: 7.5, fontWeight: "bold", width: 20, textAlign: "right" },
    skillIconWrap: { width: 12, height: 12, flexShrink: 0 },
    masteryIcon: { width: 12, height: 12, flexShrink: 0 },
    skillsGrid: { flexDirection: "row", flexWrap: "wrap" },
    skillCell: { width: "50%", paddingRight: 5, marginBottom: 2 },
    savingThrowsGrid: { flexDirection: "row", flexWrap: "wrap" },
    savingThrowCell: { width: "33.33%", alignItems: "center", paddingVertical: 4 },
    savingThrowAbbr: { fontSize: 6.2, fontWeight: "bold", textTransform: "uppercase", color: t.textMuted },
    savingThrowBonus: { fontSize: 10, fontWeight: "bold", marginTop: 2 },
    savingThrowTopRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 1 },
    proficient: { fontStyle: "italic" },
    tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 2, marginBottom: 2 },
    tableRow: { flexDirection: "row", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: t.border },
    tableCell: { fontSize: 7.6 },
    textBlock: { fontSize: 7.5, lineHeight: 1.45 },
    headerAvatar: {
      width: PDF_HEADER_AVATAR_WIDTH,
      height: PDF_HEADER_ROW_HEIGHT,
      objectFit: "cover",
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    qrCode: { width: 42, height: 42, objectFit: "contain" },
    valueWithIcon: { flexDirection: "row", alignItems: "center", gap: 3 },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 5,
      paddingVertical: 1,
      marginRight: 4,
      marginBottom: 3,
      backgroundColor: t.pageBackground,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap" },
    pageOneHeader: {
      borderWidth: 1.2,
      borderColor: t.border,
      borderRadius: 15,
      marginBottom: 6,
      backgroundColor: t.cardBackground,
      overflow: "hidden",
    },
    headerRow: {
      flexDirection: "row",
      height: PDF_HEADER_ROW_HEIGHT,
      alignItems: "center",
    },
    headerAvatarColumn: {
      width: PDF_HEADER_AVATAR_WIDTH,
      height: PDF_HEADER_ROW_HEIGHT,
      flexShrink: 0,
    },
    headerQrColumn: {
      width: 52,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      paddingHorizontal: 4,
    },
    headerMainColumn: { flex: 1, justifyContent: "center", paddingHorizontal: 6, minWidth: 0 },
    headerMainRow: { flexDirection: "row", gap: 4, alignItems: "center" },
    headerIdentity: {
      flexShrink: 0,
      maxWidth: 128,
      paddingRight: 2,
      justifyContent: "center",
    },
    charName: { fontSize: 15, fontWeight: "bold", lineHeight: 1.15 },
    headerRaceSub: { fontSize: 9, color: t.textMuted, marginTop: 2, lineHeight: 1.2 },
    headerInfoGrid: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", minWidth: 0 },
    headerInfoItem: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 2,
      justifyContent: "center",
    },
    headerStackItem: { justifyContent: "center" },
    headerStackDivider: { marginTop: 5 },
    headerValueNormal: { fontSize: 8.8, fontWeight: "normal", lineHeight: 1.25 },
    bodyGrid: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
    colLeftRegion: { width: "51%", flexDirection: "column" },
    leftTopRow: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
    colAbilities: { width: "23%", flexDirection: "column" },
    passivePerceptionWide: { marginTop: 8 },
    colSkills: { flex: 1 },
    colCombat: { width: "26%" },
    colNarrative: { width: "23%" },
    scoreCard: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      backgroundColor: t.cardBackground,
      marginBottom: 4,
    },
    scoreLabel: { fontSize: 6.2, fontWeight: "bold", textTransform: "uppercase" },
    scoreValue: { fontSize: 7.5, color: t.textMuted, marginTop: 2 },
    scoreMod: { fontSize: 13, fontWeight: "bold", marginTop: 1 },
    smallPill: { borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: t.cardBackground, marginBottom: 5 },
    smallPillLarge: { minHeight: 34, justifyContent: "center" },
    inlineStatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    smallPillLabel: { fontSize: 6.8, color: t.textMuted, textTransform: "uppercase" },
    smallPillValue: { fontSize: 8.8, fontWeight: "bold" },
    checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: t.textMuted, borderRadius: 2, alignItems: "center", justifyContent: "center" },
    checkboxInner: { width: 6, height: 6, borderRadius: 1, backgroundColor: t.text },
    statLineBox: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 15, paddingHorizontal: 4, paddingVertical: 3, backgroundColor: t.cardBackground, alignItems: "center", justifyContent: "center", gap: 1, minWidth: 0 },
    statLineLabel: { fontSize: 6, color: t.textMuted, textTransform: "uppercase", textAlign: "center" },
    statLineValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "flex-end" },
    dot: { width: 10, height: 10, borderRadius: 999, borderWidth: 1, borderColor: t.textMuted },
    deathSavesSection: {
      marginTop: 8,
      paddingTop: 8,
      paddingHorizontal: 6,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    deathSavesTitle: { fontSize: 7.5, fontWeight: "bold", color: t.textMuted, marginBottom: 6 },
    deathSaveRow: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 6 },
    deathSaveLabel: { fontSize: 7.5, fontWeight: "bold", width: 44 },
    attacksTableHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      paddingBottom: 2,
      marginBottom: 2,
      gap: 3,
    },
    attackName: { flex: 2.4, fontSize: 6.5, fontWeight: "bold", color: t.textMuted },
    attackBonus: { flex: 0.75, fontSize: 6.5, fontWeight: "bold", color: t.textMuted, textAlign: "center" },
    attackDamage: { flex: 1.55, fontSize: 6.5, fontWeight: "bold", color: t.textMuted, textAlign: "right" },
    attackRow: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: t.border, paddingVertical: 2.5, gap: 3 },
    attackCellName: { flex: 2.4, fontSize: 7.2 },
    attackCellBonus: { flex: 0.75, fontSize: 7.2, textAlign: "center" },
    attackCellDamage: { flex: 1.55, fontSize: 7.2, textAlign: "right" },
    coinRow: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 4 },
    coinIcon: { width: 10, height: 9 },
    coinText: { fontSize: 7.3, fontWeight: "bold" },
    largeNarrativeBox: { minHeight: 150 },
    featureItem: { marginBottom: 6 },
    featureName: { fontSize: 8, fontWeight: "bold", marginBottom: 1.5 },
    featureDescription: { fontSize: 7.2, lineHeight: 1.4, color: t.text },
    equipmentBox: { minHeight: 120 },
    proficienciesBoxWide: { minHeight: 90, marginBottom: 0 },
    profRow: { flexDirection: "row", marginBottom: 3, gap: 6 },
    profLabel: { fontSize: 7, fontWeight: "bold", color: t.textMuted, width: 54, flexShrink: 0 },
    profValue: { fontSize: 7.5, flex: 1, lineHeight: 1.35 },
    multiclassLine: { fontSize: 7.6, fontWeight: "bold", lineHeight: 1.25 },
    multiclassSubclass: { fontSize: 6.8, fontWeight: "normal", color: t.textMuted },
    hitDiceBlock: { marginBottom: 4 },
    hitDiceChips: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
    hitDiceChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: t.pageBackground,
    },
    hitDiceChipClass: { fontSize: 6.6, color: t.textMuted },
    hitDiceChipValue: { fontSize: 7.8, fontWeight: "bold" },
    spellStatsRow: { flexDirection: "row", gap: 7, marginBottom: 8 },
    spellStatBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: t.cardBackground,
    },
    slotGrid: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      padding: 8,
      backgroundColor: t.cardBackground,
      marginBottom: 8,
    },
    slotGridHeaderRow: { flexDirection: "row", marginBottom: 3 },
    slotGridLabelCell: { width: 52, fontSize: 6.8, fontWeight: "bold", color: t.textMuted },
    slotGridLevelCell: { flex: 1, fontSize: 6.8, fontWeight: "bold", color: t.textMuted, textAlign: "center" },
    slotGridValueRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    slotGridValueCell: { flex: 1, fontSize: 7.8, fontWeight: "bold", textAlign: "center" },
    spellListItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginRight: 4,
      marginBottom: 4,
      backgroundColor: t.pageBackground,
    },
    spellPreparedMark: { width: 8, height: 8, borderRadius: 999, borderWidth: 1, borderColor: t.textMuted },
    spellPreparedMarkFilled: { backgroundColor: t.green, borderColor: t.green },
    spellListName: { fontSize: 7.4, fontWeight: "bold" },
    spellListWrap: { flexDirection: "row", flexWrap: "wrap" },
    spellTitleCard: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: t.cardBackground,
      marginBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    spellTitleText: { fontSize: 12, fontWeight: "bold", flex: 1 },
    spellPreparedBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 6.8,
      fontWeight: "bold",
    },
    spellPreparedBadgeOn: { backgroundColor: t.green, borderColor: t.green, color: t.sectionHeaderText },
    spellPreparedBadgeOff: { borderColor: t.border, color: t.textMuted, backgroundColor: t.pageBackground },
    spellMetaWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 },
    spellMetaCard: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 8,
      backgroundColor: t.cardBackground,
      minWidth: "31%",
      flexGrow: 1,
    },
    spellMetaCardWide: { width: "100%", flexGrow: 0 },
    spellMetaLabel: { fontSize: 6.4, fontWeight: "bold", color: t.textMuted, marginBottom: 2 },
    spellMetaValue: { fontSize: 7.4, lineHeight: 1.35 },
    spellDescriptionBox: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      padding: 8,
      backgroundColor: t.cardBackground,
    },
    spellOverviewHeader: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      backgroundColor: t.cardBackground,
      marginBottom: 4,
      overflow: "hidden",
    },
    spellOverviewHeaderTop: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    spellOverviewClassCell: {
      flex: 1.2,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRightWidth: 1,
      borderRightColor: t.border,
    },
    spellOverviewStatCell: {
      flex: 1,
      paddingVertical: 4,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: 1,
      borderRightColor: t.border,
    },
    spellOverviewStatCellLast: { borderRightWidth: 0 },
    spellOverviewStatLabel: {
      fontSize: 5.4,
      fontWeight: "bold",
      color: t.textMuted,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 1,
    },
    spellOverviewStatValue: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
    spellOverviewColumns: { flexDirection: "row", gap: 5, alignItems: "flex-start" },
    spellOverviewColumn: { flex: 1, minWidth: 0 },
    spellLevelSection: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 6,
      backgroundColor: t.cardBackground,
      marginBottom: 1,
    },
    spellLevelHeader: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.pageBackground,
    },
    spellLevelBadge: {
      width: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.pink,
      paddingVertical: 1,
    },
    spellLevelBadgeText: { fontSize: 7.5, fontWeight: "bold", color: t.sectionHeaderText },
    spellLevelTitleBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 5,
      paddingVertical: 2,
      gap: 4,
      minWidth: 0,
    },
    spellLevelTitleText: {
      fontSize: 6,
      fontWeight: "bold",
      color: t.textMuted,
      textTransform: "uppercase",
      flex: 1,
      minWidth: 0,
    },
    spellLevelHeaderSlots: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
    spellLevelSlotInline: { flexDirection: "row", alignItems: "center", gap: 2 },
    spellLevelSlotLabel: { fontSize: 5.4, color: t.textMuted, textTransform: "uppercase" },
    spellLevelSlotValue: {
      fontSize: 7.2,
      fontWeight: "bold",
      minWidth: 12,
      textAlign: "center",
    },
    spellLevelSlotUsedSpace: {
      minWidth: 16,
      height: 10,
    },
    spellOverviewLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingVertical: 0.5,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: t.border,
      minHeight: 8,
    },
    spellOverviewLineLast: { borderBottomWidth: 0 },
    spellOverviewCheckbox: {
      width: 7,
      height: 7,
      borderWidth: 1,
      borderColor: t.textMuted,
      borderRadius: 1,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    spellOverviewCheckboxFilled: { backgroundColor: t.pink, borderColor: t.pink },
    spellOverviewSpellName: { fontSize: 6.8, flex: 1, lineHeight: 1.15 },
    spellOverviewEmptyLine: {
      paddingVertical: 0.5,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: t.border,
      minHeight: 8,
    },
    spellDetailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    spellCompactCard: {
      width: "48.5%",
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 15,
      padding: 10,
      backgroundColor: t.cardBackground,
    },
    spellCompactTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      marginBottom: 6,
    },
    spellCompactTitle: { fontSize: 11, fontWeight: "bold", flex: 1 },
    spellCompactLevel: { fontSize: 8, color: t.textMuted, fontWeight: "bold" },
    spellCompactMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
    spellCompactMetaChip: {
      fontSize: 7.2,
      color: t.textMuted,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor: t.pageBackground,
    },
    spellCompactDescription: { fontSize: 8.4, lineHeight: 1.45, color: t.text },
    spellCompactDescriptionBox: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 6,
      marginTop: 4,
    },
    spellCompactDescriptionLabel: {
      fontSize: 7,
      fontWeight: "bold",
      color: t.textMuted,
      marginBottom: 4,
      textTransform: "uppercase",
    },
  });
}

function clampText(value: string, max: number): string {
  if (!value) return " ";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

const COIN_SVGS = {
  cp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#A45918"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#A45918" stroke="#19191C" stroke-width="2"/></svg>`,
  sp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#BDBDBD"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#BDBDBD" stroke="#19191C" stroke-width="2"/></svg>`,
  ep: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#7F8F9E"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#7F8F9E" stroke="#19191C" stroke-width="2"/></svg>`,
  gp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#FFC400"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#FFC400" stroke="#19191C" stroke-width="2"/></svg>`,
  pp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#BEBAA3"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#BEBAA3" stroke="#19191C" stroke-width="2"/></svg>`,
};

interface PageFooterProps {
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
  styles: ReturnType<typeof createStyles>;
}

function PageFooter({ labels, theme, styles }: PageFooterProps) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{labels.appName}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          labels.pageOf
            .replace("{page}", String(pageNumber))
            .replace("{total}", String(totalPages))
        }
      />
      <Text style={[styles.footerText, { color: t.purple }]}>chariot.tools</Text>
    </View>
  );
}

function SectionHeader({
  title,
  color,
  styles,
  topSpacing = 0,
}: {
  title: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
  topSpacing?: number;
}) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: color }, topSpacing > 0 ? { marginTop: topSpacing } : {}]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function SectionBlock({
  title,
  color,
  styles,
  topSpacing = 0,
  children,
}: {
  title: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
  topSpacing?: number;
  children: React.ReactNode;
}) {
  return (
    <View wrap={false}>
      <SectionHeader title={title} color={color} styles={styles} topSpacing={topSpacing} />
      {children}
    </View>
  );
}

function ClassHeaderValue({
  entries,
  classPrimary,
  subclassPrimary,
  styles,
}: {
  entries: PdfClassEntry[];
  classPrimary: string;
  subclassPrimary: string;
  styles: ReturnType<typeof createStyles>;
}) {
  if (entries.length <= 1) {
    return (
      <HeaderValueWithSubtext
        primary={classPrimary || " "}
        secondary={subclassPrimary}
        primaryMax={24}
        styles={styles}
      />
    );
  }

  return (
    <View>
      {entries.map((entry, index) => (
        <Text
          key={`${entry.name}-${entry.level}-${index}`}
          style={[styles.multiclassLine, index > 0 ? { marginTop: 1.5 } : {}]}
        >
          {entry.label.trim() || " "}
          {entry.subclass ? (
            <Text style={styles.multiclassSubclass}> · {entry.subclass.trim()}</Text>
          ) : null}
        </Text>
      ))}
    </View>
  );
}

function HitDiceRow({
  label,
  entries,
  fallback,
  styles,
  isLast = false,
}: {
  label: string;
  entries: PdfHitDiceEntry[];
  fallback: string;
  styles: ReturnType<typeof createStyles>;
  isLast?: boolean;
}) {
  if (entries.length <= 1) {
    return (
      <View style={[styles.fieldRow, isLast ? styles.lastRowNoMargin : {}]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{clampText(fallback, 36)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.hitDiceBlock, isLast ? styles.lastRowNoMargin : {}]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.hitDiceChips}>
        {entries.map((entry, index) => (
          <View key={`${entry.className}-${entry.notation}-${index}`} style={styles.hitDiceChip}>
            <Text style={styles.hitDiceChipClass}>{clampText(entry.className, 14)}</Text>
            <Text style={styles.hitDiceChipValue}>{entry.notation}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HeaderValueWithSubtext({
  primary,
  secondary,
  primaryMax,
  styles,
}: {
  primary: string;
  secondary: string;
  primaryMax: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const primaryText = clampText(primary, primaryMax);
  const secondaryText = secondary.trim();

  return (
    <Text style={styles.value}>
      {primaryText}
      {secondaryText ? <Text style={styles.valueSub}> ({secondaryText})</Text> : null}
    </Text>
  );
}

function Dots({
  styles,
  filled,
  total,
  fillColor,
}: {
  styles: ReturnType<typeof createStyles>;
  filled: number;
  total: number;
  fillColor: string;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={`dot-${i}`}
          style={[
            styles.dot,
            i < filled ? { backgroundColor: fillColor, borderColor: fillColor } : {},
          ]}
        />
      ))}
    </View>
  );
}

function FeaturesList({
  features,
  styles,
}: {
  features: PdfAbilityFeature[];
  styles: ReturnType<typeof createStyles>;
}) {
  if (features.length === 0) {
    return <Text style={styles.textBlock}> </Text>;
  }

  return (
    <>
      {features.map((feature, index) => (
        <View
          key={`${feature.name}-${index}`}
          wrap={false}
          style={[styles.featureItem, index === features.length - 1 ? styles.lastRowNoMargin : {}]}
        >
          <Text style={styles.featureName}>{feature.name.trim() || " "}</Text>
          {feature.description.trim() ? (
            <Text style={styles.featureDescription}>{feature.description.trim()}</Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

function countPreparedSpells(block: PdfSpellcastingBlock): number {
  return Object.values(block.spellsByLevel)
    .flat()
    .filter((spell) => spell.prepared)
    .length;
}

function formatSlotTotal(slots: { used: number; total: number } | null | undefined): string {
  if (!slots || slots.total <= 0) return " ";
  return String(slots.total);
}

function getSpellOverviewLevelTitle(
  group: PdfSpellLevelGroup,
  labels: CharacterSheetPdfLabels,
): string {
  if (group.level === 0) return labels.spellLevelCantrips;
  return `${labels.spellLevel} ${group.level}`;
}

function SpellOverviewLevelSection({
  group,
  block,
  labels,
  styles,
  showPreparedMarks,
  isLastInColumn,
  density,
}: {
  group: PdfSpellLevelGroup;
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: ReturnType<typeof createStyles>;
  showPreparedMarks: boolean;
  isLastInColumn: boolean;
  density: SpellOverviewDensity;
}) {
  const slots = group.slots;
  const displaySpells = getSpellOverviewDisplaySpells(group);
  const lineCount = getSpellOverviewLineCount(group);
  const emptyLineCount = Math.max(0, lineCount - displaySpells.length);
  const rowStyle = { minHeight: density.rowMinHeight, paddingVertical: density.rowPaddingVertical };
  const spellNameStyle = { fontSize: density.spellNameFontSize, lineHeight: density.spellNameLineHeight };

  return (
    <View
      style={[
        styles.spellLevelSection,
        { marginBottom: density.sectionMarginBottom },
        isLastInColumn ? styles.lastRowNoMargin : {},
      ]}
      wrap={false}
    >
      <View style={[styles.spellLevelHeader, { minHeight: density.levelHeaderMinHeight }]}>
        <View style={styles.spellLevelBadge}>
          <Text style={styles.spellLevelBadgeText}>{group.level === 0 ? "0" : group.level}</Text>
        </View>
        <View style={[styles.spellLevelTitleBar, { paddingVertical: density.levelTitleBarPaddingVertical }]}>
          <Text style={styles.spellLevelTitleText}>{getSpellOverviewLevelTitle(group, labels)}</Text>
          {group.level > 0 && !block.isInnate ? (
            <View style={styles.spellLevelHeaderSlots}>
              <View style={styles.spellLevelSlotInline}>
                <Text style={styles.spellLevelSlotLabel}>{labels.slotsTotal}</Text>
                <Text style={styles.spellLevelSlotValue}>{formatSlotTotal(slots)}</Text>
              </View>
              <View style={styles.spellLevelSlotInline}>
                <Text style={styles.spellLevelSlotLabel}>{labels.slotsUsed}</Text>
                <View style={styles.spellLevelSlotUsedSpace} />
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {displaySpells.map((spell, index) => (
        <View
          key={`${spell.name}-${index}`}
          style={[
            styles.spellOverviewLine,
            rowStyle,
            index === displaySpells.length - 1 && emptyLineCount === 0 ? styles.spellOverviewLineLast : {},
          ]}
        >
          {showPreparedMarks && group.level > 0 ? (
            <View style={[styles.spellOverviewCheckbox, spell.prepared ? styles.spellOverviewCheckboxFilled : {}]} />
          ) : (
            <View style={{ width: 7 }} />
          )}
          <Text style={[styles.spellOverviewSpellName, spellNameStyle]}>{clampText(spell.name, 36)}</Text>
        </View>
      ))}

      {Array.from({ length: emptyLineCount }).map((_, index) => (
        <View
          key={`empty-${group.level}-${index}`}
          style={[
            styles.spellOverviewEmptyLine,
            rowStyle,
            index === emptyLineCount - 1 ? styles.spellOverviewLineLast : {},
          ]}
        />
      ))}
    </View>
  );
}

function SpellOverviewInnateGroup({
  group,
  labels,
  styles,
  isLast,
  density,
}: {
  group: PdfSpellLevelGroup;
  labels: CharacterSheetPdfLabels;
  styles: ReturnType<typeof createStyles>;
  isLast: boolean;
  density: SpellOverviewDensity;
}) {
  const title =
    group.usesPerDay === null
      ? labels.npcAtWill
      : labels.npcUsesPerDay.replace("{count}", String(group.usesPerDay));
  const rowStyle = { minHeight: density.rowMinHeight, paddingVertical: density.rowPaddingVertical };
  const spellNameStyle = { fontSize: density.spellNameFontSize, lineHeight: density.spellNameLineHeight };

  return (
    <View
      style={[
        styles.spellLevelSection,
        { marginBottom: density.sectionMarginBottom },
        isLast ? styles.lastRowNoMargin : {},
      ]}
      wrap={false}
    >
      <View style={[styles.spellLevelHeader, { minHeight: density.levelHeaderMinHeight }]}>
        <View style={styles.spellLevelBadge}>
          <Text style={styles.spellLevelBadgeText}>★</Text>
        </View>
        <View style={[styles.spellLevelTitleBar, { paddingVertical: density.levelTitleBarPaddingVertical }]}>
          <Text style={styles.spellLevelTitleText}>{title}</Text>
        </View>
      </View>
      {group.spells.map((spell, index) => (
        <View
          key={`${spell.name}-${index}`}
          style={[
            styles.spellOverviewLine,
            rowStyle,
            index === group.spells.length - 1 ? styles.spellOverviewLineLast : {},
          ]}
        >
          <View style={{ width: 8 }} />
          <Text style={[styles.spellOverviewSpellName, spellNameStyle]}>{clampText(spell.name, 36)}</Text>
        </View>
      ))}

      {Array.from({
        length: Math.max(0, getSpellOverviewLineCount(group) - group.spells.length),
      }).map((_, index) => (
        <View
          key={`innate-empty-${index}`}
          style={[
            styles.spellOverviewEmptyLine,
            rowStyle,
            index === getSpellOverviewLineCount(group) - group.spells.length - 1
              ? styles.spellOverviewLineLast
              : {},
          ]}
        />
      ))}
    </View>
  );
}

function SpellOverviewPage({
  block,
  labels,
  styles,
  showPreparedMarks,
  density,
}: {
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: ReturnType<typeof createStyles>;
  showPreparedMarks: boolean;
  density: SpellOverviewDensity;
}) {
  const levelGroups = getSpellLevelGroups(block);
  const preparedCount = countPreparedSpells(block);
  const statLabelStyle = { fontSize: density.statLabelFontSize, marginBottom: density.statLabelMarginBottom };
  const statValueStyle = { fontSize: density.statValueFontSize };
  const headerCellStyle = { paddingVertical: density.headerCellPaddingVertical };

  return (
    <>
      <View style={[styles.spellOverviewHeader, { marginBottom: density.headerBlockMarginBottom }]} wrap={false}>
        <View style={styles.spellOverviewHeaderTop}>
          <View style={[styles.spellOverviewClassCell, headerCellStyle]}>
            <Text style={[styles.spellOverviewStatLabel, statLabelStyle]}>{labels.spellcastingClass}</Text>
            <Text style={[styles.spellOverviewStatValue, statValueStyle]}>{block.className || " "}</Text>
          </View>
          <View style={[styles.spellOverviewClassCell, headerCellStyle]}>
            <Text style={[styles.spellOverviewStatLabel, statLabelStyle]}>{labels.spellcastingAbility}</Text>
            <Text style={[styles.spellOverviewStatValue, statValueStyle]}>{block.ability || " "}</Text>
          </View>
          {!block.isInnate ? (
            <View style={[styles.spellOverviewStatCell, headerCellStyle]}>
              <Text style={[styles.spellOverviewStatLabel, statLabelStyle]}>{labels.preparedSpells}</Text>
              <Text style={[styles.spellOverviewStatValue, statValueStyle]}>{preparedCount}</Text>
            </View>
          ) : null}
          <View style={[styles.spellOverviewStatCell, headerCellStyle]}>
            <Text style={[styles.spellOverviewStatLabel, statLabelStyle]}>{labels.spellSaveDc}</Text>
            <Text style={[styles.spellOverviewStatValue, statValueStyle]}>{block.saveDc || " "}</Text>
          </View>
          <View style={[styles.spellOverviewStatCell, styles.spellOverviewStatCellLast, headerCellStyle]}>
            <Text style={[styles.spellOverviewStatLabel, statLabelStyle]}>{labels.spellAttackBonus}</Text>
            <Text style={[styles.spellOverviewStatValue, statValueStyle]}>{block.attackBonus || " "}</Text>
          </View>
        </View>
      </View>

      {block.isInnate ? (
        <View style={[styles.spellOverviewColumns, { gap: density.columnsGap }]}>
          {levelGroups.map((group, index) => (
            <View key={`innate-${group.usesPerDay ?? "atwill"}-${index}`} style={styles.spellOverviewColumn}>
              <SpellOverviewInnateGroup
                group={group}
                labels={labels}
                styles={styles}
                isLast={index === levelGroups.length - 1}
                density={density}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.spellOverviewColumns, { gap: density.columnsGap }]}>
          {getSpellOverviewColumnLevels().map((columnLevels, columnIndex) => (
            <View key={`spell-col-${columnIndex}`} style={styles.spellOverviewColumn}>
              {columnLevels.map((level, groupIndex) => (
                <SpellOverviewLevelSection
                  key={`level-${level}`}
                  group={getLevelGroupForOverview(block, level, levelGroups)}
                  block={block}
                  labels={labels}
                  styles={styles}
                  showPreparedMarks={showPreparedMarks}
                  isLastInColumn={groupIndex === columnLevels.length - 1}
                  density={density}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function SpellCompactCard({
  spell,
  block,
  labels,
  styles,
}: {
  spell: PdfSpellRow;
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  styles: ReturnType<typeof createStyles>;
}) {
  const levelLabel =
    spell.level === 0 ? labels.spellLevelCantrip : `${labels.spellLevel} ${spell.level}`;
  const metaParts = [
    spell.school,
    spell.castingTime,
    spell.range,
    spell.components,
    spell.duration,
    spell.damage ?? undefined,
    spell.healing ?? undefined,
    spell.effectType === "attack" && block.attackBonus ? block.attackBonus : undefined,
  ].filter(Boolean);

  const description = truncateSpellDescription(spell.description, PDF_SPELL_COMPACT_DESCRIPTION_MAX_CHARS);

  return (
    <View style={styles.spellCompactCard}>
      <View style={styles.spellCompactTitleRow}>
        <Text style={styles.spellCompactTitle}>{clampText(spell.name, 64)}</Text>
        <Text style={styles.spellCompactLevel}>{levelLabel}</Text>
      </View>
      <View style={styles.spellCompactMetaRow}>
        {metaParts.map((part, index) => (
          <Text key={`${part}-${index}`} style={styles.spellCompactMetaChip}>
            {clampText(part ?? "", 40)}
          </Text>
        ))}
      </View>
      <View style={styles.spellCompactDescriptionBox}>
        <Text style={styles.spellCompactDescriptionLabel}>{labels.spellDescription}</Text>
        <Text style={styles.spellCompactDescription}>{description || " "}</Text>
      </View>
    </View>
  );
}

function SpellDetailBatchPage({
  spells,
  block,
  labels,
  styles,
}: {
  spells: PdfSpellRow[];
  block: PdfSpellcastingBlock;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.spellDetailGrid}>
      {spells.map((spell, index) => (
        <SpellCompactCard
          key={`${spell.name}-${index}`}
          spell={spell}
          block={block}
          labels={labels}
          styles={styles}
        />
      ))}
    </View>
  );
}

function SpellDetailContinuationPage({
  spell,
  labels,
  theme,
  styles,
  descriptionText,
}: {
  spell: PdfSpellRow;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
  styles: ReturnType<typeof createStyles>;
  descriptionText: string;
}) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];

  return (
    <>
      <SectionHeader
        title={`${spell.name} — ${labels.spellDescriptionContinuation}`}
        color={t.pink}
        styles={styles}
      />
      <View style={styles.spellDescriptionBox}>
        <Text style={styles.textBlock}>{descriptionText.trim() || " "}</Text>
      </View>
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
  const styles = createStyles(theme);
  const headerRowHeight = getHeaderRowHeight(data.isPlayer ? data.classEntries.length : 1);
  const { pageOne: featuresPageOne, pageTwo: featuresPageTwo } = splitFeaturesForPdfPages(data.features);
  const equipmentSource = data.equipment || data.treasureText;
  const equipmentSplit = splitTextForPdfPages(equipmentSource, PDF_EQUIPMENT_PAGE1_MAX_CHARS);
  const spellPages = data.hasSpellcasting ? buildSpellPdfPages(data.spellcastingBlocks) : [];

  return (
    <Document>
      {/* Core sheet — may span multiple PDF pages when content overflows */}
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.pageOneHeader}>
          <View style={[styles.headerRow, { height: headerRowHeight }]}>
            {data.avatarDataUrl ? (
              <View style={[styles.headerAvatarColumn, { height: headerRowHeight }]}>
                <Image src={data.avatarDataUrl} style={[styles.headerAvatar, { height: headerRowHeight }]} alt="" />
              </View>
            ) : null}
            <View style={[styles.headerMainColumn, { height: headerRowHeight }]}>
              <View style={styles.headerMainRow}>
                <View style={styles.headerIdentity}>
                  <Text style={styles.charName}>{clampText(data.displayName, 34)}</Text>
                  <Text style={styles.headerRaceSub}>
                    {clampText([data.race, data.subrace].filter(Boolean).join(" "), 34) || " "}
                  </Text>
                </View>
                <View style={styles.headerInfoGrid}>
                  <View style={styles.headerInfoItem}>
                    <Text style={styles.label}>{data.isPlayer ? labels.classAndLevel : labels.challengeRating}</Text>
                    {data.isPlayer ? (
                      <ClassHeaderValue
                        entries={data.classEntries}
                        classPrimary={data.classPrimary}
                        subclassPrimary={data.subclassPrimary}
                        styles={styles}
                      />
                    ) : (
                      <Text style={styles.value}>{clampText(data.classOrCr, 26)}</Text>
                    )}
                  </View>
                  <View style={styles.headerInfoItem}>
                    <View style={styles.headerStackItem}>
                      <Text style={styles.label}>{labels.background}</Text>
                      <Text style={styles.headerValueNormal}>{clampText(data.backgroundOrSubtype, 40) || " "}</Text>
                    </View>
                    <View style={[styles.headerStackItem, styles.headerStackDivider]}>
                      <Text style={styles.label}>{labels.alignment}</Text>
                      <Text style={styles.value}>{clampText(data.alignment, 22)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {data.qrCodeDataUrl ? (
              <View style={styles.headerQrColumn}>
                <Image src={data.qrCodeDataUrl} style={styles.qrCode} alt="" />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.bodyGrid}>
          <View style={styles.colLeftRegion}>
            <View style={styles.leftTopRow}>
              <View style={styles.colAbilities}>
                {data.abilities.map((ab) => (
                  <View key={ab.abbr} style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>{ab.name}</Text>
                    <Text style={styles.scoreMod}>{ab.modifier}</Text>
                    <Text style={styles.scoreValue}>{ab.score}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.colSkills}>
                <View style={styles.smallPill}>
              <View style={styles.inlineStatRow}>
                <Text style={styles.smallPillLabel}>{labels.inspiration}</Text>
                <View style={styles.checkbox}>
                  {data.inspiration ? <View style={styles.checkboxInner} /> : null}
                </View>
              </View>
            </View>
            <View style={styles.smallPill}>
              <View style={styles.inlineStatRow}>
                <Text style={styles.smallPillLabel}>{labels.proficiencyBonus}</Text>
                <Text style={styles.smallPillValue}>{data.proficiencyBonus}</Text>
              </View>
            </View>

            <SectionHeader title={labels.savingThrows} color={t.blue} styles={styles} />
            <View style={styles.box}>
              <View style={styles.savingThrowsGrid}>
                {data.savingThrows.map((st) => (
                  <View key={st.abbr} style={styles.savingThrowCell}>
                      <View style={styles.savingThrowTopRow}>
                      <Text style={styles.savingThrowAbbr}>{st.abbr}</Text>
                      <Image
                        src={svgDataUrl(
                          getMasteryIconSvg(st.masteryLevel, "blue", theme, {
                            blue: t.blue,
                            red: t.red,
                            textMuted: t.textMuted,
                          }),
                        )}
                        style={styles.masteryIcon}
                        alt=""
                      />
                    </View>
                    <Text style={[styles.savingThrowBonus, st.proficient ? styles.proficient : {}]}>{st.bonus}</Text>
                  </View>
                ))}
              </View>
            </View>

            <SectionHeader title={labels.skills} color={t.blue} styles={styles} />
            <View style={styles.box}>
              <View style={styles.skillsGrid}>
                {data.skills.map((skill) => {
                  const iconNode = PDF_SKILL_LUCIDE_NODES[skill.key];
                  const iconSrc =
                    skill.iconDataUrl ??
                    (iconNode ? buildLucideSvgDataUrl(iconNode, t.textMuted) : null);

                  return (
                    <View key={skill.key} style={styles.skillCell}>
                      <View style={styles.skillRow}>
                        {iconSrc ? (
                          <Image src={iconSrc} style={styles.skillIconWrap} alt="" />
                        ) : (
                          <View style={styles.skillIconWrap} />
                        )}
                        <View style={styles.skillNameBlock}>
                          <Text style={[styles.skillName, skill.proficient ? styles.proficient : {}]}>
                            {clampText(skill.name, 18)}
                          </Text>
                          <Text style={styles.skillAbilityName}>{clampText(skill.abilityName, 16)}</Text>
                        </View>
                        <View style={styles.valueWithIcon}>
                          <Text style={styles.skillBonus}>{skill.bonus}</Text>
                          <Image
                            src={svgDataUrl(
                              getMasteryIconSvg(skill.masteryLevel, "blue", theme, {
                                blue: t.blue,
                                red: t.red,
                                textMuted: t.textMuted,
                              }),
                            )}
                            style={styles.masteryIcon}
                            alt=""
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
              </View>
            </View>

            <View style={[styles.smallPill, styles.smallPillLarge, styles.passivePerceptionWide]}>
              <View style={styles.inlineStatRow}>
                <Text style={styles.smallPillLabel}>{labels.passivePerception}</Text>
                <Text style={styles.smallPillValue}>{data.passivePerception}</Text>
              </View>
            </View>

            <SectionHeader title={labels.proficienciesAndLanguages} color={t.blue} styles={styles} />
            <View style={[styles.box, styles.proficienciesBoxWide]}>
              {[
                { label: labels.languages, value: data.languages },
                { label: labels.senses, value: data.senses },
                { label: labels.tools, value: data.tools },
                { label: labels.weapons, value: data.weapons },
                { label: labels.armors, value: data.armors },
              ].map((entry, index, arr) => (
                <View
                  key={entry.label}
                  style={[styles.profRow, index === arr.length - 1 ? styles.lastRowNoMargin : {}]}
                >
                  <Text style={styles.profLabel}>{entry.label}</Text>
                  <Text style={styles.profValue}>{clampText(entry.value, 220)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colCombat}>
            <View style={styles.row}>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.armorClass}</Text>
                <Text style={styles.statLineValue}>{data.armorClass}</Text>
              </View>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.initiativeShort}</Text>
                <Text style={styles.statLineValue}>{data.initiative}</Text>
              </View>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.speed}</Text>
                <Text style={styles.statLineValue}>{clampText(data.speed, 14)}</Text>
              </View>
            </View>

            <SectionBlock title={labels.hitPoints} color={t.red} styles={styles} topSpacing={10}>
              <View style={styles.box}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{labels.maxHp}</Text>
                  <Text style={styles.fieldValue}>{data.maxHp}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{labels.currentHp}</Text>
                  <Text style={styles.fieldValue}>{data.currentHp}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{labels.tempHp}</Text>
                  <Text style={styles.fieldValue}>{data.tempHp}</Text>
                </View>
                <HitDiceRow
                  label={data.isPlayer ? labels.hitDice : labels.hitPointsRoll}
                  entries={data.isPlayer ? data.hitDiceEntries : []}
                  fallback={data.hitDice}
                  styles={styles}
                  isLast={!data.isPlayer}
                />
                {data.isPlayer ? (
                  <View style={styles.deathSavesSection}>
                    <Text style={styles.deathSavesTitle}>{labels.deathSaves}</Text>
                    <View style={styles.deathSaveRow}>
                      <Text style={styles.deathSaveLabel}>{labels.successes}</Text>
                      <Dots
                        styles={styles}
                        filled={Math.max(0, Math.min(3, data.deathSaveSuccesses))}
                        total={3}
                        fillColor={t.green}
                      />
                    </View>
                    <View style={[styles.deathSaveRow, styles.lastRowNoMargin]}>
                      <Text style={styles.deathSaveLabel}>{labels.failures}</Text>
                      <Dots
                        styles={styles}
                        filled={Math.max(0, Math.min(3, data.deathSaveFailures))}
                        total={3}
                        fillColor={t.red}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </SectionBlock>

            <SectionBlock title={labels.attacksAndSpellcasting} color={t.red} styles={styles}>
              <View style={styles.box}>
                <View style={styles.attacksTableHeader}>
                  <Text style={styles.attackName}>{labels.attackName}</Text>
                  <Text style={styles.attackBonus}>{labels.attackBonusHeader}</Text>
                  <Text style={styles.attackDamage}>{labels.attackDamageHeader}</Text>
                </View>
                {(data.attacks.length > 0 ? data.attacks : [{ name: " ", bonus: " ", damage: " ", range: " " }]).slice(0, 5).map((atk, i) => (
                  <View key={`${atk.name}-${i}`} style={styles.attackRow}>
                    <Text style={styles.attackCellName}>{clampText(atk.name, 20)}</Text>
                    <Text style={styles.attackCellBonus}>{atk.bonus}</Text>
                    <Text style={styles.attackCellDamage}>{clampText(atk.damage, 24)}</Text>
                  </View>
                ))}
              </View>
            </SectionBlock>

            <SectionBlock title={labels.equipment} color={t.yellow} styles={styles}>
              <View style={[styles.box, styles.equipmentBox]}>
                {(["cp", "sp", "ep", "gp", "pp"] as const).map((key) => (
                  <View key={key} style={styles.coinRow}>
                    <Image src={svgDataUrl(COIN_SVGS[key])} style={styles.coinIcon} alt="" />
                    <Text style={styles.coinText}>
                      {key.toUpperCase()}: {data.currencies[key]}
                    </Text>
                  </View>
                ))}
                <Text style={[styles.textBlock, { marginTop: 4 }]}>{equipmentSplit.pageOne || " "}</Text>
              </View>
            </SectionBlock>
          </View>

          <View style={styles.colNarrative}>
            <SectionBlock title={labels.personalityTraits} color={t.green} styles={styles}>
              <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.personalityTraits, 180)}</Text></View>
            </SectionBlock>
            <SectionBlock title={labels.ideals} color={t.green} styles={styles}>
              <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.ideals, 180)}</Text></View>
            </SectionBlock>
            <SectionBlock title={labels.bonds} color={t.green} styles={styles}>
              <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.bonds, 180)}</Text></View>
            </SectionBlock>
            <SectionBlock title={labels.flaws} color={t.green} styles={styles}>
              <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.flaws, 180)}</Text></View>
            </SectionBlock>
            <SectionHeader title={labels.featuresAndTraits} color={t.blue} styles={styles} />
            <View style={[styles.box, styles.largeNarrativeBox]}>
              <FeaturesList features={featuresPageOne} styles={styles} />
            </View>
          </View>
        </View>

        <PageFooter labels={labels} theme={theme} styles={styles} />
      </Page>

      {featuresPageTwo.length > 0 ? (
        <Page size="LETTER" style={styles.page} wrap>
          <View style={{ marginBottom: 6 }}>
            <View wrap={false}>
              <SectionHeader title={labels.featuresAndTraits} color={t.blue} styles={styles} />
            </View>
            <View style={styles.box}>
              <FeaturesList features={featuresPageTwo} styles={styles} />
            </View>
          </View>
          <PageFooter labels={labels} theme={theme} styles={styles} />
        </Page>
      ) : null}

      {/* Biography — always its own page(s), never shared with features continuation */}
      <Page size="LETTER" style={styles.page} wrap>
        {equipmentSplit.pageTwo ? (
          <View wrap={false} style={{ marginBottom: 6 }}>
            <SectionHeader title={labels.equipmentContinuation} color={t.yellow} styles={styles} />
            <View style={styles.box}>
              <Text style={styles.textBlock}>{equipmentSplit.pageTwo}</Text>
            </View>
          </View>
        ) : null}
        <View style={styles.row}>
          <View style={[styles.col, { flex: 1 }]}>
            <SectionHeader title={labels.appearance} color={t.green} styles={styles} />
            <View style={styles.box}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.age}</Text>
                  <Text style={styles.value}>{data.appearance.age || " "}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.height}</Text>
                  <Text style={styles.value}>{data.appearance.height || " "}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.weight}</Text>
                  <Text style={styles.value}>{data.appearance.weight || " "}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.eyes}</Text>
                  <Text style={styles.value}>{data.appearance.eyes || " "}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.skin}</Text>
                  <Text style={styles.value}>{data.appearance.skin || " "}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>{labels.hair}</Text>
                  <Text style={styles.value}>{data.appearance.hair || " "}</Text>
                </View>
              </View>
              <Text style={[styles.label, { marginTop: 4 }]}>{labels.appearance}</Text>
              <Text style={styles.textBlock}>{clampText(data.appearance.description, 420)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <SectionHeader title={labels.personalityTraits} color={t.green} styles={styles} />
            <View style={styles.box}>
              <Text style={styles.textBlock}>{clampText(data.personalityTraits, 320)}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <SectionHeader title={labels.ideals} color={t.green} styles={styles} />
            <View style={styles.box}>
              <Text style={styles.textBlock}>{clampText(data.ideals, 320)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <SectionHeader title={labels.bonds} color={t.green} styles={styles} />
            <View style={styles.box}>
              <Text style={styles.textBlock}>{clampText(data.bonds, 320)}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <SectionHeader title={labels.flaws} color={t.green} styles={styles} />
            <View style={styles.box}>
              <Text style={styles.textBlock}>{clampText(data.flaws, 320)}</Text>
            </View>
          </View>
        </View>

        <SectionHeader title={labels.alliesAndOrganizations} color={t.green} styles={styles} />
        <View style={styles.box}>
          <Text style={styles.textBlock}>{clampText(data.alliesAndOrgs, 520)}</Text>
        </View>

        <SectionHeader title={labels.backstory} color={t.green} styles={styles} />
        <View style={styles.box}>
          <Text style={styles.textBlock}>{clampText(data.backstory, 1400)}</Text>
        </View>

        <SectionHeader title={labels.treasure} color={t.yellow} styles={styles} />
        <View style={styles.box}>
          <Text style={styles.textBlock}>{clampText(data.treasureText, 420)}</Text>
        </View>

        <PageFooter labels={labels} theme={theme} styles={styles} />
      </Page>

      {/* Spellcasting pages (overview + compact detail batches) */}
      {spellPages.map((pageDescriptor, pageIndex) => {
        const block = data.spellcastingBlocks[pageDescriptor.blockIndex];
        if (!block) return null;

        const showPrepared = data.isPlayer && !block.isInnate;
        const pageKey =
          pageDescriptor.kind === "overview"
            ? `spell-overview-${pageDescriptor.blockIndex}`
            : pageDescriptor.kind === "detailBatch"
              ? `spell-batch-${pageDescriptor.blockIndex}-${pageIndex}-${pageDescriptor.spells?.[0]?.name ?? "empty"}`
              : `spell-cont-${pageDescriptor.blockIndex}-${pageDescriptor.spell?.name ?? pageIndex}-${pageIndex}`;

        const overviewDensity = pageDescriptor.kind === "overview" ? computeSpellOverviewDensity(block) : undefined;

        return (
          <Page
            key={pageKey}
            size="LETTER"
            style={
              overviewDensity
                ? [
                    styles.page,
                    styles.spellOverviewPage,
                    { paddingTop: overviewDensity.pagePaddingVertical, paddingBottom: overviewDensity.pagePaddingVertical },
                  ]
                : styles.page
            }
            wrap={pageDescriptor.kind !== "overview"}
          >
            {pageDescriptor.kind === "overview" && overviewDensity ? (
              <SpellOverviewPage
                block={block}
                labels={labels}
                styles={styles}
                showPreparedMarks={showPrepared}
                density={overviewDensity}
              />
            ) : pageDescriptor.kind === "detailBatch" && pageDescriptor.spells?.length ? (
              <>
                {spellPages[pageIndex - 1]?.kind === "overview" &&
                spellPages[pageIndex - 1]?.blockIndex === pageDescriptor.blockIndex ? (
                  <SectionHeader title={labels.spellsSection} color={t.pink} styles={styles} />
                ) : null}
                <SpellDetailBatchPage
                  spells={pageDescriptor.spells}
                  block={block}
                  labels={labels}
                  theme={theme}
                  styles={styles}
                />
              </>
            ) : pageDescriptor.kind === "detailContinuation" && pageDescriptor.spell ? (
              <SpellDetailContinuationPage
                spell={pageDescriptor.spell}
                labels={labels}
                theme={theme}
                styles={styles}
                descriptionText={pageDescriptor.descriptionText ?? ""}
              />
            ) : null}
            <PageFooter labels={labels} theme={theme} styles={styles} />
          </Page>
        );
      })}
    </Document>
  );
}
