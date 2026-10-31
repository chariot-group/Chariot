/** @see FR-player-delete-companion-choice */

import type { AppDispatch } from "@/store";
import {
  removeCharacterWithoutGroup,
  removePlayerSpaceNpc,
  upsertPlayerSpaceNpc,
} from "@/store/slices/characterSlice";
import { removeCharacterFromGroup } from "@/store/slices/groupSlice";
import CharacterService from "@/services/CharacterService";
import type { NPC } from "@/types/character";
import { companionsOfPlayer } from "@/lib/sessionPlayerCompanions";

export function linkedCompanionsForPlayer(linkedNpcs: NPC[], playerId: string): NPC[] {
  return companionsOfPlayer(linkedNpcs, playerId);
}

export async function deletePlayerCharacterWithCompanionChoice(
  playerId: string,
  deleteLinkedCompanions: boolean,
): Promise<void> {
  await CharacterService.deleteCharacter(playerId, { deleteLinkedCompanions });
}

export function syncReduxAfterPlayerDelete(
  dispatch: AppDispatch,
  options: {
    playerId: string;
    deleteLinkedCompanions: boolean;
    companions: NPC[];
    campaignGroupId?: string;
  },
): void {
  const { playerId, deleteLinkedCompanions, companions, campaignGroupId } = options;

  if (campaignGroupId) {
    dispatch(removeCharacterFromGroup({ groupId: campaignGroupId, characterId: playerId }));
  } else {
    dispatch(removeCharacterWithoutGroup(playerId));
  }

  if (deleteLinkedCompanions) {
    for (const npc of companions) {
      dispatch(removePlayerSpaceNpc(npc._id));
      const groupIds = (npc.groups ?? []) as string[];
      for (const groupId of groupIds) {
        if (!groupId) continue;
        dispatch(removeCharacterFromGroup({ groupId, characterId: npc._id }));
      }
    }
    return;
  }

  for (const npc of companions) {
    dispatch(upsertPlayerSpaceNpc({ ...npc, linkedPlayerId: null }));
  }
}
