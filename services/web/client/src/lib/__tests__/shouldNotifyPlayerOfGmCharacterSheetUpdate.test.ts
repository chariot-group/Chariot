import { describe, expect, it } from "vitest";
import { shouldNotifyPlayerOfGmCharacterSheetUpdate } from "@/lib/shouldNotifyPlayerOfGmCharacterSheetUpdate";
import type { SessionParticipant } from "@/services/SessionService";

const roster: SessionParticipant[] = [
    {
        id: "gm-1",
        userId: "gm-1",
        characterId: null,
        status: "gameMaster",
        joinedAt: "2026-01-01T00:00:00.000Z",
        sessionId: "ABC123",
    },
    {
        id: "player-1",
        userId: "player-1",
        characterId: "char-42",
        status: "connected",
        joinedAt: "2026-01-01T00:00:00.000Z",
        sessionId: "ABC123",
    },
];

describe("shouldNotifyPlayerOfGmCharacterSheetUpdate", () => {
    it("nominal: notifie le joueur dont le personnage a été modifié", () => {
        expect(
            shouldNotifyPlayerOfGmCharacterSheetUpdate("char-42", "player-1", roster),
        ).toBe(true);
    });

    it("edge: ignore le MJ même si son personnage est sur le roster", () => {
        const gmWithCharacter: SessionParticipant[] = [
            { ...roster[0], characterId: "char-42" },
            roster[1],
        ];
        expect(
            shouldNotifyPlayerOfGmCharacterSheetUpdate("char-42", "gm-1", gmWithCharacter),
        ).toBe(false);
    });

    it("error: refuse si le joueur n'a pas ce personnage au roster", () => {
        expect(
            shouldNotifyPlayerOfGmCharacterSheetUpdate("char-99", "player-1", roster),
        ).toBe(false);
    });
});
