/** @see FR-character-sheet-pdf-export */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDF_SPELL_DETAIL_CARD_WIDTH, PDF_SPELL_DETAIL_GAP, PDF_SPELL_OVERVIEW } from "@/lib/characterSheetPdf/buildSpellPdfPages";
import {
  PDF_ABILITY_COLUMN,
  PDF_COMBAT_TILE,
  PDF_COMBAT_TILE_LABEL_WIDTH,
  PDF_PAGE_CONTENT_WIDTH,
  PDF_PAGE_ONE_HALF_WIDTH,
  PDF_SKILL_CELL,
  PDF_SKILL_NAME_WIDTH,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import { measureTextWidth } from "@/lib/characterSheetPdf/pdfTextMetrics";

interface CharacterDetailMessages {
  player: { general: { abilities: Record<string, string>; skillNames: Record<string, string> } };
  pdfExport: Record<string, string>;
  edit: Record<string, string>;
}

const localeMessages: CharacterDetailMessages[] = ["fr", "en", "es"].map(
  (locale) => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), `messages/${locale}.json`), "utf8")).characterDetail,
);
const generalMessages = localeMessages.map((messages) => messages.player.general);

/** Smallest space wanted on each side of the widest ability label. */
const ABILITY_LABEL_MIN_SIDE_MARGIN = 5;

describe("FR-character-sheet-pdf-export — page 1 geometry", () => {
  it("nominal: the widest ability label of every locale keeps side margins in its tile", () => {
    const widest = Math.max(
      ...generalMessages.flatMap((general) =>
        Object.values(general.abilities).map((name) =>
          measureTextWidth(name.toUpperCase(), PDF_ABILITY_COLUMN.labelFontSize, "bold"),
        ),
      ),
    );
    expect((PDF_ABILITY_COLUMN.width - widest) / 2).toBeGreaterThanOrEqual(ABILITY_LABEL_MIN_SIDE_MARGIN);
  });

  it("edge: every single word of every translated skill name fits its cell without touching the bonus", () => {
    const words = generalMessages.flatMap((general) =>
      Object.values(general.skillNames).flatMap((name) => name.split(/\s+/)),
    );
    for (const word of words) {
      expect(measureTextWidth(word, PDF_SKILL_CELL.nameFontSize), word).toBeLessThanOrEqual(PDF_SKILL_NAME_WIDTH);
    }
  });

  it("guard: the ability column leaves the skills card most of the left half", () => {
    expect(PDF_ABILITY_COLUMN.width).toBeLessThan(PDF_PAGE_ONE_HALF_WIDTH / 4);
    expect(PDF_SKILL_NAME_WIDTH).toBeGreaterThan(0);
  });

  it("edge: the AC / initiative / speed labels of every locale fit their tile", () => {
    for (const messages of localeMessages) {
      for (const key of ["armorClass", "initiativeShort", "speedShort"]) {
        const label = messages.pdfExport[key]!.toUpperCase();
        expect(measureTextWidth(label, PDF_COMBAT_TILE.labelFontSize), label).toBeLessThanOrEqual(
          PDF_COMBAT_TILE_LABEL_WIDTH,
        );
      }
    }
  });

  it("edge: the spell overview header labels of every locale fit one line, with the minimum gap between them", () => {
    const available = PDF_PAGE_CONTENT_WIDTH - 2 * PDF_SPELL_OVERVIEW.headerPaddingHorizontal;
    for (const messages of localeMessages) {
      const labels = [
        messages.edit.className,
        messages.edit.spellcastingAbility,
        messages.pdfExport.preparedSpells,
        messages.edit.spellSaveDC,
        messages.edit.spellAttackBonus,
      ].map((label) => label!.toUpperCase());
      const labelsWidth = labels.reduce(
        (sum, label) => sum + measureTextWidth(label, PDF_SPELL_OVERVIEW.statLabelFontSize, "bold"),
        0,
      );
      expect(labelsWidth + (labels.length - 1) * PDF_SPELL_OVERVIEW.headerMinGap, labels.join(" | ")).toBeLessThanOrEqual(
        available,
      );
    }
  });

  it("layout: spell detail cards have one width, two per row across the page", () => {
    expect(2 * PDF_SPELL_DETAIL_CARD_WIDTH + PDF_SPELL_DETAIL_GAP).toBeCloseTo(PDF_PAGE_CONTENT_WIDTH);
  });
});
