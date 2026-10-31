import { describe, expect, it } from "vitest";
import {
  CHARACTER_TABS,
  PLAYER_CHARACTER_TABS,
  TAB_COLORS,
  tabsForCharacterSheet,
} from "@/components/character/CharacterTabs";

describe("FR-npc-player-link — character tabs", () => {
  it("nominal: Player sheets in Player space expose a companions tab", () => {
    expect(tabsForCharacterSheet(true, true)).toContain("companions");
    expect(PLAYER_CHARACTER_TABS).toContain("companions");
    expect(TAB_COLORS.companions).toBe("purple");
  });

  it("edge: NPC sheets and GM-space Player sheets keep the five base tabs", () => {
    expect(tabsForCharacterSheet(false, true)).toEqual([...CHARACTER_TABS]);
    expect(tabsForCharacterSheet(true, false)).toEqual([...CHARACTER_TABS]);
    expect(CHARACTER_TABS).toEqual(["general", "battle", "magic", "inventory", "history"]);
    expect(CHARACTER_TABS).not.toContain("companions");
  });

  it("failure: GM space never adds companions even for a Player character", () => {
    expect(tabsForCharacterSheet(true, false)).not.toContain("companions");
    expect(tabsForCharacterSheet(true, false, false)).not.toContain("companions");
  });
});

describe("FR-session-player-companion-combatants — session GM companions tab", () => {
  it("nominal: assigned Player sheets expose companions for the session GM", () => {
    expect(tabsForCharacterSheet(true, false, true)).toContain("companions");
  });

  it("edge: NPC sheets never expose companions even for the session GM", () => {
    expect(tabsForCharacterSheet(false, false, true)).not.toContain("companions");
    expect(tabsForCharacterSheet(false, true, true)).not.toContain("companions");
  });
});
