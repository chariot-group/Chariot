import { afterEach, describe, expect, it, vi } from "vitest";

const { disconnectMock, ioMock } = vi.hoisted(() => {
    const disconnectMock = vi.fn();
    const ioMock = vi.fn(() => ({
        disconnect: disconnectMock,
        auth: {} as { token?: string },
    }));
    return { disconnectMock, ioMock };
});

vi.mock("socket.io-client", () => ({
    io: ioMock,
}));

import {
    acquireSessionSocket,
    destroySessionSocket,
    releaseSessionSocket,
    syncSessionSocketAuth,
} from "@/lib/sessionSocketPool";

describe("sessionSocketPool", () => {
    afterEach(() => {
        destroySessionSocket();
        vi.clearAllMocks();
    });

    it("nominal: réutilise la même socket pour le même code de session", () => {
        const first = acquireSessionSocket("CODE123", "token-a");
        const second = acquireSessionSocket("CODE123", "token-a");

        expect(ioMock).toHaveBeenCalledTimes(1);
        expect(first).toBe(second);
        releaseSessionSocket();
        releaseSessionSocket();
    });

    it("edge: un refresh JWT met à jour auth sans recréer la connexion", () => {
        acquireSessionSocket("CODE123", "token-a");
        acquireSessionSocket("CODE123", "token-b");

        expect(ioMock).toHaveBeenCalledTimes(1);
        expect(ioMock.mock.results[0]?.value.auth.token).toBe("token-b");
        expect(disconnectMock).not.toHaveBeenCalled();
        releaseSessionSocket();
        releaseSessionSocket();
    });

    it("edge: syncSessionSocketAuth met à jour le token sur la connexion active", () => {
        acquireSessionSocket("CODE123", "token-a");
        syncSessionSocketAuth("token-refreshed");

        expect(ioMock.mock.results[0]?.value.auth.token).toBe("token-refreshed");
        expect(disconnectMock).not.toHaveBeenCalled();
        releaseSessionSocket();
    });

    it("error: change de code OTP recrée une connexion", () => {
        acquireSessionSocket("CODE123", "token-a");
        releaseSessionSocket();

        acquireSessionSocket("CODE456", "token-a");

        expect(ioMock).toHaveBeenCalledTimes(2);
        expect(disconnectMock).toHaveBeenCalledTimes(1);
        releaseSessionSocket();
    });
});
