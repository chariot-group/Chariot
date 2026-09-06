import { describe, expect, it } from "vitest";
import {
    resolveParticipantLeftToastKind,
    shouldNotifyParticipantDisconnected,
} from "@/lib/sessionParticipantLifecycleToasts";

/** @see FR-session-websocket-lifecycle: participant leave/disconnect toast ownership */
describe("FR-session-websocket-lifecycle — participant lifecycle toasts", () => {
    describe("resolveParticipantLeftToastKind", () => {
        it("nominal: autre participant → leftSession", () => {
            expect(
                resolveParticipantLeftToastKind({
                    leftUserId: "user-b",
                    currentUserId: "user-a",
                    isCurrentUserGm: false,
                    leftCharacterId: "char-b",
                    viewingCharacterId: null,
                }),
            ).toBe("leftSession");
        });

        it("nominal: MJ qui regarde la fiche du partant → viewingCharacter", () => {
            expect(
                resolveParticipantLeftToastKind({
                    leftUserId: "user-b",
                    currentUserId: "gm-1",
                    isCurrentUserGm: true,
                    leftCharacterId: "char-b",
                    viewingCharacterId: "char-b",
                }),
            ).toBe("viewingCharacter");
        });

        it("edge: départ de soi-même → none (pas de toast)", () => {
            expect(
                resolveParticipantLeftToastKind({
                    leftUserId: "user-a",
                    currentUserId: "user-a",
                    isCurrentUserGm: false,
                    leftCharacterId: "char-a",
                    viewingCharacterId: "char-a",
                }),
            ).toBe("none");
        });

        it("edge: MJ sur une autre fiche → leftSession (pas viewingCharacter)", () => {
            expect(
                resolveParticipantLeftToastKind({
                    leftUserId: "user-b",
                    currentUserId: "gm-1",
                    isCurrentUserGm: true,
                    leftCharacterId: "char-b",
                    viewingCharacterId: "char-other",
                }),
            ).toBe("leftSession");
        });

        it("edge: characterId vide / whitespace → leftSession même pour MJ", () => {
            expect(
                resolveParticipantLeftToastKind({
                    leftUserId: "user-b",
                    currentUserId: "gm-1",
                    isCurrentUserGm: true,
                    leftCharacterId: "  ",
                    viewingCharacterId: "  ",
                }),
            ).toBe("leftSession");
        });
    });

    describe("shouldNotifyParticipantDisconnected", () => {
        it("nominal: autre utilisateur → true", () => {
            expect(
                shouldNotifyParticipantDisconnected({
                    disconnectedUserId: "user-b",
                    currentUserId: "user-a",
                }),
            ).toBe(true);
        });

        it("failure/guard: soi-même → false", () => {
            expect(
                shouldNotifyParticipantDisconnected({
                    disconnectedUserId: "user-a",
                    currentUserId: "user-a",
                }),
            ).toBe(false);
        });

        it("edge: userId vide → false", () => {
            expect(
                shouldNotifyParticipantDisconnected({
                    disconnectedUserId: "",
                    currentUserId: "user-a",
                }),
            ).toBe(false);
        });
    });
});
