import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footerLinkPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "NpcLinkedPlayerFooterLink.tsx");
const detailPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx");

describe("FR-npc-player-link — linked Player footer shortcut", () => {
  it("nominal: footer link uses linkedTo label and outline button", () => {
    const source = readFileSync(footerLinkPath, "utf8");

    expect(source).toContain("npc.linkedTo");
    expect(source).toContain('variant="outline"');
  });

  it("nominal: CharacterDetailView mounts footer link and removes header linkedTo", () => {
    const detail = readFileSync(detailPath, "utf8");

    expect(detail).toContain("NpcLinkedPlayerFooterLink");
    expect(detail).toContain("showLinkedPlayerFooter");
    expect(detail).toContain("exportPdfWithLinkedPlayer");
    expect(detail).not.toMatch(/subtitle[\s\S]*npc\.linkedTo/);
  });

  it("edge: linked-player control sits beside export PDF with a pipe separator", () => {
    const detail = readFileSync(detailPath, "utf8");

    expect(detail).toContain("exportPdfWithLinkedPlayer");
    expect(detail).toMatch(/\|[\s\S]*exportPdfAction|exportPdfWithLinkedPlayer[\s\S]*\|/);
  });
});
