/**
 * Snapshot minimal de la session courante pour diffusion temps réel (CharacterService, hors React).
 */
export function setSessionSnapshotForBroadcast(snapshot: { code: string | null; isInSession: boolean } | null): void {
    if (typeof window === "undefined") return;
    const w = window as Window & {
        __CHARIOT_SESSION__?: { code: string | null; isInSession: boolean };
    };
    if (snapshot?.isInSession && snapshot.code) {
        w.__CHARIOT_SESSION__ = snapshot;
    } else {
        delete w.__CHARIOT_SESSION__;
    }
}

export function getSessionSnapshotForBroadcast(): { code: string; isInSession: true } | null {
    if (typeof window === "undefined") return null;
    const w = window as Window & {
        __CHARIOT_SESSION__?: { code: string | null; isInSession: boolean };
    };
    const s = w.__CHARIOT_SESSION__;
    if (s?.isInSession && s.code) {
        return { code: s.code, isInSession: true };
    }
    return null;
}
