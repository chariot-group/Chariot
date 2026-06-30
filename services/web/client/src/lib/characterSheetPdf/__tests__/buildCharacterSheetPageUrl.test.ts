/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { buildCharacterSheetPagePath, buildCharacterSheetPageUrl } from "@/lib/characterSheetPdf/buildCharacterSheetPageUrl";

describe("buildCharacterSheetPageUrl", () => {
  it("builds a locale-prefixed character path", () => {
    expect(buildCharacterSheetPagePath("fr", "char-123")).toBe("/fr/characters/char-123");
  });

  it("builds an absolute character sheet URL", () => {
    expect(buildCharacterSheetPageUrl("https://chariot.tools", "fr", "char-123")).toBe(
      "https://chariot.tools/fr/characters/char-123",
    );
  });

  it("strips trailing slashes from origin", () => {
    expect(buildCharacterSheetPageUrl("https://chariot.tools/", "en", "abc")).toBe(
      "https://chariot.tools/en/characters/abc",
    );
  });
});
