import { beforeEach, describe, expect, it, vi } from "vitest";
import characterService from "@/services/CharacterService";
import UserService from "@/services/UserService";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import {
    buildSessionParticipantsGroup,
    resolveSessionParticipantBattleFallbackName,
} from "@/lib/buildSessionParticipantsGroup";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import type { SessionParticipant } from "@/services/SessionService";

vi.mock("@/services/CharacterService", () => ({
    default: {
        getCharacterById: vi.fn(),
    },
}));

vi.mock("@/services/UserService", () => ({
    default: {
        getUserById: vi.fn(),
    },
}));

const participant = (overrides: Partial<SessionParticipant> = {}): SessionParticipant => ({
    id: "part-1",
    userId: "user-1",
    status: "connected",
    characterId: null,
    joinedAt: "2026-06-06T12:00:00.000Z",
    sessionId: "session-1",
    ...overrides,
});

describe("resolveSessionParticipantBattleFallbackName", () => {
    it("nominal: returns resolved display name from store", () => {
        expect(
            resolveSessionParticipantBattleFallbackName("user-1", { "user-1": "aragorn" }),
        ).toBe("aragorn");
    });

    it("edge: returns loading placeholder when name is not resolved yet", () => {
        expect(resolveSessionParticipantBattleFallbackName("user-1", {})).toBe(
            SESSION_PARTICIPANT_NAME_LOADING,
        );
        expect(
            resolveSessionParticipantBattleFallbackName("user-1", {
                "user-1": SESSION_PARTICIPANT_NAME_LOADING,
            }),
        ).toBe(SESSION_PARTICIPANT_NAME_LOADING);
    });
});

describe("buildSessionParticipantsGroup", () => {
    beforeEach(() => {
        vi.mocked(characterService.getCharacterById).mockReset();
        vi.mocked(UserService.getUserById).mockReset();
    });

    it("nominal: uses participant display name when character sheet is unavailable", async () => {
        const group = await buildSessionParticipantsGroup(
            [],
            [participant()],
            "campaign-1",
            { "user-1": "aragorn" },
            "ABC123",
        );

        expect(group._id).toBe(SESSION_PARTICIPANTS_GROUP_ID);
        expect(group.characters).toHaveLength(1);
        expect(group.characters[0].surname).toBe("aragorn");
    });

    it("edge: keeps hydrated character name when sheet is loaded", async () => {
        vi.mocked(characterService.getCharacterById).mockResolvedValue({
            _id: "char-1",
            firstname: "Legolas",
            lastname: "Greenleaf",
            surname: "Archer",
            createdBy: "user-1",
        } as never);

        const group = await buildSessionParticipantsGroup(
            [],
            [participant({ characterId: "char-1" })],
            "campaign-1",
            { "user-1": "legolas_player" },
            "ABC123",
        );

        expect(group.characters[0]).toMatchObject({
            _id: "char-1",
            firstname: "Legolas",
            lastname: "Greenleaf",
            surname: "Archer",
        });
    });

    it("error: falls back to loading placeholder when profile fetch fails", async () => {
        vi.mocked(UserService.getUserById).mockRejectedValue(new Error("network"));

        const group = await buildSessionParticipantsGroup([], [participant()], "campaign-1", {}, "ABC123");

        expect(group.characters[0].surname).toBe(SESSION_PARTICIPANT_NAME_LOADING);
    });
});
