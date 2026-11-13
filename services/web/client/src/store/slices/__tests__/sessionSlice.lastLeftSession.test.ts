import { describe, it, expect } from "vitest";
import sessionReducer, {
    clearCurrentSession,
    selectLastLeftSessionCode,
    setCurrentSession,
    setLastLeftSessionCode,
} from "@/store/slices/sessionSlice";
import type { CurrentSessionState } from "@/store/slices/sessionSlice";
import type { RootState } from "@/store/index";

const baseState: CurrentSessionState = sessionReducer(undefined, { type: "@@init" });

describe("sessionSlice — lastLeftSessionCode (FR-session-lobby-modal)", () => {
    it("nominal: stores the code of the session the user left", () => {
        const state = sessionReducer(baseState, setLastLeftSessionCode("ABC123"));
        expect(state.lastLeftSessionCode).toBe("ABC123");
    });

    it("edge: survives clearCurrentSession so the rejoin dialog can be prefilled", () => {
        let state = sessionReducer(baseState, setCurrentSession({ code: "ABC123", campaignId: "camp" }));
        state = sessionReducer(state, setLastLeftSessionCode("ABC123"));
        state = sessionReducer(state, clearCurrentSession());
        expect(state.isInSession).toBe(false);
        expect(state.lastLeftSessionCode).toBe("ABC123");
    });

    it("guard: selector defaults to null when the field is absent (rehydration safety)", () => {
        const legacy = { ...baseState } as Partial<CurrentSessionState>;
        delete legacy.lastLeftSessionCode;
        expect(selectLastLeftSessionCode({ session: legacy } as unknown as RootState)).toBeNull();
    });
});
