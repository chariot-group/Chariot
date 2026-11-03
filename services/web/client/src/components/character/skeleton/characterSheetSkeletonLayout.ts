/**
 * Character sheet skeleton: variant guessed before the backend responds, and the placeholder
 * cards of each tab, placed with the tab's own bento slots.
 *
 * @see FR-character-sheet-skeleton
 */
import {
  CHARACTER_TABS,
  PLAYER_CHARACTER_TABS,
  type CharacterTab,
} from "@/components/character/CharacterTabs";
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

export type CharacterSheetRoute = "campaign" | "playerSpace";
export type CharacterSheetSkeletonKind = "player" | "npc";

export interface CharacterSheetSkeletonVariant {
  kind: CharacterSheetSkeletonKind;
  activeTab: CharacterTab;
  tabs: readonly CharacterTab[];
}

/**
 * Campaign route → NPC; player space → PC (most likely); `tab=companions` → PC (only PCs have it).
 * Unknown or missing tab falls back to General, like the sheet.
 */
export function resolveCharacterSheetSkeletonVariant(
  route: CharacterSheetRoute,
  requestedTab: string | null | undefined,
): CharacterSheetSkeletonVariant {
  const kind: CharacterSheetSkeletonKind =
    requestedTab === "companions" || route === "playerSpace" ? "player" : "npc";
  const tabs = kind === "player" ? PLAYER_CHARACTER_TABS : CHARACTER_TABS;
  const activeTab = tabs.find((tab) => tab === requestedTab) ?? "general";
  return { kind, activeTab, tabs };
}

/**
 * Body of a placeholder card:
 * - `lines`: label/value lines spread over the card height;
 * - `cells`: tinted cells on `columns` columns;
 * - `rows`: list rows (actions, spells, abilities).
 */
export type SkeletonCardBody =
  | { type: "lines"; count: number }
  | { type: "cells"; count: number; columns: 2 | 3 | 5 }
  | { type: "rows"; count: number }
  | { type: "tile" };

export interface SkeletonCard {
  key: string;
  slot: string;
  body: SkeletonCardBody;
  /** Avatar placeholder next to the lines (Character card). */
  avatar?: boolean;
}

const tiles = (slot: string, prefix: string, count: number): SkeletonCard[] =>
  Array.from({ length: count }, (_, index) => ({ key: `${prefix}-${index}`, slot, body: { type: "tile" } }));

const PLAYER_GENERAL: SkeletonCard[] = [
  { key: "character", slot: PLAYER_VIEW_SLOTS.character, body: { type: "lines", count: 5 }, avatar: true },
  { key: "statistics", slot: PLAYER_VIEW_SLOTS.statistics, body: { type: "cells", count: 3, columns: 3 } },
  ...tiles(PLAYER_VIEW_SLOTS.tile, "tile", 4),
  { key: "abilityScores", slot: PLAYER_VIEW_SLOTS.abilityScores, body: { type: "cells", count: 6, columns: 3 } },
  { key: "savingThrows", slot: PLAYER_VIEW_SLOTS.savingThrows, body: { type: "cells", count: 6, columns: 2 } },
  ...tiles(PLAYER_VIEW_SLOTS.sideTile, "sideTile", 2),
  { key: "skills", slot: PLAYER_VIEW_SLOTS.skills, body: { type: "lines", count: 9 } },
  { key: "proficiencies", slot: PLAYER_VIEW_SLOTS.proficiencies, body: { type: "lines", count: 4 } },
  { key: "abilities", slot: PLAYER_VIEW_SLOTS.abilities, body: { type: "rows", count: 3 } },
];

const NPC_GENERAL: SkeletonCard[] = [
  { key: "character", slot: NPC_VIEW_SLOTS.character, body: { type: "lines", count: 3 }, avatar: true },
  { key: "statistics", slot: NPC_VIEW_SLOTS.statistics, body: { type: "cells", count: 3, columns: 3 } },
  { key: "abilityScores", slot: NPC_VIEW_SLOTS.abilityScores, body: { type: "cells", count: 6, columns: 3 } },
  { key: "savingThrows", slot: NPC_VIEW_SLOTS.savingThrows, body: { type: "cells", count: 6, columns: 2 } },
  { key: "proficiencies", slot: NPC_VIEW_SLOTS.proficiencies, body: { type: "lines", count: 4 } },
  { key: "skills", slot: NPC_VIEW_SLOTS.skills, body: { type: "lines", count: 6 } },
  ...tiles(NPC_VIEW_SLOTS.tile, "tile", 2),
  { key: "abilities", slot: NPC_VIEW_SLOTS.abilities, body: { type: "rows", count: 3 } },
];

