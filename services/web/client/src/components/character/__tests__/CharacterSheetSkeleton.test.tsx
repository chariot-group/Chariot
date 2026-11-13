import {
  COMPANIONS_BENTO_GRID_CLASS,
  COMPANIONS_SLOTS,
} from "@/components/character/tabContents/companions/shared/companionsBentoLayout";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CHARACTER_TABS, PLAYER_CHARACTER_TABS } from "@/components/character/CharacterTabs";
import CharacterSheetSkeleton, { CompanionsTabSkeleton } from "@/components/character/skeleton/CharacterSheetSkeleton";
import {
  resolveCharacterSheetSkeletonVariant,
  skeletonCardsForTab,
  type CharacterSheetSkeletonVariant,
} from "@/components/character/skeleton/characterSheetSkeletonLayout";
import {
  NPC_VIEW_SLOTS,
  PLAYER_VIEW_SLOTS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import {
  NPC_BATTLE_SLOTS,
  PLAYER_BATTLE_SLOTS,
} from "@/components/character/tabContents/battle/shared/battleBentoLayout";
import { INVENTORY_SLOTS } from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
import { HISTORY_SLOTS } from "@/components/character/tabContents/history/shared/historyBentoLayout";
import { MAGIC_SLOTS } from "@/components/character/tabContents/magic/shared/spellList";

const renderSkeleton = (variant: CharacterSheetSkeletonVariant) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{ characterDetail: { loadingSheet: "Loading character sheet…" } }}>
      <CharacterSheetSkeleton {...variant} />
    </NextIntlClientProvider>,
  );

describe("resolveCharacterSheetSkeletonVariant (FR-character-sheet-skeleton)", () => {
  it("nominal: campaign route → NPC with the requested tab, player space → PC with the requested tab", () => {
    expect(resolveCharacterSheetSkeletonVariant("campaign", "battle")).toEqual({
      kind: "npc",
      activeTab: "battle",
      tabs: CHARACTER_TABS,
    });
    expect(resolveCharacterSheetSkeletonVariant("playerSpace", "magic")).toEqual({
      kind: "player",
      activeTab: "magic",
      tabs: PLAYER_CHARACTER_TABS,
    });
  });

  it("edge: missing or unknown tab falls back to General", () => {
    expect(resolveCharacterSheetSkeletonVariant("campaign", null).activeTab).toBe("general");
    expect(resolveCharacterSheetSkeletonVariant("playerSpace", undefined).activeTab).toBe("general");
    expect(resolveCharacterSheetSkeletonVariant("campaign", "unknown").activeTab).toBe("general");
  });

  it("edge: tab=companions is always a PC with the 6 tabs, campaign route included", () => {
    for (const route of ["campaign", "playerSpace"] as const) {
      const variant = resolveCharacterSheetSkeletonVariant(route, "companions");
      expect(variant.kind).toBe("player");
      expect(variant.activeTab).toBe("companions");
      expect(variant.tabs).toHaveLength(6);
    }
  });
});

describe("skeletonCardsForTab — bento slots", () => {
  const cases = [
    ["general", "player", PLAYER_VIEW_SLOTS],
    ["general", "npc", NPC_VIEW_SLOTS],
    ["battle", "player", PLAYER_BATTLE_SLOTS],
    ["battle", "npc", NPC_BATTLE_SLOTS],
    ["magic", "player", MAGIC_SLOTS],
    ["inventory", "npc", INVENTORY_SLOTS],
    ["history", "player", HISTORY_SLOTS],
  ] as const;

  it.each(cases)("guard: %s (%s) only uses slots of its bento layout", (tab, kind, slots) => {
    const allowed = new Set<string>(Object.values(slots));
    const cards = skeletonCardsForTab(tab, kind);

    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(allowed.has(card.slot), `${tab}/${card.key}`).toBe(true);
    }
    expect(new Set(cards.map((card) => card.key)).size).toBe(cards.length);
  });
});

describe("CharacterSheetSkeleton — rendering and accessibility", () => {
  it("nominal: status region with aria-busy, sr-only label and the active tab in its domain color", () => {
    const html = renderSkeleton(resolveCharacterSheetSkeletonVariant("campaign", "battle"));

    expect(html).toMatch(/<div[^>]*role="status"[^>]*aria-busy="true"/);
    expect(html).toContain('<span class="sr-only">Loading character sheet…</span>');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-red");
    // NPC battle layout: affinities card, no death saves (PC only)
    expect(html).toContain('data-skeleton-card="affinities"');
    expect(html).not.toContain('data-skeleton-card="deathSaves"');
  });

  it("edge: pulse animation is disabled under prefers-reduced-motion", () => {
    const html = renderSkeleton(resolveCharacterSheetSkeletonVariant("playerSpace", null));
    const pulses = html.match(/animate-pulse/g)?.length ?? 0;

    expect(pulses).toBeGreaterThan(0);
    expect(html.match(/motion-reduce:animate-none/g)?.length).toBe(pulses);
  });

  it("guard: no focusable element and no visible text besides the sr-only label", () => {
    for (const tab of PLAYER_CHARACTER_TABS) {
      const html = renderSkeleton(resolveCharacterSheetSkeletonVariant("playerSpace", tab));

      expect(html).not.toMatch(/<(button|a|input|select|textarea)\b/);
      expect(html).not.toMatch(/tabindex=/i);
      expect(html.replace(/<span class="sr-only">[^<]*<\/span>/, "").replace(/<[^>]+>/g, "")).toBe("");
    }
  });
});

describe("CompanionsTabSkeleton — Companions tab loading (FR-character-sheet-skeleton)", () => {
  const render = (showActions: boolean) =>
    renderToStaticMarkup(
      <CompanionsTabSkeleton
        showActions={showActions}
        label="Loading companions"
      />,
    );

  it("nominal: status region with the label and three companion card placeholders", () => {
    const html = render(true);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading companions");
    expect(html.match(/aspect-\[4\/5\]/g)).toHaveLength(3);
    // Same bento grid and slots as the tab (FR-npc-player-link).
    expect(html).toContain(COMPANIONS_BENTO_GRID_CLASS);
    expect(html.split(COMPANIONS_SLOTS.companion).length - 1).toBe(3);
    expect(html).toContain(COMPANIONS_SLOTS.toolbar);
  });

  it("edge: no action placeholders when liaison actions are disabled (GM in session)", () => {
    expect(render(true)).toContain("bg-white/30");
    expect(render(false)).not.toContain("bg-white/30");
  });

  it("guard: no spinner and no focusable element", () => {
    const html = render(true);
    expect(html).not.toMatch(/<(button|a|input)\b|tabindex|animate-spin/);
  });
});
