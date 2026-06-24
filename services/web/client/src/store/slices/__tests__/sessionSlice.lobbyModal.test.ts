import { describe, it, expect } from "vitest";
import sessionReducer, {
    openSessionLobby,
    closeSessionLobby,
    selectSessionLobbyOpen,
} from "@/store/slices/sessionSlice";
import type { CurrentSessionState } from "@/store/slices/sessionSlice";
import type { RootState } from "@/store/index";

const baseState: CurrentSessionState = sessionReducer(undefined, { type: "@@init" });

const makeRootState = (session: CurrentSessionState): RootState =>
    ({ session } as unknown as RootState);

describe("FR-session-lobby-modal — session lobby modal", () => {
    it("nominal: initialState has sessionLobbyOpen = false", () => {
        expect(baseState.sessionLobbyOpen).toBe(false);
    });

    it("nominal: openSessionLobby sets sessionLobbyOpen to true", () => {
        const next = sessionReducer(baseState, openSessionLobby());
        expect(next.sessionLobbyOpen).toBe(true);
    });

    it("nominal: closeSessionLobby sets sessionLobbyOpen to false", () => {
        const opened = sessionReducer(baseState, openSessionLobby());
        const closed = sessionReducer(opened, closeSessionLobby());
        expect(closed.sessionLobbyOpen).toBe(false);
    });

    it("edge: selectSessionLobbyOpen returns false when field is undefined (legacy rehydrated state)", () => {
        const stateWithoutField = { ...baseState, sessionLobbyOpen: undefined as unknown as boolean };
        expect(selectSessionLobbyOpen(makeRootState(stateWithoutField))).toBe(false);
    });

    it("edge: openSessionLobby is idempotent (calling twice stays true)", () => {
        const once = sessionReducer(baseState, openSessionLobby());
        const twice = sessionReducer(once, openSessionLobby());
        expect(twice.sessionLobbyOpen).toBe(true);
    });
});
