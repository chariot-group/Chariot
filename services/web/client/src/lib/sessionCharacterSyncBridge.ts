import type { Socket } from "socket.io-client";

/** Socket actif (page session ou pont hors page session) pour émettre les synchros de fiches. */
let activeSessionSyncSocket: Socket | null = null;

/** Planificateur défini par `SessionCharacterSyncClient` (effet acquisition socket). */
let sessionRosterHttpSyncScheduler: (() => void) | null = null;

export function registerSessionSyncSocket(socket: Socket | null): void {
    activeSessionSyncSocket = socket;
}

export function emitCharacterSheetUpdated(sessionCode: string, characterId: string): void {
    const code = sessionCode.trim();
    const cid = characterId.trim();
    if (!code || !cid || !activeSessionSyncSocket?.connected) return;
    // API historique : le champ s’appelle sessionId mais contient le code OTP (cf. session.gateway).
    activeSessionSyncSocket.emit("session:character-sheet-updated", {
        sessionId: code,
        characterId: cid,
    });
}

export function registerSessionRosterHttpSyncScheduler(scheduler: (() => void) | null): void {
    sessionRosterHttpSyncScheduler = scheduler;
}

/** Re-lance un GET /participants après un événement WS (joined / perso choisi). */
export function requestSessionRosterHttpSync(): void {
    sessionRosterHttpSyncScheduler?.();
}
