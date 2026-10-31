/** @see FR-session-player-companion-combatants — sidebar / lobby companion labels after sheet sync */

import CharacterService from "@/services/CharacterService";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import type { AppDispatch } from "@/store/hooks";
import type { RootState } from "@/store";
import { upsertSessionCompanionNpc } from "@/store/slices/sessionSlice";
import type { NPC } from "@/types/character";
import { withNormalizedLinkedPlayerId } from "@/lib/sessionPlayerCompanions";

export function isDerivedSessionCompanionId(state: RootState, characterId: string): boolean {
  const id = characterId.trim();
  if (!id) return false;
  return (state.session.sessionCompanionNpcs ?? []).some((npc) => npc._id === id);
}

export function isCachedPlayerLinkedNpcId(state: RootState, characterId: string): boolean {
  const id = characterId.trim();
  if (!id) return false;
  return (state.character.linkedNpcs ?? []).some((npc) => npc._id === id);
}

export function shouldRefreshCompanionSidebarCaches(state: RootState, characterId: string): boolean {
  return isDerivedSessionCompanionId(state, characterId) || isCachedPlayerLinkedNpcId(state, characterId);
}

/**
 * Recharge une fiche PNJ liée et met à jour les caches sidebar (MJ session + espace joueur).
 */
export async function refreshCompanionSidebarCachesFromRemoteSheet(
  characterId: string,
  sessionCode: string,
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<void> {
  const cid = characterId.trim();
  const code = sessionCode.trim();
  if (!cid || !code) return;

  const before = getState();
  if (!shouldRefreshCompanionSidebarCaches(before, cid)) return;

  const inSessionCompanions = isDerivedSessionCompanionId(before, cid);
  const inLinked = isCachedPlayerLinkedNpcId(before, cid);

  let character: Awaited<ReturnType<typeof CharacterService.getCharacterById>>;
  try {
    character = await CharacterService.getCharacterById(cid, { sessionCode: code });
  } catch {
    return;
  }

  if (!character || "progression" in character) return;
  const npc = character as NPC;

  if (inSessionCompanions) {
    dispatch(upsertSessionCompanionNpc(withNormalizedLinkedPlayerId(npc)));
  }
  if (inLinked) {
    dispatch(upsertPlayerSpaceNpc(npc));
  }
}
