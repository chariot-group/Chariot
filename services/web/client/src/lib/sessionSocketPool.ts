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

function baseWsUrl(): string {
    return process.env.NEXT_PUBLIC_SESSION_WS_URL ?? "http://localhost:9002";
}

function makeConnectionKey(code: string, token: string): string {
    return `${code.trim()}::${token}`;
}

/** Socket actif du pool, si une acquisition est en cours (effets après le premier acquire du cycle). */
export function getPooledSessionSocket(): Socket | null {
    return pool?.socket ?? null;
}

/**
 * Partage une unique connexion Socket.IO vers `/session` pour un couple (code OTP, token).
 * Évite deux connexions parallèles (layout + page session) et les allers-retours inutiles au changement de route.
 */
export function acquireSessionSocket(code: string, token: string): Socket {
    const key = makeConnectionKey(code, token);
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
