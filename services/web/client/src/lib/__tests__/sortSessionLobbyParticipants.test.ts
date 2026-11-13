import { describe, expect, it } from "vitest";
import { sortSessionLobbyParticipants } from "@/lib/sortSessionLobbyParticipants";
import type { SessionParticipant } from "@/services/SessionService";

const participant = (
    userId: string,
    joinedAt: string,
    status: SessionParticipant["status"] = "connected",
): SessionParticipant => ({
    id: userId,
    userId,
    characterId: null,
    status,
    joinedAt,
    sessionId: "ABC123",
});

const ids = (list: SessionParticipant[]) => list.map((p) => p.userId);

describe("FR-session-participant-labels — sortSessionLobbyParticipants", () => {
    it("places the Game Master first, then players by joinedAt ascending", () => {
        const sorted = sortSessionLobbyParticipants([
            participant("p2", "2026-01-01T10:02:00.000Z"),
            participant("gm", "2026-01-01T10:05:00.000Z", "gameMaster"),
            participant("p1", "2026-01-01T10:01:00.000Z"),
        ]);
        expect(ids(sorted)).toEqual(["gm", "p1", "p2"]);
    });

    it("yields the same order whatever the arrival order of WebSocket joins", () => {
        const gm = participant("gm", "2026-01-01T10:00:00.000Z", "gameMaster");
        const a = participant("a", "2026-01-01T10:01:00.000Z");
        const b = participant("b", "2026-01-01T10:02:00.000Z", "disconnected");
        expect(ids(sortSessionLobbyParticipants([b, a, gm]))).toEqual(
            ids(sortSessionLobbyParticipants([gm, a, b])),
        );
    });

    it("breaks joinedAt ties by userId", () => {
        const at = "2026-01-01T10:01:00.000Z";
        expect(ids(sortSessionLobbyParticipants([participant("zed", at), participant("amy", at)]))).toEqual([
            "amy",
            "zed",
        ]);
    });

    it("puts participants with an invalid joinedAt last without throwing, and does not mutate input", () => {
        const input = [participant("bad", "not-a-date"), participant("ok", "2026-01-01T10:01:00.000Z")];
        expect(ids(sortSessionLobbyParticipants(input))).toEqual(["ok", "bad"]);
        expect(ids(input)).toEqual(["bad", "ok"]);
    });
});
