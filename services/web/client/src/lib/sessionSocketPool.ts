"use client";

import { io, type Socket } from "socket.io-client";

const WS_PATH = "/ws";
const TRANSPORTS: ("polling" | "websocket")[] = ["polling", "websocket"];

type PoolEntry = {
    socket: Socket;
    refCount: number;
    connectionKey: string;
};

let pool: PoolEntry | null = null;
let lastSessionEndNoticeKey: string | null = null;

function baseWsUrl(): string {
    return process.env.NEXT_PUBLIC_SESSION_WS_URL ?? "http://localhost:9002";
}

/** Clé stable par session : le refresh JWT ne doit pas recréer la connexion WS. */
function makeConnectionKey(code: string): string {
    return code.trim();
}

/** Socket actif du pool, si une acquisition est en cours (effets après le premier acquire du cycle). */
export function getPooledSessionSocket(): Socket | null {
    return pool?.socket ?? null;
}

/**
 * Met à jour le token d’auth pour la prochaine reconnexion Socket.IO sans couper la connexion active.
 * Le handshake initial suffit tant que la socket reste connectée.
 */
export function syncSessionSocketAuth(token: string): void {
    if (!pool?.socket || !token.trim()) return;
    pool.socket.auth = { token };
}

/**
 * Partage une unique connexion Socket.IO vers `/session` pour un code OTP de session.
 * Évite deux connexions parallèles (layout + page session) et les reconnexions au refresh JWT.
 */
export function acquireSessionSocket(code: string, token: string): Socket {
    const key = makeConnectionKey(code);
    if (pool && pool.connectionKey !== key) {
        pool.socket.disconnect();
        pool = null;
    }
    if (!pool) {
        const socket = io(`${baseWsUrl()}/session`, {
            auth: { token },
            path: WS_PATH,
            transports: TRANSPORTS,
        });
        pool = { socket, refCount: 0, connectionKey: key };
    } else {
        syncSessionSocketAuth(token);
    }
    pool.refCount += 1;
    return pool.socket;
}

export function releaseSessionSocket(): void {
    if (!pool) return;
    pool.refCount -= 1;
    if (pool.refCount <= 0) {
        pool.socket.disconnect();
        pool = null;
    }
}

export function destroySessionSocket(): void {
    if (!pool) return;
    pool.socket.disconnect();
    pool = null;
}

export function shouldShowSessionEndNotice(sessionCode: string, reason: "closed" | "expired"): boolean {
    const key = `${sessionCode.trim()}::${reason}`;
    if (lastSessionEndNoticeKey === key) {
        return false;
    }
    lastSessionEndNoticeKey = key;
    return true;
}
