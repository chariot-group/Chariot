/** @see FR-npc-player-link */

import { characterDisplayName } from "@/lib/duplicateName";
import type { Character, NPC } from "@/types/character";
import { formatChallengeRating } from "@/utils/challengeRating.utils";

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

export type NpcSheetHeaderIdentity = {
  fullName: string;
  surname: string | null;
  formattedChallengeRating: string;
  experiencePoints: number;
  groupLabel: string | null;
};

/**
 * Identity fields shown on the NPC sheet header, reused by Companions cards.
 * @see FR-npc-player-link
 * @see FR-character-detail-view
 */
export function npcSheetHeaderIdentity(npc: NPC, unnamedFallback: string): NpcSheetHeaderIdentity {
  const fullName = characterDisplayName(npc) || unnamedFallback;
  const surname = typeof npc.surname === "string" ? npc.surname.trim() : "";
  const experiencePoints = npc.challenge?.experiencePoints ?? 0;
  const groupLabel = npc.groups?.[0]?.label?.trim() || null;

  return {
    fullName,
    surname: surname.length > 0 ? surname : null,
    formattedChallengeRating: formatChallengeRating(npc.challenge?.challengeRating),
    experiencePoints: Number.isFinite(experiencePoints) ? experiencePoints : 0,
    groupLabel: groupLabel && groupLabel.length > 0 ? groupLabel : null,
  };
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

export type CompanionLinkOp = {
  npc: NPC;
  linkedPlayerId: string | null;
};

/**
 * Queues a draft link/unlink. Selecting then reverting to the original value drops the op.
 * Persistence happens only when the Player form is saved.
 */
export function queueCompanionLinkOp(
  ops: CompanionLinkOp[],
  npc: NPC,
  nextLinkedPlayerId: string | null,
  originalLinkedPlayerId: string | null,
): CompanionLinkOp[] {
  const rest = ops.filter((op) => op.npc._id !== npc._id);
  const next = nextLinkedPlayerId?.trim() ? nextLinkedPlayerId.trim() : null;
  const original = originalLinkedPlayerId?.trim() ? originalLinkedPlayerId.trim() : null;
  if (next === original) {
    return rest;
  }
  return [...rest, { npc, linkedPlayerId: next }];
}

export type SidebarNpcLinkAction = "link" | "unlink" | "reassign";

/**
 * NPC-only menu actions for Mes personnages. Players get none.
 * @see FR-sidebar-npc-link
 */
export function sidebarNpcLinkActions(character: Character): SidebarNpcLinkAction[] {
  if (!character?._id || "progression" in character) return [];
  return linkedPlayerIdOf(character) ? ["unlink", "reassign"] : ["link"];
}

/**
 * Action ids for the Player-space character menu (context + overflow).
 * @see FR-sidebar-npc-link
 * @see FR-sidebar-context-actions
 */
export function playerSpaceSidebarActionIds(
  character: Character,
  options: { actionsDisabled: boolean },
): string[] {
  const ids = ["exportPdf"];
  if (options.actionsDisabled) return ids;
  ids.push(...sidebarNpcLinkActions(character));
  ids.push("duplicate", "edit", "delete");
  return ids;
}

/**
 * Visible Mes personnages Players that an NPC can be linked to.
 * @see FR-sidebar-npc-link
 */
export function playersForNpcLinkPicker(
  players: Character[],
  options?: { excludePlayerId?: string | null },
): Character[] {
  const exclude = options?.excludePlayerId?.trim() || null;
  const next = players.filter((player) => {
    if (!player?._id) return false;
    if (!("progression" in player)) return false;
    if (exclude && player._id === exclude) return false;
    return true;
  });
  return next.sort((left, right) =>
    characterDisplayName(left).localeCompare(characterDisplayName(right), undefined, { sensitivity: "base" }),
  );
}

/** Reassignment of an already-linked NPC requires confirmation. */
export function requiresNpcLinkReassignmentConfirm(
  currentLinkedPlayerId: string | null | undefined,
  nextPlayerId: string,
): boolean {
  const current = currentLinkedPlayerId?.trim() || null;
  const next = nextPlayerId.trim();
  if (!current || !next) return false;
  return current !== next;
}

export function npcLinkedPlayerUpdatePayload(linkedPlayerId: string | null): {
  linkedPlayerId: string | null;
} {
  const next = linkedPlayerId?.trim() ? linkedPlayerId.trim() : null;
  return { linkedPlayerId: next };
}

/**
 * Persists `linkedPlayerId` immediately (sidebar, not Companions draft).
 * @see FR-sidebar-npc-link
 */
export async function persistSidebarNpcLinkedPlayer(
  npc: NPC,
  linkedPlayerId: string | null,
  updateNpc: (id: string, payload: { linkedPlayerId: string | null }) => Promise<NPC>,
): Promise<NPC> {
  if (!npc._id?.trim()) {
    throw new Error("missing-npc-id");
  }
  return updateNpc(npc._id, npcLinkedPlayerUpdatePayload(linkedPlayerId));
}
