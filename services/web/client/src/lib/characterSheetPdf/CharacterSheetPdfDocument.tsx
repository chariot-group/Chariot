/** @see FR-character-sheet-pdf-export */

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import type { CharacterSheetPdfData, CharacterSheetPdfLabels, CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/types";

Font.registerHyphenationCallback((word) => [word]);

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
      marginBottom: 7,
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
    skillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 1.5, gap: 4 },
    skillName: { fontSize: 7.4, flex: 1 },
    skillBonus: { fontSize: 7.5, fontWeight: "bold", width: 24, textAlign: "right" },
    proficient: { fontStyle: "italic" },
    tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 2, marginBottom: 2 },
    tableRow: { flexDirection: "row", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: t.border },
    tableCell: { fontSize: 7.6 },
    textBlock: { fontSize: 7.5, lineHeight: 1.45 },
    avatar: { width: 64, height: 80, borderRadius: 8, objectFit: "cover" },
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
    pageOneHeader: { borderWidth: 1.2, borderColor: t.border, borderRadius: 15, padding: 9, marginBottom: 7, backgroundColor: t.cardBackground },
    brandRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
    headerMainRow: { flexDirection: "row", gap: 7, alignItems: "stretch" },
    headerNameItem: { width: "34%", borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 6, minHeight: 38, justifyContent: "center" },
    charName: { fontSize: 14.5, fontWeight: "bold", lineHeight: 1.2 },
    headerInfoGrid: { flex: 1, flexDirection: "row", gap: 7 },
    headerInfoItem: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 5, minHeight: 38 },
    bodyGrid: { flexDirection: "row", gap: 7 },
    colAbilities: { width: "17%" },
    colSkills: { width: "34%" },
    colCombat: { width: "26%" },
    colNarrative: { width: "23%" },
    scoreCard: { borderWidth: 1, borderColor: t.border, borderRadius: 13, paddingVertical: 7, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", minHeight: 69, backgroundColor: t.cardBackground, marginBottom: 5 },
    scoreLabel: { fontSize: 6.8, fontWeight: "bold", textTransform: "uppercase" },
    scoreValue: { fontSize: 12.5, fontWeight: "bold", marginTop: 3 },
    scoreMod: { fontSize: 8, marginTop: 2 },
    smallPill: { borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: t.cardBackground, marginBottom: 5 },
    smallPillLarge: { minHeight: 34, justifyContent: "center" },
    inlineStatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    smallPillLabel: { fontSize: 6.8, color: t.textMuted, textTransform: "uppercase" },
    smallPillValue: { fontSize: 8.8, fontWeight: "bold" },
    checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: t.textMuted, borderRadius: 2, alignItems: "center", justifyContent: "center" },
    checkboxInner: { width: 6, height: 6, borderRadius: 1, backgroundColor: t.text },
    statLineBox: { flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 4, backgroundColor: t.cardBackground, alignItems: "center", justifyContent: "center", gap: 2 },
    statLineLabel: { fontSize: 7, color: t.textMuted, textTransform: "uppercase", textAlign: "center", letterSpacing: 0.2 },
    statLineValue: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
    dotsRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    dot: { width: 7, height: 7, borderRadius: 999, borderWidth: 1, borderColor: t.textMuted },
    attacksTableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 2, marginBottom: 2 },
    attackName: { width: "43%", fontSize: 7, fontWeight: "bold", color: t.textMuted },
    attackBonus: { width: "17%", fontSize: 7, fontWeight: "bold", color: t.textMuted },
    attackDamage: { width: "40%", fontSize: 7, fontWeight: "bold", color: t.textMuted },
    attackRow: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: t.border, paddingVertical: 2.5 },
    attackCellName: { width: "43%", fontSize: 7.2 },
    attackCellBonus: { width: "17%", fontSize: 7.2, textAlign: "center" },
    attackCellDamage: { width: "40%", fontSize: 7.2 },
    coinRow: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 4 },
    coinIcon: { width: 10, height: 9 },
    coinText: { fontSize: 7.3, fontWeight: "bold" },
    largeNarrativeBox: { flex: 1, minHeight: 190 },
    equipmentBox: { minHeight: 172 },
    proficienciesBox: { minHeight: 120 },
  });
}

