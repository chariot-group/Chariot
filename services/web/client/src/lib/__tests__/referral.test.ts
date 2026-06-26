import { computeEffectiveReferralDiscount } from "@/lib/referral";
import { describe, expect, it } from "vitest";

const makeInfo = (
  currentDiscountPercent: number,
  myRefereeDiscount: { available: boolean; discountPercent: number } | null,
) => ({ currentDiscountPercent, myRefereeDiscount });

describe("computeEffectiveReferralDiscount", () => {
  it("returns 0 when no discount is available (tier 0, no filleul discount)", () => {
    expect(computeEffectiveReferralDiscount(makeInfo(0, null))).toBe(0);
  });

  it("returns parrain discount when only parrain has a discount", () => {
    expect(computeEffectiveReferralDiscount(makeInfo(10, null))).toBe(10);
    expect(computeEffectiveReferralDiscount(makeInfo(20, { available: false, discountPercent: 15 }))).toBe(20);
  });

  it("returns filleul discount when only filleul discount is available", () => {
    expect(computeEffectiveReferralDiscount(makeInfo(0, { available: true, discountPercent: 15 }))).toBe(15);
  });

  it("returns the highest discount when user qualifies as both parrain and filleul (FR-stripe-checkout)", () => {
    // filleul 15% > parrain 10%
    expect(computeEffectiveReferralDiscount(makeInfo(10, { available: true, discountPercent: 15 }))).toBe(15);
    // parrain 20% > filleul 15%
    expect(computeEffectiveReferralDiscount(makeInfo(20, { available: true, discountPercent: 15 }))).toBe(20);
  });

  it("returns 0 when filleul discount exists but is not available (already used)", () => {
    expect(computeEffectiveReferralDiscount(makeInfo(0, { available: false, discountPercent: 15 }))).toBe(0);
  });
});
