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
    expect(tab).toContain("grid w-full min-w-0 grid-cols-1");
    expect(tab).toContain("md:grid-cols-2");
    expect(tab).toContain("xl:grid-cols-3");
    expect(card).toContain('from "@/components/ui/card"');
    expect(card).toContain("<MediaAvatar");
    expect(card).toContain('size="sheet"');
    expect(card).toContain("aspect-[4/5]");
    expect(card).toContain("npcSheetHeaderIdentity");
    expect(card).toContain("formattedChallengeRating");
    expect(card).toContain("experiencePoints");
    expect(card).toContain("buildSessionCharacterHref");
    expect(card).toContain("npc._id");
    expect(card).toContain("absolute inset-0");
    expect(card).not.toContain("linkedTo");
    expect(card).not.toContain("kindBadge");
    expect(card).not.toContain("tabIndex={-1}");
  });

  it("edge: names truncate, unlink is a footer action, and CR uses InfoTooltip", () => {
    const card = readSource(cardPath);

    expect(card).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(card).toContain("truncate text-left text-lg");
    expect(card).toContain("<InfoTooltip");
    expect(card).toContain("challengeRatingAbbr");
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
