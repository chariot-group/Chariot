import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { splitLinkedToLabel } from "@/components/character/NpcLinkedPlayerFooterLink";

const footerLinkPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "NpcLinkedPlayerFooterLink.tsx");
const detailPath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CharacterDetailView.tsx");

describe("FR-npc-player-link — linked Player footer shortcut", () => {
  it("nominal: footer link uses linkedTo label and secondary button (same as Export PDF)", () => {
    const source = readFileSync(footerLinkPath, "utf8");

    expect(source).toContain("npc.linkedTo");
    expect(source).toContain('variant="secondary"');
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

describe("FR-npc-player-link — long linked Player names truncate", () => {
  it("nominal: button width is capped and can shrink so the name truncates", () => {
    const source = readFileSync(footerLinkPath, "utf8");

    expect(source).toContain("max-w-56");
    expect(source).toContain("sm:max-w-72");
    expect(source).toMatch(/className=\{cn\("min-w-0 max-w-56 shrink /);
    expect(source).toContain('className="min-w-0 truncate"');
    expect(source).toContain("title={label}");
  });

  it("edge: only the name truncates, the « Lié à » prefix stays whole", () => {
    expect(splitLinkedToLabel("Lié à Aldric le Flamboyant", "Aldric le Flamboyant")).toEqual({
      prefix: "Lié à ",
      name: "Aldric le Flamboyant",
      suffix: "",
    });
    expect(splitLinkedToLabel("Vinculado a Ana", "Ana")).toEqual({ prefix: "Vinculado a ", name: "Ana", suffix: "" });
  });

  it("failure: label without the name falls back to truncating the whole label", () => {
    expect(splitLinkedToLabel("Lié à …", "Bob")).toEqual({ prefix: "", name: "Lié à …", suffix: "" });
  });
});
