/** @see FR-player-duplicate-companion-choice */

import type { AppDispatch } from "@/store";
import { upsertPlayerSpaceNpc } from "@/store/slices/characterSlice";
import { addCharacterToGroup } from "@/store/slices/groupSlice";
import CharacterService from "@/services/CharacterService";
import { characterDisplayName, nextAvailableDuplicateName } from "@/lib/duplicateName";
import { linkedCompanionsForPlayer } from "@/lib/playerDeleteCompanions";
import type { Character, NPC } from "@/types/character";

export type PlayerDuplicateCompanionMode = "playerOnly" | "copyCompanions" | "moveCompanions";

export { linkedCompanionsForPlayer };

export function effectiveDuplicateCompanionMode(
  mode: PlayerDuplicateCompanionMode,
  count: number,
): PlayerDuplicateCompanionMode {
  if (mode === "moveCompanions" && count > 1) return "playerOnly";
  return mode;
}

export async function duplicateLinkedCompanionCopy(
  companionId: string,
  newPlayerId: string,
  existingNames: readonly string[],
): Promise<{ npc: NPC; nextNames: string[] }> {
  const full = await CharacterService.getCharacterById(companionId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, createdBy, deletedAt, ...rest } = full;
  const groups = (full.groups ?? []) as string[];
  const sourceDisplayName = characterDisplayName(full as NPC);
  const copyDisplayName = nextAvailableDuplicateName(sourceDisplayName, existingNames);
  const payload = {
    ...rest,
    firstname: copyDisplayName,
    lastname: "",
    groups,
    linkedPlayerId: newPlayerId,
  };
  const created = (await CharacterService.createCharacter("npcs", payload as typeof rest)) as NPC;
  return { npc: created, nextNames: [...existingNames, copyDisplayName] };
}

export async function moveLinkedCompanionsToPlayer(
  companions: NPC[],
  newPlayerId: string,
): Promise<NPC[]> {
  const updated: NPC[] = [];
  for (const companion of companions) {
    const npc = (await CharacterService.updateCharacter("npcs", companion._id, {
      linkedPlayerId: newPlayerId,
    })) as NPC;
    updated.push(npc);
  }
  return updated;
}

export function syncReduxAfterCompanionNpcCreate(dispatch: AppDispatch, npc: NPC): void {
  dispatch(upsertPlayerSpaceNpc(npc));
  const groupIds = (npc.groups ?? []) as string[];
  for (const groupId of groupIds) {
    if (!groupId) continue;
    dispatch(
      addCharacterToGroup({
        groupId,
        character: {
          _id: npc._id,
          firstname: npc.firstname,
          lastname: npc.lastname,
          surname: npc.surname,
        },
      }),
    );
  }
}

export function syncReduxAfterCompanionMove(dispatch: AppDispatch, companions: NPC[]): void {
  for (const npc of companions) {
    dispatch(upsertPlayerSpaceNpc(npc));
  }
}

export async function applyCompanionModeAfterPlayerCreated(
  options: {
    mode: PlayerDuplicateCompanionMode;
    newPlayerId: string;
    companions: NPC[];
    existingNpcNames: readonly string[];
  },
): Promise<{ createdCompanions: NPC[]; movedCompanions: NPC[]; nextNpcNames: string[] }> {
  const { mode, newPlayerId, companions } = options;
  let names = [...options.existingNpcNames];
  const createdCompanions: NPC[] = [];
  const movedCompanions: NPC[] = [];

  if (mode === "playerOnly" || companions.length === 0) {
    return { createdCompanions, movedCompanions, nextNpcNames: names };
  }

  if (mode === "moveCompanions") {
    const moved = await moveLinkedCompanionsToPlayer(companions, newPlayerId);
    movedCompanions.push(...moved);
    return { createdCompanions, movedCompanions, nextNpcNames: names };
  }

  for (const companion of companions) {
    const { npc, nextNames } = await duplicateLinkedCompanionCopy(
      companion._id,
      newPlayerId,
      names,
    );
    createdCompanions.push(npc);
    names = nextNames;
  }

  return { createdCompanions, movedCompanions, nextNpcNames: names };
}

export type PlayerDuplicateSource = Character & { _id: string };

export async function createPlayerDuplicateFromFull(
  full: PlayerDuplicateSource,
  copyName: string,
  targetGroups: string[],
): Promise<Character> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, createdBy, deletedAt, groups, ...rest } = full;
  const payload = { ...rest, firstname: copyName, lastname: "", groups: targetGroups };
  return CharacterService.createCharacter("players", payload as typeof rest) as Promise<Character>;
}
