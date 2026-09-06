/**
 * Décide quel toast afficher quand un participant quitte la session.
 * Les toasts leave/disconnect sont centralisés dans SessionCharacterSyncClient
 * pour éviter les doublons avec useSessionSocket (lobby modal toujours monté).
 *
 * @see FR-session-websocket-lifecycle
 */

export type ParticipantLeftToastKind = "none" | "viewingCharacter" | "leftSession";

export function resolveParticipantLeftToastKind(input: {
    leftUserId: string;
    currentUserId: string | null | undefined;
    isCurrentUserGm: boolean;
    leftCharacterId: string | null | undefined;
    viewingCharacterId: string | null | undefined;
}): ParticipantLeftToastKind {
    if (!input.leftUserId || input.leftUserId === input.currentUserId) {
        return "none";
    }
    const leftCharId = input.leftCharacterId?.trim() ?? "";
    const viewing = input.viewingCharacterId?.trim() ?? "";
    if (input.isCurrentUserGm && leftCharId.length > 0 && viewing === leftCharId) {
        return "viewingCharacter";
    }
    return "leftSession";
}

export function shouldNotifyParticipantDisconnected(input: {
    disconnectedUserId: string;
    currentUserId: string | null | undefined;
}): boolean {
    return Boolean(input.disconnectedUserId) && input.disconnectedUserId !== input.currentUserId;
}
