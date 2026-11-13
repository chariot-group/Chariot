import { describe, expect, it } from "vitest";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import { resolveSessionLobbyCardLabels } from "@/lib/sessionLobbyCardLabels";

describe("FR-session-participant-labels — resolveSessionLobbyCardLabels", () => {
    it("shows the character name as primary and the username as secondary for a player", () => {
        expect(
            resolveSessionLobbyCardLabels({
                isGameMaster: false,
                participantName: "jackie_raynor",
                characterLabel: "Milo",
            }),
        ).toEqual({ primary: "Milo", secondary: "jackie_raynor" });
    });

    it("shows the username as primary for the Game Master", () => {
        expect(
            resolveSessionLobbyCardLabels({ isGameMaster: true, participantName: "gm_user", characterLabel: "" }),
        ).toEqual({ primary: "gm_user", secondary: "" });
    });

    it("keeps the loading placeholder as primary while the character sheet loads", () => {
        expect(
            resolveSessionLobbyCardLabels({
                isGameMaster: false,
                participantName: "jackie_raynor",
                characterLabel: SESSION_PARTICIPANT_NAME_LOADING,
            }),
        ).toEqual({ primary: SESSION_PARTICIPANT_NAME_LOADING, secondary: "jackie_raynor" });
    });

    it("falls back to the username when no character is assigned (empty, blank or null)", () => {
        for (const characterLabel of ["", "   ", null, undefined]) {
            expect(
                resolveSessionLobbyCardLabels({ isGameMaster: false, participantName: "newbie", characterLabel }),
            ).toEqual({ primary: "newbie", secondary: "" });
        }
    });
});
