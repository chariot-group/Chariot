import { describe, expect, it } from "vitest";
import {
    clampWheelAmount,
    computeDepositRemainingAmount,
    computeMaxAddableWheels,
    computeRemainingBalanceAfterDeposit,
    computeWheelProgressPercent,
    isWheelQuotaMetForLaunch,
    sumDepositedWheels,
} from "@/lib/sessionWheelDeposit";

describe("sessionWheelDeposit", () => {
    it("nominal: max addable respects balance and session slots", () => {
        expect(
            computeMaxAddableWheels({
                balance: 10,
                myDeposited: 2,
                totalDeposited: 3,
                maxSlots: 5,
            }),
        ).toBe(2);
    });

    it("edge: returns zero when session quota is full", () => {
        expect(
            computeMaxAddableWheels({
                balance: 20,
                myDeposited: 0,
                totalDeposited: 5,
                maxSlots: 5,
            }),
        ).toBe(0);
    });

    it("error: returns zero when balance is exhausted for this user", () => {
        expect(
            computeMaxAddableWheels({
                balance: 3,
                myDeposited: 3,
                totalDeposited: 3,
                maxSlots: 5,
            }),
        ).toBe(0);
    });

    it("deposit remaining equals max addable", () => {
        expect(
            computeDepositRemainingAmount({
                balance: 8,
                myDeposited: 1,
                totalDeposited: 2,
                maxSlots: 4,
            }),
        ).toBe(2);
    });

    it("clamp wheel amount to valid range", () => {
        expect(clampWheelAmount(5, 2)).toBe(2);
        expect(clampWheelAmount(-1, 5)).toBe(0);
        expect(clampWheelAmount(3.7, 10)).toBe(3);
    });

    it("progress percent caps at 100", () => {
        expect(computeWheelProgressPercent(4, 5)).toBe(80);
        expect(computeWheelProgressPercent(6, 5)).toBe(100);
        expect(computeWheelProgressPercent(0, 0)).toBe(0);
    });

    it("remaining balance subtracts session deposit", () => {
        expect(computeRemainingBalanceAfterDeposit(10, 3)).toBe(7);
        expect(computeRemainingBalanceAfterDeposit(2, 5)).toBe(0);
    });

    it("sums deposited wheels across users", () => {
        expect(sumDepositedWheels({ a: 2, b: 1 })).toBe(3);
        expect(sumDepositedWheels({})).toBe(0);
    });

    describe("FR-session-lobby-wheel-quota-invariant — isWheelQuotaMetForLaunch", () => {
        it("nominal: exact equality enables launch", () => {
            expect(isWheelQuotaMetForLaunch(3, 3)).toBe(true);
        });

        it("guard: over-quota does not enable launch", () => {
            expect(isWheelQuotaMetForLaunch(4, 3)).toBe(false);
        });

        it("guard: under-quota does not enable launch", () => {
            expect(isWheelQuotaMetForLaunch(2, 3)).toBe(false);
        });

        it("edge: zero slots never launch-ready", () => {
            expect(isWheelQuotaMetForLaunch(0, 0)).toBe(false);
        });
    });
});
