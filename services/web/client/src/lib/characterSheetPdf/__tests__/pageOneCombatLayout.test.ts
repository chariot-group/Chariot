/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  estimateHitDicePillRows,
  estimateHitPointsCardHeight,
  getPageOneAttackRowCount,
  getPageOneBodyHeight,
  PDF_ATTACK_ROW_HEIGHT,
} from "@/lib/characterSheetPdf/pageOneCombatLayout";
import { PDF_PAGE_CONTENT_HEIGHT, PDF_SECTION_GAP } from "@/lib/characterSheetPdf/pdfPageGeometry";

const singleClass = [{ notation: "7d6", className: "Magicien" }];
const base = {
  headerHeight: 60,
  attacksTitle: "Attaques et sorts",
  isPlayer: true,
  title: "Points de vie",
  deathSavesTitle: "Jets de sauvegarde contre la mort",
  hitDiceEntries: singleClass,
};

describe("FR-character-sheet-pdf-export — page 1 combat column", () => {
  it("nominal: the body ends at the bottom of the page under the header", () => {
    expect(getPageOneBodyHeight(60)).toBeLessThanOrEqual(PDF_PAGE_CONTENT_HEIGHT - 60 - PDF_SECTION_GAP);
    expect(getPageOneBodyHeight(60)).toBeGreaterThan(PDF_PAGE_CONTENT_HEIGHT - 60 - PDF_SECTION_GAP - 2);
  });

  it("nominal: a single-class player gets enough two-line rows to fill half of the space left", () => {
    const rows = getPageOneAttackRowCount(base);
    expect(rows).toBeGreaterThanOrEqual(5);
    // Half of what is left under the AC tiles and hit points never holds the rows plus another one.
    const shared = getPageOneBodyHeight(60) - estimateHitPointsCardHeight(base);
    expect((rows + 1) * PDF_ATTACK_ROW_HEIGHT).toBeGreaterThan(shared / 2 - 80);
  });

  it("edge: a taller header or more hit dice rows never add attack rows", () => {
    const fourClasses = ["Ensorceleur", "Magicien", "Paladin", "Roublard"].map((className, index) => ({
      className,
      notation: `${index + 1}d${6 + 2 * index}`,
    }));
    expect(estimateHitDicePillRows(fourClasses)).toBeGreaterThan(1);
    expect(getPageOneAttackRowCount({ ...base, headerHeight: 90 })).toBeLessThanOrEqual(getPageOneAttackRowCount(base));
    expect(getPageOneAttackRowCount({ ...base, hitDiceEntries: fourClasses })).toBeLessThanOrEqual(
      getPageOneAttackRowCount(base),
    );
  });

  it("edge: an NPC hit points card (no hit dice, no death saves) is shorter than a player's", () => {
    expect(estimateHitPointsCardHeight({ ...base, isPlayer: false })).toBeLessThan(estimateHitPointsCardHeight(base));
    expect(estimateHitDicePillRows([])).toBe(0);
  });

  it("guard: the attacks card keeps at least one row whatever the header height", () => {
    expect(getPageOneAttackRowCount({ ...base, headerHeight: 2000 })).toBe(1);
  });
});
