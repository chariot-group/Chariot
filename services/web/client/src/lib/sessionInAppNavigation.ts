export function isSessionLobbyPage(pathname: string): boolean {
    return /\/campaigns\/[^/]+\/session\/[^/]+\/?$/.test(pathname);
}

export function buildPlayerSessionCharacterPath(
    locale: string,
    characterId: string,
    sessionCode?: string | null,
): string {
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(characterId)}${query}`;
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

/** FR-021 — MJ : combat initialisé ou démarré, bascule fiche ↔ tracker */
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
