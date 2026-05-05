import type { SessionParticipant } from "@/services/SessionService";

/**
 * Le MJ est exclu de l’émission `session:character-sheet-updated` ; ce garde-fou
 * cible le joueur qui a ce personnage au roster.
 */
export function shouldNotifyPlayerOfGmCharacterSheetUpdate(
    characterId: string,
    userKeycloakId: string | undefined,
    participants: SessionParticipant[],
): boolean {
    const cid = characterId.trim();
    if (!cid || !userKeycloakId) return false;
    const me = participants.find((p) => p.userId === userKeycloakId);
    if (!me || me.status === "gameMaster") return false;
    return me.characterId === cid;
}
