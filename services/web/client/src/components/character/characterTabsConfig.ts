/**
 * Character sheet tab ids, free of UI dependencies so loading skeletons (and the auth gate,
 * FR-web-first-load-performance) can use them without pulling the tab components.
 */
export const CHARACTER_TABS = ["general", "battle", "magic", "inventory", "history"] as const;
export type BaseCharacterTab = (typeof CHARACTER_TABS)[number];
export type CharacterTab = BaseCharacterTab | "companions";
export const PLAYER_CHARACTER_TABS: CharacterTab[] = [...CHARACTER_TABS, "companions"];

/** @see FR-npc-player-link — Companions tab is Player-space Player sheets, plus session-GM assigned Players. */
export function tabsForCharacterSheet(
  isPlayerCharacter: boolean,
  isPlayerSpace: boolean,
  showSessionGmCompanionsTab = false,
): readonly CharacterTab[] {
  return isPlayerCharacter && (isPlayerSpace || showSessionGmCompanionsTab) ? PLAYER_CHARACTER_TABS : CHARACTER_TABS;
}
