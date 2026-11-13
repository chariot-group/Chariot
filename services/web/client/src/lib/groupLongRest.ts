/** @see FR-character-long-rest */

import type { CharacterType, CharacterWriteData } from "@/services/CharacterService";
import type { NPC, Player } from "@/types/character";
import { buildCharacterLongRestUpdatePayload } from "@/utils/rest.utils";

export interface GroupLongRestDeps {
    fetchCharacter: (characterId: string, sessionCode: string | null) => Promise<Player | NPC>;
    updateCharacter: (
        type: CharacterType,
        characterId: string,
        data: CharacterWriteData,
        sessionCode: string | null,
    ) => Promise<Player | NPC>;
}

export interface GroupLongRestInput {
    characterIds: string[];
    currentUserId: string | null;
    /** Code OTP de la session lancée, `null` hors session. */
    sessionCode: string | null;
}

export interface GroupLongRestResult {
    rested: Array<Player | NPC>;
    skipped: number;
}

function isPlayerCharacter(character: Player | NPC): character is Player {
    return "progression" in character;
}

/**
 * Applique un repos long à chaque personnage du groupe. Hors session, seuls les personnages
 * du MJ sont reposés (un PJ d'espace joueur ne se repose jamais hors session). En session,
 * l'API décide pour les personnages autorisés par la session. Un échec n'interrompt pas les autres.
 */
export async function applyGroupLongRest(
    { characterIds, currentUserId, sessionCode }: GroupLongRestInput,
    deps: GroupLongRestDeps,
): Promise<GroupLongRestResult> {
    const code = sessionCode?.trim() || null;
    const ids = Array.from(new Set(characterIds.filter(Boolean)));

    const outcomes = await Promise.allSettled(
        ids.map(async (id) => {
            const character = await deps.fetchCharacter(id, code);
            const isOwn = currentUserId != null && character.createdBy === currentUserId;
            if (!isOwn && !code) return null;
            const type: CharacterType = isPlayerCharacter(character) ? "players" : "npcs";
            return deps.updateCharacter(type, id, buildCharacterLongRestUpdatePayload(character), code);
        }),
    );

    const rested: Array<Player | NPC> = [];
    for (const outcome of outcomes) {
        if (outcome.status === "fulfilled" && outcome.value) rested.push(outcome.value);
    }
    return { rested, skipped: ids.length - rested.length };
}
