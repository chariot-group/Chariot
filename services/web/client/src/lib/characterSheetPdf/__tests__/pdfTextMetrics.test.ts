/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { estimateTextLineCount, measureTextWidth } from "@/lib/characterSheetPdf/pdfTextMetrics";

describe("FR-character-sheet-pdf-export — measureTextWidth", () => {
  it("nominal: uses the Helvetica glyph widths, bold being wider", () => {
    // H 722 + i 222 = 944 / 1000 em.
    expect(measureTextWidth("Hi", 10)).toBeCloseTo(9.44);
    expect(measureTextWidth("Hi", 10, "bold")).toBeCloseTo(10);
  });

  it("edge: accented letters take their base letter width, unknown glyphs a lowercase width", () => {
    expect(measureTextWidth("é", 10)).toBeCloseTo(measureTextWidth("e", 10));
    expect(measureTextWidth("Ñ", 10, "bold")).toBeCloseTo(measureTextWidth("N", 10, "bold"));
    expect(measureTextWidth("’", 10)).toBeCloseTo(2.22);
    expect(measureTextWidth("中", 10)).toBeCloseTo(5.56);
  });
});

describe("FR-character-sheet-pdf-export — estimateTextLineCount", () => {
  // "o" is 556 / 1000 em and a space 278: at 10 pt, a 55.6 pt line holds exactly ten "o".
  const count = (text: string) => estimateTextLineCount(text, 10, 55.6);

  it("nominal: wraps words greedily at the line width", () => {
    expect(count("oooo oooo")).toBe(1);
    expect(count("ooooo ooooo")).toBe(2);
    expect(count("oo oo oo oo oo oo")).toBe(2);
  });

  it("edge: counts each paragraph, blank ones included, and breaks words wider than a line", () => {
    expect(count("ooo\n\nooo")).toBe(3);
    expect(count("o".repeat(25))).toBe(3);
    expect(count(`${"o".repeat(25)} oo`)).toBe(3);
  });

  it("guard: empty text or a zero width takes no line", () => {
    expect(count("   ")).toBe(0);
    expect(estimateTextLineCount("abc", 10, 0)).toBe(0);
  });
});
