/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { getMasteryIconSvg } from "@/lib/characterSheetPdf/masteryIconSvg";
import { PDF_SKILL_CONFIG } from "@/lib/characterSheetPdf/skillConfig";
import { PDF_SKILL_LUCIDE_NODES } from "@/lib/characterSheetPdf/lucidePdfIconNodes";

describe("FR-character-sheet-pdf-export — mastery icons", () => {
  const colors = { blue: "#61ebff", red: "#ff2d2d", textMuted: "#b2b2b2" };

  it("nominal: returns filled circle SVG for mastered skill", () => {
    const svg = getMasteryIconSvg(2, "blue", "dark", colors);
    expect(svg).toContain('fill="#61ebff"');
    expect(svg).toContain("<svg");
  });

  it("edge: uses muted ring for unmastered light theme", () => {
    const svg = getMasteryIconSvg(0, "blue", "light", colors);
    expect(svg).toContain('fill="#b2b2b2"');
  });
});

describe("FR-character-sheet-pdf-export — Chariot skill layout config", () => {
  it("nominal: matches UI skill order (acrobatics then arcana, not animalHandling)", () => {
    expect(PDF_SKILL_CONFIG[0]?.key).toBe("acrobatics");
    expect(PDF_SKILL_CONFIG[1]?.key).toBe("arcana");
    expect(PDF_SKILL_CONFIG[2]?.key).toBe("athletics");
    expect(PDF_SKILL_CONFIG[3]?.key).toBe("stealth");
  });

  it("nominal: exposes a lucide node for every configured skill", () => {
    for (const { key } of PDF_SKILL_CONFIG) {
      expect(PDF_SKILL_LUCIDE_NODES[key]?.length).toBeGreaterThan(0);
    }
  });
});
