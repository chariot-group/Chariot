import characterService from "@/services/CharacterService";
import type { SessionParticipant } from "@/services/SessionService";
import type { Player } from "@/types/character";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import { fetchSessionParticipantDisplayName } from "@/lib/sessionParticipantDisplayNames";

export const SESSION_PARTICIPANTS_GROUP_LABEL = "Participants session";

export type SessionParticipantsGroupCharacter = {
    _id: string;
    firstname?: string;
    lastname?: string;
    surname?: string;
    avatar?: string;
    createdBy?: string;
    stats?: {
        currentHitPoints?: number;
        maxHitPoints?: number;
        tempHitPoints?: number;
        armorClass?: number;
        initiative?: number;
    };
    challenge?: {
        challengeRating?: number | string;
    };
    profile?: {
        type?: string;
    };
    progression?: {
        level?: number;
    };
};

export type SessionParticipantsBattleGroup = {
    _id: string;
    label: string;
    campaignId: string;
    createdAt: string;
    updatedAt: string;
    characters: SessionParticipantsGroupCharacter[];
};

/** FR-024 — libellé de repli pour une ligne tracker sans fiche personnage chargée. */
export function resolveSessionParticipantBattleFallbackName(
    userId: string,
    displayNames: Record<string, string>,
): string {
    const known = displayNames[userId]?.trim();
    if (known && known !== SESSION_PARTICIPANT_NAME_LOADING) {
        return known;
    }
    return SESSION_PARTICIPANT_NAME_LOADING;
}

async function enrichParticipantDisplayNames(
    participants: SessionParticipant[],
    displayNames: Record<string, string>,
): Promise<Record<string, string>> {
    const enriched = { ...displayNames };
    const missing = participants.filter((participant) => {
        if (participant.status === "gameMaster") return false;
        const known = enriched[participant.userId]?.trim();
        return !known || known === SESSION_PARTICIPANT_NAME_LOADING;
    });

    await Promise.all(
        missing.map(async (participant) => {
            enriched[participant.userId] = await fetchSessionParticipantDisplayName(participant.userId);
        }),
    );

    return enriched;
}

export async function buildSessionParticipantsGroup(
    allGroups: Array<{ characters?: SessionParticipantsGroupCharacter[] }>,
    participants: SessionParticipant[],
    campaignId: string,
    participantDisplayNames: Record<string, string>,
    sessionCode?: string | null,
): Promise<SessionParticipantsBattleGroup> {
    const nonGameMasterParticipants = participants.filter((participant) => participant.status !== "gameMaster");
    const resolvedDisplayNames = await enrichParticipantDisplayNames(
        nonGameMasterParticipants,
        participantDisplayNames,
    );

    const characterById = new Map<string, SessionParticipantsGroupCharacter>();
    allGroups.forEach((group) => {
        (group.characters ?? []).forEach((character) => {
            characterById.set(character._id, character);
        });
    });

    const missingCharacterIds = Array.from(
        new Set(
            nonGameMasterParticipants
                .map((participant) => participant.characterId)
                .filter(
                    (characterId): characterId is string =>
                        Boolean(characterId && !characterById.has(characterId)),
                ),
        ),
    );

    const fetchedCharacters = await Promise.allSettled(
        missingCharacterIds.map((characterId) =>
            characterService.getCharacterById(characterId, { sessionCode }),
        ),
    );

    const fetchedCharacterById = new Map<string, SessionParticipantsGroupCharacter>();
    fetchedCharacters.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const character = result.value;
        fetchedCharacterById.set(character._id, {
            _id: character._id,
            firstname: character.firstname,
            lastname: character.lastname,
            surname: character.surname,
            createdBy: character.createdBy,
            progression: (character as Player).progression,
        });
    });

    const uniqueCharacters = new Map<string, SessionParticipantsGroupCharacter>();
    nonGameMasterParticipants.forEach((participant) => {
        const characterId = participant.characterId ?? `session-participant-${participant.id}`;
        const existingCharacter = participant.characterId
            ? (characterById.get(participant.characterId) ??
              fetchedCharacterById.get(participant.characterId))
            : undefined;

        uniqueCharacters.set(
            characterId,
            existingCharacter ?? {
                _id: characterId,
                surname: resolveSessionParticipantBattleFallbackName(
                    participant.userId,
                    resolvedDisplayNames,
                ),
                createdBy: participant.userId,
            },
        );
    });

    const now = new Date().toISOString();

    return {
        _id: SESSION_PARTICIPANTS_GROUP_ID,
        label: SESSION_PARTICIPANTS_GROUP_LABEL,
        campaignId,
        createdAt: now,
        updatedAt: now,
        characters: Array.from(uniqueCharacters.values()),
    };
}
