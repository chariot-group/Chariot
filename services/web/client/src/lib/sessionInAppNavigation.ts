export function isSessionLobbyPage(pathname: string): boolean {
    return /\/campaigns\/[^/]+\/session\/[^/]+\/?$/.test(pathname);
}

/** @see FR-session-join-qr-code — invite code/QR only before launch. */
export function shouldShowSessionLobbyInvitePanel(
    sessionStatus: string | null | undefined,
): boolean {
    return sessionStatus === "activated";
}

export function buildPlayerSessionCharacterPath(
    locale: string,
    characterId: string,
    sessionCode?: string | null,
): string {
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(characterId)}${query}`;
}

/**
 * FR-session-combat-navigation — ensure a character sheet path keeps session read access.
 * Idempotent if `sessionCode` is already present in the URL.
 */
export function withSessionCodeQuery(
    path: string,
    sessionCode?: string | null,
): string {
    const code = sessionCode?.trim();
    if (!code || !path) return path;

    const [pathnamePart, search = ""] = path.split("?", 2);
    const params = new URLSearchParams(search);
    if (params.get("sessionCode")?.trim()) {
        return path;
    }
    params.set("sessionCode", code);
    const nextSearch = params.toString();
    return nextSearch ? `${pathnamePart}?${nextSearch}` : pathnamePart;
}

export function shouldPlayerShowReturnToSheetOnSessionLobby(input: {
    isPlayerParticipant: boolean;
    sessionStarted: boolean;
    pathname: string;
    battleStarted: boolean;
}): boolean {
    return (
        input.isPlayerParticipant &&
        input.sessionStarted &&
        isSessionLobbyPage(input.pathname) &&
        !input.battleStarted
    );
}

export function shouldPlayerShowReturnToBattleOnSessionLobby(input: {
    isPlayerParticipant: boolean;
    sessionStarted: boolean;
    pathname: string;
    battleStarted: boolean;
}): boolean {
    return (
        input.isPlayerParticipant &&
        input.sessionStarted &&
        isSessionLobbyPage(input.pathname) &&
        input.battleStarted
    );
}

export function isInitiativeTrackerPage(pathname: string): boolean {
    return pathname.endsWith("/initiativeTracker");
}

/** FR-session-combat-navigation — MJ : combat initialisé ou démarré, bascule fiche ↔ tracker */
export function shouldGmShowReturnToSheet(input: {
    sessionStarted: boolean;
    battleInitialized: boolean;
    pathname: string;
}): boolean {
    return (
        input.sessionStarted &&
        input.battleInitialized &&
        isInitiativeTrackerPage(input.pathname)
    );
}

export function shouldGmShowReturnToBattle(input: {
    sessionStarted: boolean;
    battleInitialized: boolean;
    pathname: string;
}): boolean {
    return (
        input.sessionStarted &&
        input.battleInitialized &&
        !isInitiativeTrackerPage(input.pathname)
    );
}
