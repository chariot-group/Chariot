/** @see FR-character-sheet-pdf-export */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PDF_ABILITY_COLUMN,
  PDF_PAGE_ONE_HALF_WIDTH,
  PDF_SKILL_CELL,
  PDF_SKILL_NAME_WIDTH,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import { measureTextWidth } from "@/lib/characterSheetPdf/pdfTextMetrics";

interface GeneralMessages {
  abilities: Record<string, string>;
  skillNames: Record<string, string>;
}

const generalMessages: GeneralMessages[] = ["fr", "en", "es"].map(
  (locale) =>
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), `messages/${locale}.json`), "utf8")).characterDetail.player
      .general,
);

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
});
