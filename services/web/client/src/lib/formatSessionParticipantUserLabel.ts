const KEYCLOAK_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SESSION_PARTICIPANT_NAME_LOADING = "...";

export type SessionParticipantUserLabelSource = {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
};

export function looksLikeKeycloakId(value: string): boolean {
    return KEYCLOAK_ID_RE.test(value.trim());
}

export function formatSessionParticipantFullName(
    firstName?: string | null,
    lastName?: string | null,
): string {
    return [firstName, lastName]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(" ");
}

/** Libellé affichable : username en priorité, sinon prénom + nom. Jamais d’email ni d’UUID Keycloak. */
export function formatSessionParticipantUserLabel(
    source: SessionParticipantUserLabelSource,
): string | null {
    const username = source.username?.trim();
    if (username && !looksLikeKeycloakId(username)) {
        return username;
    }

    const fullName = formatSessionParticipantFullName(source.firstName, source.lastName);
    if (fullName) {
        return fullName;
    }

    return null;
}

export function formatSessionParticipantLabelFromWsUsername(username?: string | null): string | null {
    const trimmed = username?.trim();
    if (!trimmed || looksLikeKeycloakId(trimmed)) {
        return null;
    }
    return trimmed;
}

export function resolveSessionParticipantDisplayName(
    source: SessionParticipantUserLabelSource,
    wsUsername?: string | null,
): string {
    return (
        formatSessionParticipantUserLabel(source) ??
        formatSessionParticipantLabelFromWsUsername(wsUsername) ??
        SESSION_PARTICIPANT_NAME_LOADING
    );
}
