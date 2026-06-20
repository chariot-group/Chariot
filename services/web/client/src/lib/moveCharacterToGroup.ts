import CharacterService from "@/services/CharacterService";
import { isPlayer } from "@/utils/global.utils";

function groupRefToId(group: { _id: string } | string): string {
  return typeof group === "string" ? group : group._id;
}

/**
 * Déplace un personnage d'un groupe vers un autre (groupes actifs uniquement côté UI).
 */
export async function moveCharacterToGroup(
  characterId: string,
  fromGroupId: string,
  toGroupId: string,
): Promise<void> {
  const character = await CharacterService.getCharacterById(characterId);
  const type = isPlayer(character) ? "players" : "npcs";
  const currentGroupIds = (character.groups ?? []).map(groupRefToId);
  const newGroups = [...new Set([...currentGroupIds.filter((id) => id !== fromGroupId), toGroupId])];

  await CharacterService.updateCharacter(type, characterId, { groups: newGroups });
}
