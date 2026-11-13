import { describe, it, expect } from "vitest";
import sessionReducer, {
    selectLastConsultedSheetPath,
    setLastConsultedSheetPath,
} from "@/store/slices/sessionSlice";
import type { CurrentSessionState } from "@/store/slices/sessionSlice";
import type { RootState } from "@/store/index";

const baseState: CurrentSessionState = sessionReducer(undefined, { type: "@@init" });
const asRoot = (session: CurrentSessionState) => ({ session }) as unknown as RootState;

describe("sessionSlice — lastConsultedSheetPath (FR-session-combat-navigation)", () => {
    it("nominal: stores the sheet path without locale so i18n navigation does not double-prefix it", () => {
        const state = sessionReducer(
            baseState,
            setLastConsultedSheetPath("/fr/campaigns/c1/groups/g1/characters/x?sessionCode=ABC"),
        );
        expect(state.lastConsultedSheetPath).toBe("/campaigns/c1/groups/g1/characters/x?sessionCode=ABC");
    });

    it("edge: legacy persisted value with locale is returned locale-agnostic by the selector", () => {
        const legacy = { ...baseState, lastConsultedSheetPath: "/fr/characters/x?sessionCode=ABC" };
        expect(selectLastConsultedSheetPath(asRoot(legacy))).toBe("/characters/x?sessionCode=ABC");
    });

    it("guard: blank or missing path resolves to null", () => {
        const state = sessionReducer(baseState, setLastConsultedSheetPath("   "));
        expect(state.lastConsultedSheetPath).toBeNull();
        expect(selectLastConsultedSheetPath(asRoot({ ...baseState, lastConsultedSheetPath: null }))).toBeNull();
    });
});
