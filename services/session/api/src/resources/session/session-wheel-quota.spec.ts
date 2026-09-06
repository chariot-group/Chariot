import {
    clampTokensToParticipantQuota,
    sumTokenMap,
} from '@/resources/session/session-wheel-quota';

/** @see FR-session-lobby-wheel-quota-invariant */
describe("FR-session-lobby-wheel-quota-invariant — clampTokensToParticipantQuota", () => {
    it("nominal: total already under quota → no change", () => {
        expect(clampTokensToParticipantQuota({ a: 1, b: 1 }, 3)).toEqual({
            tokens: { a: 1, b: 1 },
            released: 0,
        });
    });

    it("nominal: excess reduced from highest depositors first", () => {
        expect(clampTokensToParticipantQuota({ a: 3, b: 1 }, 2)).toEqual({
            tokens: { a: 1, b: 1 },
            released: 2,
        });
    });

    it("edge: equal deposits → tie-break by userId ascending", () => {
        // Both have 2; need to release 2 to reach maxSlots 2.
        // Sort: same deposit → "a" before "b" → take 2 from "a" first.
        expect(clampTokensToParticipantQuota({ b: 2, a: 2 }, 2)).toEqual({
            tokens: { b: 2 },
            released: 2,
        });
    });

    it("edge: maxSlots 0 clears all", () => {
        expect(clampTokensToParticipantQuota({ a: 2, b: 1 }, 0)).toEqual({
            tokens: {},
            released: 3,
        });
    });

    it("guard: drops non-positive / invalid counts", () => {
        expect(sumTokenMap({ a: 2, b: -1, c: 0.9 })).toBe(2);
        expect(clampTokensToParticipantQuota({ a: 2, b: 0, c: -3 }, 5)).toEqual({
            tokens: { a: 2 },
            released: 0,
        });
    });
});