const PLAYER_BATTLE: SkeletonCard[] = [
  { key: "statistics", slot: PLAYER_BATTLE_SLOTS.statistics, body: { type: "cells", count: 6, columns: 3 } },
  { key: "savingThrows", slot: PLAYER_BATTLE_SLOTS.savingThrows, body: { type: "cells", count: 6, columns: 2 } },
  { key: "deathSaves", slot: PLAYER_BATTLE_SLOTS.deathSaves, body: { type: "lines", count: 2 } },
  { key: "affinities", slot: PLAYER_BATTLE_SLOTS.affinities, body: { type: "lines", count: 2 } },
  { key: "actions", slot: PLAYER_BATTLE_SLOTS.actions, body: { type: "rows", count: 4 } },
  { key: "abilities", slot: PLAYER_BATTLE_SLOTS.abilities, body: { type: "rows", count: 4 } },
];

const NPC_BATTLE: SkeletonCard[] = [
  { key: "statistics", slot: NPC_BATTLE_SLOTS.statistics, body: { type: "cells", count: 6, columns: 3 } },
  { key: "savingThrows", slot: NPC_BATTLE_SLOTS.savingThrows, body: { type: "cells", count: 6, columns: 3 } },
  { key: "affinities", slot: NPC_BATTLE_SLOTS.affinities, body: { type: "lines", count: 2 } },
  { key: "actions", slot: NPC_BATTLE_SLOTS.actions, body: { type: "rows", count: 4 } },
  { key: "abilities", slot: NPC_BATTLE_SLOTS.abilities, body: { type: "rows", count: 4 } },
];

const MAGIC: SkeletonCard[] = [
  { key: "spellcasting", slot: MAGIC_SLOTS.spellcasting, body: { type: "cells", count: 4, columns: 2 } },
  { key: "spells", slot: MAGIC_SLOTS.spells, body: { type: "rows", count: 6 } },
];

const INVENTORY: SkeletonCard[] = [
  { key: "coins", slot: INVENTORY_SLOTS.coins, body: { type: "cells", count: 5, columns: 5 } },
  { key: "equipment", slot: INVENTORY_SLOTS.equipment, body: { type: "lines", count: 5 } },
  { key: "treasure", slot: INVENTORY_SLOTS.treasure, body: { type: "lines", count: 5 } },
];

const HISTORY: SkeletonCard[] = [
  { key: "appearance", slot: HISTORY_SLOTS.appearance, body: { type: "cells", count: 6, columns: 3 } },
  { key: "description", slot: HISTORY_SLOTS.description, body: { type: "lines", count: 4 } },
  ...["personalityTraits", "ideals", "bonds", "flaws"].map(
    (key): SkeletonCard => ({ key, slot: HISTORY_SLOTS.personality, body: { type: "lines", count: 3 } }),
  ),
  { key: "alliesAndOrgs", slot: HISTORY_SLOTS.alliesAndOrgs, body: { type: "lines", count: 4 } },
  { key: "backstory", slot: HISTORY_SLOTS.backstory, body: { type: "lines", count: 4 } },
];

/** Placeholder cards of a bento tab (`companions` has its own list layout). */
export function skeletonCardsForTab(
  tab: Exclude<CharacterTab, "companions">,
  kind: CharacterSheetSkeletonKind,
): SkeletonCard[] {
  switch (tab) {
    case "general":
      return kind === "player" ? PLAYER_GENERAL : NPC_GENERAL;
    case "battle":
      return kind === "player" ? PLAYER_BATTLE : NPC_BATTLE;
    case "magic":
      return MAGIC;
    case "inventory":
      return INVENTORY;
    case "history":
      return HISTORY;
  }
}
