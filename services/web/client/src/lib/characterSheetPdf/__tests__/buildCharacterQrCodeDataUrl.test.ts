/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { buildCharacterQrCodeDataUrl } from "@/lib/characterSheetPdf/buildCharacterQrCodeDataUrl";

describe("buildCharacterQrCodeDataUrl", () => {
  it("returns a PNG data URL for a valid character page URL", async () => {
    const dataUrl = await buildCharacterQrCodeDataUrl("https://chariot.tools/fr/characters/char-1");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("returns null for empty URL", async () => {
    await expect(buildCharacterQrCodeDataUrl("")).resolves.toBeNull();
  });
});
