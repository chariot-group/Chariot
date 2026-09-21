/** @see FR-npc-player-link */

import type { Character, NPC } from "@/types/character";

export function linkedPlayerIdOf(character: Character | NPC | null | undefined): string | null {
  if (!character) return null;
  const value = (character as NPC).linkedPlayerId;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasGroups(character: Character): boolean {
  return Array.isArray(character.groups) && character.groups.length > 0;
}

export function isUnlinkedWithoutGroupNpc(character: Character): character is NPC {
  return !linkedPlayerIdOf(character) && !hasGroups(character);
}

/** Unlinked NPCs without a group — the Player-space picker for linking. */
export function playerSpaceNpcsForLinkPicker(npcs: NPC[]): NPC[] {
  return npcs.filter((npc) => Boolean(npc?._id) && isUnlinkedWithoutGroupNpc(npc));
}

export type PlayerSidebarRow =
  | { type: "player"; character: Character; companions: NPC[] }
  | { type: "npc"; character: NPC };

/**
 * Players with nested linked NPCs, then unlinked without-group NPCs as root rows.
 * A linked NPC never also appears as a root row.
 */
export function buildPlayerSidebarRows(
  players: Character[],
  unlinkedNpcs: NPC[],
  linkedNpcs: NPC[],
): PlayerSidebarRow[] {
  const companionsByPlayerId = new Map<string, NPC[]>();
  const linkedIds = new Set<string>();

  for (const npc of linkedNpcs) {
    const playerId = linkedPlayerIdOf(npc);
    if (!playerId || !npc._id) continue;
    linkedIds.add(npc._id);
    const list = companionsByPlayerId.get(playerId) ?? [];
    list.push(npc);
    companionsByPlayerId.set(playerId, list);
  }

  const rows: PlayerSidebarRow[] = players
    .filter((player) => Boolean(player?._id))
    .map((player) => ({
      type: "player" as const,
      character: player,
      companions: companionsByPlayerId.get(player._id) ?? [],
    }));

  for (const npc of unlinkedNpcs) {
    if (!npc?._id || linkedIds.has(npc._id) || linkedPlayerIdOf(npc)) continue;
    rows.push({ type: "npc", character: npc });
  }

  return rows;
}

export function characterKindLabel(
  character: Character,
  labels: { player: string; npc: string },
): string {
  return "progression" in character ? labels.player : labels.npc;
}

/**
 * Updates the companions list after a link or unlink without refetching.
 * @see FR-npc-player-link
 */
export function applyCompanionLinkChange(
  companions: NPC[],
  updated: NPC,
  playerId: string,
): NPC[] {
  const withoutCurrent = companions.filter((npc) => npc._id !== updated._id);
  if (linkedPlayerIdOf(updated) === playerId) {
    return [...withoutCurrent, updated];
  }
  return withoutCurrent;
}
