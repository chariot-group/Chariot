import { describe, expect, it } from "vitest";
import { computePurchasedTokenAmount } from "@/lib/paymentSuccessRefresh";
import type { User } from "@/types/user";

const baseUser = (overrides: Partial<User> = {}): User =>
  ({
    balance: 0,
    history: [],
    ...overrides,
  }) as User;

describe("computePurchasedTokenAmount", () => {
  it("returns balance delta when balance increased", () => {
    const refreshedUser = baseUser({ balance: 15, history: [{ value: 10, date: "2026-01-01", campaignName: "Achat" }] });

    expect(computePurchasedTokenAmount(refreshedUser, 5)).toBe(10);
  });

  it("falls back to latest positive history entry when balance delta is zero", () => {
    const refreshedUser = baseUser({
      balance: 5,
      history: [{ value: 20, date: "2026-01-01", campaignName: "Achat" }],
    });

    expect(computePurchasedTokenAmount(refreshedUser, 5)).toBe(20);
  });

  it("returns zero when neither balance nor history indicate a credit", () => {
    const refreshedUser = baseUser({ balance: 3, history: [{ value: -2, date: "2026-01-01", campaignName: "Session" }] });

    expect(computePurchasedTokenAmount(refreshedUser, 3)).toBe(0);
  });
});
