import type { SessionParticipant } from "@/services/SessionService";

function joinedAtTime(participant: SessionParticipant): number {
    const time = Date.parse(participant.joinedAt);
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

/**
 * Ordre déterministe du lobby, identique pour tous les clients d'une même session :
 * MJ d'abord, puis `joinedAt` croissant (date invalide en dernier), égalité départagée par `userId`.
 * Ne dépend pas de l'ordre d'arrivée des événements WebSocket.
 *
 * @see FR-session-participant-labels (Lobby Card Hierarchy & Ordering)
 */
export function sortSessionLobbyParticipants(participants: readonly SessionParticipant[]): SessionParticipant[] {
    return [...participants].sort((a, b) => {
        const gmA = a.status === "gameMaster" ? 0 : 1;
        const gmB = b.status === "gameMaster" ? 0 : 1;
        if (gmA !== gmB) return gmA - gmB;

        const timeA = joinedAtTime(a);
        const timeB = joinedAtTime(b);
        if (timeA !== timeB) return timeA < timeB ? -1 : 1;

        return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
    });
}
