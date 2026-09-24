/** @see FR-session-player-companion-combatants */

import { characterDisplayName } from "@/lib/duplicateName";
import { linkedPlayerIdOf } from "@/lib/npcPlayerLink";
import { normalizeCharacterId } from "@/lib/normalizeCharacterId";
import type { SessionParticipant } from "@/services/SessionService";
import type { NPC } from "@/types/character";

/** PJ assigné sur le roster session (joueur ou MJ avec un personnage choisi). */
export function isPlayerOnSessionRoster(
  participants: SessionParticipant[],
  playerCharacterId: string,
): boolean {
  const target = normalizeCharacterId(playerCharacterId);
  if (!target) return false;
  return participants.some(
    (participant) => normalizeCharacterId(participant.characterId) === target,
  );
}

export function assignedPlayerCharacterIds(participants: SessionParticipant[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const participant of participants) {
    const characterId = normalizeCharacterId(participant.characterId);
    if (!characterId || seen.has(characterId)) continue;
    seen.add(characterId);
    ids.push(characterId);
  }
  return ids;
}

export function assignedPlayerIdsSignature(playerIds: string[]): string {
  return [...playerIds].sort().join("|");
}

export function companionsGroupedByPlayerId(npcs: NPC[]): Record<string, NPC[]> {
  const grouped: Record<string, NPC[]> = {};
  for (const npc of npcs) {
    const playerId = linkedPlayerIdOf(npc);
    if (!playerId) continue;
    (grouped[playerId] ??= []).push(npc);
  }
  return grouped;
}

export function companionNamesLine(npcs: NPC[]): string {
  return npcs
    .map((npc) => characterDisplayName(npc).trim())
    .filter((name) => name.length > 0)
    .join(", ");
}

export function companionCharacterIds(npcs: NPC[]): string[] {
  return npcs.map((npc) => npc._id).filter((id) => id.length > 0);
}

export function ungroupedSessionCompanions(
  npcs: NPC[],
  grouped: Record<string, NPC[]>,
): NPC[] {
  const nestedIds = new Set(
    Object.values(grouped).flatMap((list) => list.map((npc) => npc._id).filter(Boolean)),
  );
  return npcs.filter((npc) => Boolean(npc._id) && !nestedIds.has(npc._id));
}

export function companionsOfPlayer(npcs: NPC[], playerId: string): NPC[] {
  const target = normalizeCharacterId(playerId);
  if (!target) return [];
  return npcs.filter((npc) => linkedPlayerIdOf(npc) === target);
}

export function withNormalizedLinkedPlayerId(npc: NPC): NPC {
  const linkedPlayerId = linkedPlayerIdOf(npc);
  return npc.linkedPlayerId === linkedPlayerId ? npc : { ...npc, linkedPlayerId };
}

export function diffCharacterIds(previous: string[], next: string[]): { added: string[]; removed: string[] } {
  const prev = new Set(previous);
  const nxt = new Set(next);
  return {
    added: next.filter((id) => !prev.has(id)),
    removed: previous.filter((id) => !nxt.has(id)),
  };
}

export function companionTrackerRowIdsToRemove(
  rows: Array<{ id: string; characterId: string; isPlayerCompanion?: boolean }>,
  removedCompanionIds: string[],
): string[] {
  const removed = new Set(removedCompanionIds);
  return rows
    .filter((row) => row.isPlayerCompanion === true && removed.has(row.characterId))
    .map((row) => row.id);
}
