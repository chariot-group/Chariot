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
import type { CharacterSheetPdfData, CharacterSheetPdfLabels, CharacterSheetPdfTheme, PdfAbilityFeature, PdfClassEntry, PdfHitDiceEntry } from "@/lib/characterSheetPdf/types";

Font.registerHyphenationCallback((word) => [word]);

/** Fixed header height (4:5 avatar 48×60 pt) — grows slightly for multiclass rows. */
const PDF_HEADER_ROW_HEIGHT = 60;
const PDF_HEADER_MULTICLASS_EXTRA_HEIGHT = 12;
const PDF_HEADER_AVATAR_WIDTH = 48;

function getHeaderRowHeight(classCount: number): number {
  if (classCount <= 1) return PDF_HEADER_ROW_HEIGHT;
  return PDF_HEADER_ROW_HEIGHT + (classCount - 1) * PDF_HEADER_MULTICLASS_EXTRA_HEIGHT;
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
    qrCode: { width: 48, height: 48, borderRadius: 4 },
    qrHint: { fontSize: 5.5, color: t.textMuted, marginTop: 2, textAlign: "center" },
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
      width: 50,
      height: PDF_HEADER_ROW_HEIGHT,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingRight: 4,
    },
    headerMainColumn: { flex: 1, height: PDF_HEADER_ROW_HEIGHT, justifyContent: "center", paddingHorizontal: 6 },
    headerMainRow: { flexDirection: "row", gap: 5, alignItems: "stretch" },
    headerNameItem: {
      width: "34%",
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 6,
      justifyContent: "center",
    },
    charName: { fontSize: 14.5, fontWeight: "bold", lineHeight: 1.2 },
    headerInfoGrid: { flex: 1, flexDirection: "row", gap: 5, alignItems: "stretch" },
    headerInfoItem: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 5,
      justifyContent: "center",
    },
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
      borderRadius: 13,
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
    statLineBox: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 3, backgroundColor: t.cardBackground, alignItems: "center", justifyContent: "center", gap: 1, minWidth: 0 },
    statLineLabel: { fontSize: 6, color: t.textMuted, textTransform: "uppercase", textAlign: "center" },
    statLineValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "flex-end" },
    dot: { width: 10, height: 10, borderRadius: 999, borderWidth: 1, borderColor: t.textMuted },
    deathSavesSection: {
      marginTop: 8,
      paddingTop: 8,
      paddingBottom: 6,
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
    multiclassSubclass: { fontSize: 6.8, fontWeight: "normal", color: t.textMuted, lineHeight: 1.2 },
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
        primaryMax={16}
        secondaryMax={12}
        styles={styles}
      />
    );
  }

  return (
    <View>
      {entries.map((entry, index) => (
        <View key={`${entry.name}-${entry.level}-${index}`} style={index > 0 ? { marginTop: 2 } : {}}>
          <Text style={styles.multiclassLine}>{clampText(entry.label, 18)}</Text>
          {entry.subclass ? (
            <Text style={styles.multiclassSubclass}>{clampText(entry.subclass, 16)}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function HitDiceRow({
  label,
  entries,
  fallback,
  styles,
}: {
  label: string;
  entries: PdfHitDiceEntry[];
  fallback: string;
  styles: ReturnType<typeof createStyles>;
}) {
  if (entries.length <= 1) {
    return (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{clampText(fallback, 36)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.hitDiceBlock}>
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
  secondaryMax,
  styles,
}: {
  primary: string;
  secondary: string;
  primaryMax: number;
  secondaryMax: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const primaryText = clampText(primary, primaryMax);
  const secondaryText = secondary ? clampText(secondary, secondaryMax) : "";

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
        <View key={`${feature.name}-${index}`} wrap={false} style={styles.featureItem}>
          <Text style={styles.featureName}>{feature.name.trim() || " "}</Text>
          {feature.description.trim() ? (
            <Text style={styles.featureDescription}>{feature.description.trim()}</Text>
          ) : null}
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
  const styles = createStyles(theme);
  const headerRowHeight = getHeaderRowHeight(data.isPlayer ? data.classEntries.length : 1);
  const { pageOne: featuresPageOne, pageTwo: featuresPageTwo } = splitFeaturesForPdfPages(data.features);
  const equipmentSource = data.equipment || data.treasureText;
  const equipmentSplit = splitTextForPdfPages(equipmentSource, PDF_EQUIPMENT_PAGE1_MAX_CHARS);

  return (
    <Document>
      {/* Page 1 — D&D-like core layout */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.pageOneHeader}>
          <View style={[styles.headerRow, { height: headerRowHeight }]}>
            {data.avatarDataUrl ? (
              <View style={[styles.headerAvatarColumn, { height: headerRowHeight }]}>
                <Image src={data.avatarDataUrl} style={[styles.headerAvatar, { height: headerRowHeight }]} alt="" />
              </View>
            ) : null}
            <View style={[styles.headerMainColumn, { height: headerRowHeight }]}>
              <View style={styles.headerMainRow}>
                <View style={styles.headerNameItem}>
                  <Text style={styles.label}>{labels.characterName}</Text>
                  <Text style={styles.charName}>{clampText(data.displayName, 38)}</Text>
                </View>
                <View style={styles.headerInfoGrid}>
                  <View style={styles.headerInfoItem}>
                    <Text style={styles.label}>{data.isPlayer ? labels.race : labels.creatureType}</Text>
                    <HeaderValueWithSubtext
                      primary={data.isPlayer ? data.race : data.race}
                      secondary={data.isPlayer ? data.subrace : data.subrace}
                      primaryMax={16}
                      secondaryMax={12}
                      styles={styles}
                    />
                  </View>
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
                      <Text style={styles.value}>{clampText(data.classOrCr, 24)}</Text>
                    )}
                  </View>
                  <View style={styles.headerInfoItem}>
                    <Text style={styles.label}>{labels.background}</Text>
                    <Text style={styles.value}>{clampText(data.backgroundOrSubtype, 24)}</Text>
                  </View>
                  <View style={styles.headerInfoItem}>
                    <Text style={styles.label}>{labels.alignment}</Text>
                    <Text style={styles.value}>{clampText(data.alignment, 24)}</Text>
                  </View>
                </View>
              </View>
            </View>
            {data.qrCodeDataUrl ? (
              <View style={[styles.headerQrColumn, { height: headerRowHeight }]}>
                <Image src={data.qrCodeDataUrl} style={styles.qrCode} alt="" />
                <Text style={styles.qrHint}>{labels.qrCodeHint}</Text>
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
              ].map((entry) => (
                <View key={entry.label} style={styles.profRow}>
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
                    <View style={styles.deathSaveRow}>
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

      {/* Page 2 — Biography */}
      <Page size="LETTER" style={styles.page}>
        {featuresPageTwo.length > 0 ? (
          <View style={{ marginBottom: 6 }}>
            <View wrap={false}>
              <SectionHeader title={labels.featuresAndTraits} color={t.blue} styles={styles} />
            </View>
            <View style={styles.box}>
              <FeaturesList features={featuresPageTwo} styles={styles} />
            </View>
          </View>
        ) : null}
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

      {/* Page 3 — Spellcasting (conditional) */}
      {data.hasSpellcasting &&
        data.spellcastingBlocks.map((block, blockIndex) => (
          <Page key={`spell-${blockIndex}`} size="LETTER" style={styles.page}>
            <SectionHeader
              title={`${labels.spellcastingClass}: ${block.className}`}
              color={t.pink}
              styles={styles}
            />
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{labels.spellcastingAbility}</Text>
                <Text style={styles.value}>{block.ability || " "}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{labels.spellSaveDc}</Text>
                <Text style={styles.value}>{block.saveDc || " "}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{labels.spellAttackBonus}</Text>
                <Text style={styles.value}>{block.attackBonus || " "}</Text>
              </View>
            </View>

            {block.cantrips.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <SectionHeader title={labels.cantrips} color={t.pink} styles={styles} />
                <View style={styles.box}>
                  <Text style={styles.textBlock}>{block.cantrips.map((s) => s.name).join(", ") || " "}</Text>
                </View>
              </View>
            )}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
              const spells = block.spellsByLevel[level];
              const slots = block.slotsByLevel[level];
              if (!spells?.length && !slots) return null;
              return (
                <View key={level} style={{ marginTop: 6 }}>
                  <SectionHeader title={`${labels.spellLevel} ${level}`} color={t.pink} styles={styles} />
                  <View style={styles.box}>
                    {slots && (
                      <Text style={[styles.label, { marginBottom: 4 }]}>
                        {labels.spellSlots}: {labels.slotsUsed} {slots.used} / {labels.slotsTotal} {slots.total}
                      </Text>
                    )}
                    <Text style={styles.textBlock}>
                      {spells?.map((s) => (s.prepared ? `✓ ${s.name}` : s.name)).join(", ") || " "}
                    </Text>
                  </View>
                </View>
              );
            })}

            <PageFooter labels={labels} theme={theme} styles={styles} />
          </Page>
        ))}
    </Document>
  );
}
