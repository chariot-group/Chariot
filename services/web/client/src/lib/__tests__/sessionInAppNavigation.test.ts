import { describe, expect, it } from "vitest";
import {
    buildPlayerSessionCharacterPath,
    buildSessionCharacterHref,
    isInitiativeTrackerPage,
    isSessionLobbyPage,
    shouldGmShowReturnToBattle,
    shouldGmShowReturnToSheet,
    shouldPlayerShowReturnToBattleOnSessionLobby,
    shouldPlayerShowReturnToSheetOnSessionLobby,
    shouldShowSessionLobbyInvitePanel,
    withSessionCodeQuery,
} from "@/lib/sessionInAppNavigation";

describe("isSessionLobbyPage", () => {
    it("nominal: detects the session lobby route", () => {
        expect(isSessionLobbyPage("/fr/campaigns/camp-1/session/ABCD12")).toBe(true);
    });

    it("edge: rejects character and initiative tracker routes", () => {
        expect(isSessionLobbyPage("/fr/campaigns/camp-1/groups/gr-1/characters/ch-1")).toBe(false);
        expect(isSessionLobbyPage("/fr/initiativeTracker")).toBe(false);
    });
});

/** @see FR-session-join-qr-code */
describe("shouldShowSessionLobbyInvitePanel", () => {
    it("nominal: shows invite panel while session is activated", () => {
        expect(shouldShowSessionLobbyInvitePanel("activated")).toBe(true);
    });

    it("nominal: hides invite panel after launch", () => {
        expect(shouldShowSessionLobbyInvitePanel("launched")).toBe(false);
    });

    it("edge: hides for closed or missing status", () => {
        expect(shouldShowSessionLobbyInvitePanel("closed")).toBe(false);
        expect(shouldShowSessionLobbyInvitePanel(null)).toBe(false);
        expect(shouldShowSessionLobbyInvitePanel(undefined)).toBe(false);
    });
});

describe("buildSessionCharacterHref", () => {
    it("nominal: builds locale-agnostic href with sessionCode", () => {
        expect(buildSessionCharacterHref("char-1", "ABCD12")).toBe(
            "/characters/char-1?sessionCode=ABCD12",
        );
    });

    it("edge: omits query when session code is missing", () => {
        expect(buildSessionCharacterHref("char-1", null)).toBe("/characters/char-1");
    });
});

describe("buildPlayerSessionCharacterPath", () => {
    it("nominal: appends sessionCode query when provided", () => {
        expect(buildPlayerSessionCharacterPath("fr", "char-1", "ABCD12")).toBe(
            "/fr/characters/char-1?sessionCode=ABCD12",
        );
    });

    it("edge: omits query when session code is missing", () => {
        expect(buildPlayerSessionCharacterPath("fr", "char-1", null)).toBe("/fr/characters/char-1");
    });
});

describe("FR-session-combat-navigation — withSessionCodeQuery", () => {
    it("nominal: appends sessionCode to a bare character path", () => {
        expect(withSessionCodeQuery("/fr/characters/char-1", "ABCD12")).toBe(
            "/fr/characters/char-1?sessionCode=ABCD12",
        );
    });

    it("edge: leaves path unchanged when sessionCode is already present", () => {
        expect(withSessionCodeQuery("/fr/characters/char-1?sessionCode=ABCD12", "ZZZZ99")).toBe(
            "/fr/characters/char-1?sessionCode=ABCD12",
        );
    });

    it("failure: returns path unchanged when session code is missing", () => {
        expect(withSessionCodeQuery("/fr/characters/char-1", null)).toBe("/fr/characters/char-1");
        expect(withSessionCodeQuery("/fr/characters/char-1", "  ")).toBe("/fr/characters/char-1");
    });
});

describe("session lobby player action button", () => {
    it("nominal: shows return to sheet when session is launched without combat", () => {
        expect(
            shouldPlayerShowReturnToSheetOnSessionLobby({
                isPlayerParticipant: true,
                sessionStarted: true,
                pathname: "/fr/campaigns/camp-1/session/ABCD12",
                battleStarted: false,
            }),
        ).toBe(true);
    });

    it("edge: shows return to battle when combat has started", () => {
        expect(
            shouldPlayerShowReturnToBattleOnSessionLobby({
                isPlayerParticipant: true,
                sessionStarted: true,
                pathname: "/fr/campaigns/camp-1/session/ABCD12",
                battleStarted: true,
            }),
        ).toBe(true);
        expect(
            shouldPlayerShowReturnToSheetOnSessionLobby({
                isPlayerParticipant: true,
                sessionStarted: true,
                pathname: "/fr/campaigns/camp-1/session/ABCD12",
                battleStarted: true,
            }),
        ).toBe(false);
    });

    it("error: does not show sheet action for non-player participants", () => {
        expect(
            shouldPlayerShowReturnToSheetOnSessionLobby({
                isPlayerParticipant: false,
                sessionStarted: true,
                pathname: "/fr/campaigns/camp-1/session/ABCD12",
                battleStarted: false,
            }),
        ).toBe(false);
    });
});

describe("isInitiativeTrackerPage", () => {
    it("nominal: detects the initiative tracker route", () => {
        expect(isInitiativeTrackerPage("/fr/initiativeTracker")).toBe(true);
    });

    it("edge: rejects session lobby and character routes", () => {
        expect(isInitiativeTrackerPage("/fr/campaigns/camp-1/session/ABCD12")).toBe(false);
        expect(isInitiativeTrackerPage("/fr/characters/char-1")).toBe(false);
    });
});

describe("GM combat sidebar action button (FR-session-combat-navigation)", () => {
    it("nominal: shows return to sheet on tracker when battle is initialized but not started", () => {
        expect(
            shouldGmShowReturnToSheet({
                sessionStarted: true,
                battleInitialized: true,
                pathname: "/fr/initiativeTracker",
            }),
        ).toBe(true);
        expect(
            shouldGmShowReturnToBattle({
                sessionStarted: true,
                battleInitialized: true,
                pathname: "/fr/initiativeTracker",
            }),
        ).toBe(false);
    });

    it("nominal: shows return to battle off tracker when battle is initialized but not started", () => {
        expect(
            shouldGmShowReturnToBattle({
                sessionStarted: true,
                battleInitialized: true,
                pathname: "/fr/characters/char-1",
            }),
        ).toBe(true);
        expect(
            shouldGmShowReturnToSheet({
                sessionStarted: true,
                battleInitialized: true,
                pathname: "/fr/characters/char-1",
            }),
        ).toBe(false);
    });

    it("edge: no combat navigation before battle initialization", () => {
        expect(
            shouldGmShowReturnToSheet({
                sessionStarted: true,
                battleInitialized: false,
                pathname: "/fr/initiativeTracker",
            }),
        ).toBe(false);
        expect(
            shouldGmShowReturnToBattle({
                sessionStarted: true,
                battleInitialized: false,
                pathname: "/fr/characters/char-1",
            }),
        ).toBe(false);
    });

    it("error: no combat navigation when session is not launched", () => {
        expect(
            shouldGmShowReturnToSheet({
                sessionStarted: false,
                battleInitialized: true,
                pathname: "/fr/initiativeTracker",
            }),
        ).toBe(false);
    });
});
