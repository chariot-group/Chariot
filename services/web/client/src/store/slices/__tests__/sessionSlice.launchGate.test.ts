import { describe, it, expect } from "vitest";
import sessionReducer, {
    clearCurrentSession,
    selectIsInSession,
    selectIsSessionLaunched,
    setCurrentSession,
    setSessionStatus,
} from "@/store/slices/sessionSlice";
import type { CurrentSessionState } from "@/store/slices/sessionSlice";
import type { RootState } from "@/store/index";

const baseState: CurrentSessionState = sessionReducer(undefined, { type: "@@init" });

const makeRootState = (session: CurrentSessionState): RootState =>
    ({ session } as unknown as RootState);

const joined = sessionReducer(baseState, setCurrentSession({ code: "ABC123", campaignId: "camp-1" }));

describe("FR-session-lobby-wheel-deposit — session features locked until launch", () => {
    it("nominal: launched session unlocks session features", () => {
        const state = sessionReducer(joined, setSessionStatus("launched"));
        expect(selectIsSessionLaunched(makeRootState(state))).toBe(true);
    });

    it("edge: in lobby (activated) is in session but features stay locked", () => {
        const state = sessionReducer(joined, setSessionStatus("activated"));
        expect(selectIsInSession(makeRootState(state))).toBe(true);
        expect(selectIsSessionLaunched(makeRootState(state))).toBe(false);
    });

    it("edge: status not hydrated yet after reload keeps features locked, then unlocks on launched", () => {
        expect(selectIsSessionLaunched(makeRootState(joined))).toBe(false);
        const hydrated = sessionReducer(joined, setSessionStatus("launched"));
        expect(selectIsSessionLaunched(makeRootState(hydrated))).toBe(true);
    });

    it("guard: stale launched status without being in session stays locked", () => {
        const left = sessionReducer(
            sessionReducer(joined, setSessionStatus("launched")),
            clearCurrentSession(),
        );
        expect(selectIsSessionLaunched(makeRootState({ ...left, status: "launched" }))).toBe(false);
    });

    it("guard: closed session stays locked", () => {
        const state = sessionReducer(joined, setSessionStatus("closed"));
        expect(selectIsSessionLaunched(makeRootState(state))).toBe(false);
    });
});
