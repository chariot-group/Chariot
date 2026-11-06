/** @see FR-session-join-companion-visibility */

import { linkedPlayerIdOf } from "@/lib/npcPlayerLink";
import type { Character, NPC } from "@/types/character";

export function companionCountByPlayerId(npcs: NPC[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const npc of npcs) {
    const playerId = linkedPlayerIdOf(npc);
    if (!playerId) continue;
    counts[playerId] = (counts[playerId] ?? 0) + 1;
  }
  return counts;
}

export function sessionCharacterOptionAccessibleName(
  playerName: string,
  companionCount: number,
  companionCountLabel: string,
): string {
  const name = playerName.trim();
  if (companionCount <= 0) return name;
  const label = companionCountLabel.trim();
  return label.length > 0 ? `${name}, ${label}` : name;
}

export async function loadCompanionCountsForPlayers(
  playerIds: string[],
  fetchNpcsByLinkedPlayers: (ids: string[]) => Promise<NPC[]>,
): Promise<Record<string, number>> {
  const ids = [...new Set(playerIds.map((id) => id.trim()).filter((id) => id.length > 0))];
  if (ids.length === 0) return {};
  try {
    const npcs = await fetchNpcsByLinkedPlayers(ids);
    return companionCountByPlayerId(npcs);
  } catch {
    return {};
  }
}

/**
 * Orders session picker Players like the player-space sidebar (`charactersWithoutGroup`).
 * Players unknown to the sidebar follow, in fetch order; sidebar-only Players are not added.
 */
export function orderSessionCharactersLikeSidebar(characters: Character[], sidebarPlayers: Character[]): Character[] {
  if (sidebarPlayers.length === 0 || characters.length === 0) return characters;
  const sidebarIndexById = new Map<string, number>();
  sidebarPlayers.forEach((player, index) => {
    if (player?._id && !sidebarIndexById.has(player._id)) sidebarIndexById.set(player._id, index);
  });
  const rank = (character: Character) => sidebarIndexById.get(character._id) ?? Number.POSITIVE_INFINITY;
  return characters
    .map((character, fetchIndex) => ({ character, fetchIndex }))
    .sort((left, right) => rank(left.character) - rank(right.character) || left.fetchIndex - right.fetchIndex)
    .map(({ character }) => character);
}