function clampText(value: string, max: number): string {
  if (!value) return " ";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function splitTextForContinuation(value: string, firstPageLimit: number): [string, string] {
  if (!value) return [" ", ""];
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= firstPageLimit) {
    return [normalized, ""];
  }

  const cutoff = normalized.lastIndexOf(" ", firstPageLimit);
  const splitAt = cutoff > 0 ? cutoff : firstPageLimit;
  return [normalized.slice(0, splitAt).trim(), normalized.slice(splitAt).trim()];
}

const COIN_SVGS = {
  cp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#A45918"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#A45918" stroke="#19191C" stroke-width="2"/></svg>`,
  sp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#BDBDBD"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#BDBDBD" stroke="#19191C" stroke-width="2"/></svg>`,
  ep: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#7F8F9E"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#7F8F9E" stroke="#19191C" stroke-width="2"/></svg>`,
  gp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#FFC400"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#FFC400" stroke="#19191C" stroke-width="2"/></svg>`,
  pp: `<svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="13" cy="15.5" rx="8.5" ry="11" transform="rotate(-90 13 15.5)" fill="#BEBAA3"/><path d="M1 10.5C1 5.02882 6.62767 1 13 1C19.3723 0.999999 25 5.02882 25 10.5C25 15.9712 19.3723 20 13 20C6.62767 20 1 15.9712 1 10.5Z" fill="#BEBAA3" stroke="#19191C" stroke-width="2"/></svg>`,
};

const BRAND_ICON_SVG = `<svg width="22" height="26" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3V9.09961C17 11.6296 16.203 13.9398 14.5986 16.0098C12.9943 18.0798 10.965 19.41 8.5 20C6.035 19.42 4.00574 18.0898 2.40137 16.0098C0.797039 13.9398 0 11.6296 0 9.09961V3L8.5 0L17 3Z" fill="#61EBFF"/></svg>`;

interface PageFooterProps {
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
  page: number;
  total: number;
  styles: ReturnType<typeof createStyles>;
}

function PageFooter({ labels, theme, page, total, styles }: PageFooterProps) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{labels.appName}</Text>
      <Text style={styles.footerText}>{labels.pageOf.replace("{page}", String(page)).replace("{total}", String(total))}</Text>
      <Text style={[styles.footerText, { color: t.purple }]}>chariot.tools</Text>
    </View>
  );
}

function SectionHeader({
  title,
  color,
  styles,
}: {
  title: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: color }]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
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

interface CharacterSheetPdfDocumentProps {
  data: CharacterSheetPdfData;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
}

