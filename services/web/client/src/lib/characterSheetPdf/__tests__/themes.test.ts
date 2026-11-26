/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import type { CharacterSheetPdfThemeTokens } from "@/lib/characterSheetPdf/themes";

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

/** Tokens drawn as text on cards: body, secondary, card titles (accents) and the footer link. */
const TEXT_TOKENS: (keyof CharacterSheetPdfThemeTokens)[] = [
  "text",
  "textMuted",
  "blue",
  "red",
  "pink",
  "yellow",
  "green",
];

describe("FR-character-sheet-pdf-export — PDF themes", () => {
  it("nominal: the dark theme mirrors the app surface and text tokens", () => {
    expect(CHARACTER_SHEET_PDF_THEMES.dark).toMatchObject({
      pageBackground: "#0c0c0f",
      cardBackground: "#17171a",
      raisedBackground: "#1f1f22",
      text: "#f7f7f7",
      textMuted: "#98989c",
      border: "#353538",
      link: "#a98bff",
    });
  });

  for (const theme of ["dark", "light"] as const) {
    it(`contrast: ${theme} text, titles and accents reach 4.5:1 on the card and raised surfaces`, () => {
      const tokens = CHARACTER_SHEET_PDF_THEMES[theme];
      for (const key of TEXT_TOKENS) {
        expect(contrastRatio(tokens[key], tokens.cardBackground), `${theme}.${key} on card`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
      expect(contrastRatio(tokens.text, tokens.raisedBackground)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.footerText, tokens.pageBackground)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.link, tokens.pageBackground)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("guard: the violet used as text on dark is the light variant, never the fill violet", () => {
    expect(CHARACTER_SHEET_PDF_THEMES.dark.link).not.toBe("#4e00de");
  });
});
