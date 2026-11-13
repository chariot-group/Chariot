import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const companionsDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cardPath = resolve(companionsDir, "CompanionNpcCard.tsx");
const tabPath = resolve(companionsDir, "CharacterCompanionsTabContent.tsx");

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

describe("FR-npc-player-link — companion NPC cards", () => {
  it("nominal: cards show avatar, NPC header identity, and sheet link in a responsive grid", () => {
    const card = readSource(cardPath);
    const tab = readSource(tabPath);

    expect(tab).toContain("<CompanionNpcCard");
    expect(tab).toContain("COMPANIONS_BENTO_GRID_CLASS");
    expect(tab).toContain("COMPANIONS_SLOTS.companion");
    expect(card).toContain('from "@/components/ui/card"');
    expect(card).toContain("<MediaAvatar");
    expect(card).toContain('size="sheet"');
    expect(card).toContain("aspect-[4/5]");
    expect(card).toContain("npcSheetHeaderIdentity");
    // Same fact cells as the « Personnage » card (FR-character-identity-card).
    expect(card).toContain("useNpcIdentityFacts");
    expect(card).toContain("<IdentityFactCells");
    expect(card).toContain("denseColumns");
    expect(card).toContain("min-h-[1.375rem]");
    expect(card).toContain("h-full");
    expect(card).toContain("text-primary-light");
    expect(card).toContain("buildSessionCharacterHref");
    expect(card).toContain("npc._id");
    expect(card).toContain("absolute inset-0");
    expect(card).not.toContain("linkedTo");
    expect(card).not.toContain("kindBadge");
    expect(card).not.toContain("tabIndex={-1}");
  });

  it("edge: names truncate with a title, unlink is a footer action", () => {
    const card = readSource(cardPath);

    expect(card).toContain("TRUNCATE_ON_HOVER_DEVICES_CLASS");
    expect(card).toContain("title={identity.fullName}");
    expect(card).toContain("unlinkAria");
    expect(card).toContain('t("unlink")');
    expect(card).toContain("border-t border-white/10");
    expect(card).toContain("relative z-20 mt-auto");
    expect(card).toContain("stopPropagation");
    expect(card).toContain("{isEditing ? (");
  });

  it("failure: does not keep the compact list row and does not show a kind badge", () => {
    const tab = readSource(tabPath);
    const card = readSource(cardPath);

    expect(tab).not.toContain("bg-gray-middle-light px-3 py-2");
    expect(tab).not.toContain("kindBadge");
    expect(card).not.toContain("kindBadgeLabel");
    expect(tab).not.toContain("flex flex-col gap-3");
  });
});