export function CharacterSheetPdfDocument({ data, labels, theme }: CharacterSheetPdfDocumentProps) {
  const t = CHARACTER_SHEET_PDF_THEMES[theme];
  const styles = createStyles(theme);
  const featuresText = data.features.map((f) => `${f.name}${f.description ? `: ${f.description}` : ""}`).join(" • ");
  const [featuresPageOneText, featuresPageTwoText] = splitTextForContinuation(featuresText, 520);
  const spellPageCount = data.hasSpellcasting ? data.spellcastingBlocks.length : 0;
  const totalPages = 2 + spellPageCount;

  return (
    <Document>
      {/* Page 1 — D&D-like core layout */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.pageOneHeader}>
          <View style={styles.brandRow}>
            <Image src={svgDataUrl(BRAND_ICON_SVG)} style={{ width: 22, height: 26 }} alt="" />
          </View>
          <View style={styles.headerMainRow}>
            <View style={styles.headerNameItem}>
              <Text style={styles.label}>{labels.characterName}</Text>
              <Text style={styles.charName}>{clampText(data.displayName, 38)}</Text>
            </View>
            <View style={styles.headerInfoGrid}>
              <View style={styles.headerInfoItem}>
                <Text style={styles.label}>{data.isPlayer ? labels.race : labels.creatureType}</Text>
                <Text style={styles.value}>{clampText(data.raceOrType, 24)}</Text>
              </View>
              <View style={styles.headerInfoItem}>
                <Text style={styles.label}>{data.isPlayer ? labels.classAndLevel : labels.challengeRating}</Text>
                <Text style={styles.value}>{clampText(data.classOrCr, 24)}</Text>
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

        <View style={styles.bodyGrid}>
          <View style={styles.colAbilities}>
            {data.abilities.map((ab) => (
              <View key={ab.abbr} style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>{ab.name}</Text>
                <Text style={styles.scoreValue}>{ab.score}</Text>
                <Text style={styles.scoreMod}>{ab.modifier}</Text>
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
              {data.savingThrows.map((st) => (
                <View key={st.abbr} style={styles.skillRow}>
                  <Text style={styles.skillName}>{st.abbr}</Text>
                  <View style={styles.valueWithIcon}>
                    <Text style={styles.skillBonus}>{st.bonus}</Text>
                    <View style={styles.checkbox}>{st.proficient ? <View style={styles.checkboxInner} /> : null}</View>
                  </View>
                </View>
              ))}
            </View>

            <SectionHeader title={labels.skills} color={t.blue} styles={styles} />
            <View style={styles.box}>
              {data.skills.map((skill) => (
                <View key={skill.name} style={styles.skillRow}>
                  <Text style={styles.skillName}>{clampText(skill.name, 24)}</Text>
                  <View style={styles.valueWithIcon}>
                    <Text style={styles.skillBonus}>{skill.bonus}</Text>
                    <Dots styles={styles} filled={skill.proficient ? 1 : 0} total={1} fillColor={t.blue} />
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.smallPill, styles.smallPillLarge]}>
              <View style={styles.inlineStatRow}>
                <Text style={styles.smallPillLabel}>{labels.passivePerception}</Text>
                <Text style={styles.smallPillValue}>{data.passivePerception}</Text>
              </View>
            </View>

            <SectionHeader title={labels.proficienciesAndLanguages} color={t.blue} styles={styles} />
            <View style={[styles.box, styles.proficienciesBox]}>
              <Text style={styles.textBlock}>{clampText(data.proficiencies, 420)}</Text>
              <Text style={[styles.label, { marginTop: 6, marginBottom: 3 }]}>{labels.proficienciesAndLanguages}</Text>
              <Text style={styles.textBlock}>{clampText(data.languages, 420)}</Text>
            </View>
          </View>

          <View style={styles.colCombat}>
            <View style={styles.row}>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.armorClass}</Text>
                <Text style={styles.statLineValue}>{data.armorClass}</Text>
              </View>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.initiative}</Text>
                <Text style={styles.statLineValue}>{data.initiative}</Text>
              </View>
              <View style={styles.statLineBox}>
                <Text style={styles.statLineLabel}>{labels.speed}</Text>
                <Text style={styles.statLineValue}>{clampText(data.speed, 14)}</Text>
              </View>
            </View>

            <SectionHeader title={labels.hitPoints} color={t.red} styles={styles} />
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
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{data.isPlayer ? labels.hitDice : labels.hitPointsRoll}</Text>
                <Text style={styles.fieldValue}>{clampText(data.hitDice, 36)}</Text>
              </View>
              <Text style={styles.label}>{labels.deathSaves}</Text>
              <View style={styles.row}>
                <Text style={{ fontSize: 6.5, width: 36 }}>{labels.successes}</Text>
                <Dots styles={styles} filled={Math.max(0, Math.min(3, data.deathSaveSuccesses))} total={3} fillColor={t.green} />
              </View>
              <View style={styles.row}>
                <Text style={{ fontSize: 6.5, width: 36 }}>{labels.failures}</Text>
                <Dots styles={styles} filled={Math.max(0, Math.min(3, data.deathSaveFailures))} total={3} fillColor={t.red} />
              </View>
            </View>

            <SectionHeader title={labels.attacksAndSpellcasting} color={t.red} styles={styles} />
            <View style={styles.box}>
              <View style={styles.attacksTableHeader}>
                <Text style={styles.attackName}>{labels.attackName}</Text>
                <Text style={styles.attackBonus}>BONUS</Text>
                <Text style={styles.attackDamage}>DMG / TYPE</Text>
              </View>
              {(data.attacks.length > 0 ? data.attacks : [{ name: " ", bonus: " ", damage: " ", range: " " }]).slice(0, 5).map((atk, i) => (
                <View key={`${atk.name}-${i}`} style={styles.attackRow}>
                  <Text style={styles.attackCellName}>{clampText(atk.name, 20)}</Text>
                  <Text style={styles.attackCellBonus}>{atk.bonus}</Text>
                  <Text style={styles.attackCellDamage}>{clampText(atk.damage, 24)}</Text>
                </View>
              ))}
            </View>

            <SectionHeader title={labels.equipment} color={t.yellow} styles={styles} />
            <View style={[styles.box, styles.equipmentBox]}>
              {(["cp", "sp", "ep", "gp", "pp"] as const).map((key) => (
                <View key={key} style={styles.coinRow}>
                  <Image src={svgDataUrl(COIN_SVGS[key])} style={styles.coinIcon} alt="" />
                  <Text style={styles.coinText}>
                    {key.toUpperCase()}: {data.currencies[key]}
                  </Text>
                </View>
              ))}
              <Text style={[styles.textBlock, { marginTop: 4 }]}>{clampText(data.equipment || data.treasureText, 220)}</Text>
            </View>
          </View>

          <View style={styles.colNarrative}>
            <SectionHeader title={labels.personalityTraits} color={t.green} styles={styles} />
            <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.personalityTraits, 180)}</Text></View>
            <SectionHeader title={labels.ideals} color={t.green} styles={styles} />
            <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.ideals, 180)}</Text></View>
            <SectionHeader title={labels.bonds} color={t.green} styles={styles} />
            <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.bonds, 180)}</Text></View>
            <SectionHeader title={labels.flaws} color={t.green} styles={styles} />
            <View style={styles.box}><Text style={styles.textBlock}>{clampText(data.flaws, 180)}</Text></View>
            <SectionHeader title={labels.featuresAndTraits} color={t.blue} styles={styles} />
            <View style={[styles.box, styles.largeNarrativeBox]}>
              <Text style={styles.textBlock}>
                {clampText(featuresPageOneText, 950)}
              </Text>
            </View>
          </View>
        </View>

        <PageFooter labels={labels} theme={theme} page={1} total={totalPages} styles={styles} />
      </Page>

      {/* Page 2 — Biography */}
      <Page size="LETTER" style={styles.page}>
        {featuresPageTwoText ? (
          <View style={{ marginBottom: 7 }}>
            <SectionHeader title={labels.featuresAndTraits} color={t.blue} styles={styles} />
            <View style={[styles.box, { minHeight: 92 }]}>
              <Text style={styles.textBlock}>{clampText(featuresPageTwoText, 1500)}</Text>
            </View>
          </View>
        ) : null}
        <View style={styles.row}>
          <View style={[styles.col, { flex: 2 }]}>
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
          {data.avatarDataUrl && (
            <View>
              <Image src={data.avatarDataUrl} style={styles.avatar} alt="" />
            </View>
          )}
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

        <PageFooter labels={labels} theme={theme} page={2} total={totalPages} styles={styles} />
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

            <PageFooter labels={labels} theme={theme} page={3 + blockIndex} total={totalPages} styles={styles} />
          </Page>
        ))}
    </Document>
  );
}
