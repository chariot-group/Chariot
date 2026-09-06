/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  PDF_EQUIPMENT_PAGE1_MAX_CHARS,
  PDF_PROFICIENCIES_PAGE1_MAX_CHARS,
  splitTextForPdfPages,
} from "@/lib/characterSheetPdf/splitTextForPdfPages";

describe("splitTextForPdfPages", () => {
  it("keeps short text entirely on page one", () => {
    expect(splitTextForPdfPages("Light armor, swords", 40)).toEqual({
      pageOne: "Light armor, swords",
      pageTwo: "",
    });
  });

  it("splits long text at a word boundary for page two continuation", () => {
    const longText = "Chain mail, longsword, shortsword, shield, explorer's pack, ".repeat(6).trim();
    const result = splitTextForPdfPages(longText, PDF_PROFICIENCIES_PAGE1_MAX_CHARS);

    expect(result.pageOne.length).toBeGreaterThan(0);
    expect(result.pageTwo.length).toBeGreaterThan(0);
    expect(`${result.pageOne} ${result.pageTwo}`.replace(/\s+/g, " ").trim()).toBe(longText.replace(/\s+/g, " ").trim());
  });

  it("returns empty strings when input is blank", () => {
    expect(splitTextForPdfPages("   ", PDF_EQUIPMENT_PAGE1_MAX_CHARS)).toEqual({
      pageOne: "",
      pageTwo: "",
    });
  });
});
