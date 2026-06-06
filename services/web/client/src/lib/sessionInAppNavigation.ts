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
