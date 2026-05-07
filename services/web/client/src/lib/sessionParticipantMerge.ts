import type { SessionParticipant } from '@/services/SessionService';

/**
 * Fusionne un roster participant précédent (ex. Redux ou dernier snapshot WS) avec un snapshot récent
 * (état page session ou réponse HTTP) sans perdre de lignes ni les `characterId` connus uniquement côté client.
 */
export function mergeParticipantsPreserveCharacterIds(
    previous: SessionParticipant[],
    fetched: SessionParticipant[],
): SessionParticipant[] {
    const prevByUserId = new Map(previous.map((p) => [p.userId, p]));
    const fetchedIds = new Set(fetched.map((p) => p.userId));

    const applyCharPreserve = (fp: SessionParticipant): SessionParticipant => {
        const prev = prevByUserId.get(fp.userId);
        const fetchedHasChar = fp.characterId != null && String(fp.characterId).trim().length > 0;
        if (fetchedHasChar) return fp;
        const prevChar =
            prev?.characterId != null && String(prev.characterId).trim().length > 0 ? prev.characterId : null;
        if (prevChar != null) return { ...fp, characterId: prevChar };
        return fp;
    };

    const merged: SessionParticipant[] = fetched.map((fp) => applyCharPreserve(fp));
    for (const p of previous) {
        if (!fetchedIds.has(p.userId)) {
            merged.push(p);
        }
    }

    return merged;
}
