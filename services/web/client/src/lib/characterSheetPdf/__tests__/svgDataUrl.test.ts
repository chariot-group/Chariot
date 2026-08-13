/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { svgDataUrl } from "@/lib/characterSheetPdf/svgDataUrl";

describe("FR-character-sheet-pdf-export — svgDataUrl", () => {
  it("nominal: encodes SVG as base64 data URL for react-pdf", () => {
    const url = svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4" fill="red"/></svg>');
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(url).not.toContain("utf8");
  });

  it("edge: round-trips simple SVG content", () => {
    const svg = "<svg><path d=\"M0 0\"/></svg>";
    const encoded = svgDataUrl(svg).replace("data:image/svg+xml;base64,", "");
    expect(Buffer.from(encoded, "base64").toString("utf8")).toBe(svg);
  });
});
