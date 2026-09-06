/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { buildCharacterSheetPdfFilename, sanitizeFilenamePart } from "@/lib/characterSheetPdf/buildFilename";

describe("FR-character-sheet-pdf-export — buildFilename", () => {
  it("nominal: builds filename with sanitized name and date", () => {
    expect(buildCharacterSheetPdfFilename("Aragorn", "Elessar", new Date("2026-06-30T12:00:00Z"))).toBe(
      "chariot-Aragorn-Elessar-2026-06-30.pdf",
    );
  });

  it("edge: strips unsafe characters from name parts", () => {
    expect(sanitizeFilenamePart("Gandalf/the Grey")).toBe("Gandalf-the-Grey");
    expect(buildCharacterSheetPdfFilename("Bob<script>", "", new Date("2026-01-01"))).toBe(
      "chariot-Bob-script-2026-01-01.pdf",
    );
  });

  it("edge: falls back to character when name is empty", () => {
    expect(buildCharacterSheetPdfFilename("", "", new Date("2026-01-01"))).toBe("chariot-character-2026-01-01.pdf");
  });
});
