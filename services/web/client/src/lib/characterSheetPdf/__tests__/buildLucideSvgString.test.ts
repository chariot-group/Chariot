/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { buildLucideSvgDataUrl, buildLucideSvgString } from "@/lib/characterSheetPdf/buildLucideSvgString";
import { PDF_SKILL_LUCIDE_NODES } from "@/lib/characterSheetPdf/lucidePdfIconNodes";

describe("FR-character-sheet-pdf-export — buildLucideSvgString", () => {
  it("nominal: builds stroke SVG with round caps for church icon paths", () => {
    const svg = buildLucideSvgString(PDF_SKILL_LUCIDE_NODES.religion, "#b2b2b2");
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('d="M10 9h4"');
    expect(svg).toContain('d="M12 7v5"');
  });

  it("nominal: includes circle for investigation icon", () => {
    const svg = buildLucideSvgString(PDF_SKILL_LUCIDE_NODES.investigation, "#b2b2b2");
    expect(svg).toContain("<circle");
    expect(svg).toContain('d="M12 17h.01"');
  });

  it("edge: encodes as base64 data URL for react-pdf Image", () => {
    const url = buildLucideSvgDataUrl(PDF_SKILL_LUCIDE_NODES.stealth, "#b2b2b2");
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });
});
