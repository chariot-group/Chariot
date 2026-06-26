import { computeDiscountedAmount } from "@/lib/checkout-utils";
import type { ResolvedCode } from "@/services/PaymentService";
import { describe, expect, it } from "vitest";

describe("checkout-utils", () => {
    describe("computeDiscountedAmount", () => {
        const fixedPromo: ResolvedCode = {
            type: "promo",
            discountType: "FIXED",
            discountValue: 200,
        };

        const percentPromo: ResolvedCode = {
            type: "promo",
            discountType: "PERCENTAGE",
            discountValue: 10,
        };

        it("applies a fixed promo once on the order total (nominal)", () => {
            expect(computeDiscountedAmount(1000, 1, fixedPromo)).toBe(800);
            expect(computeDiscountedAmount(1000, 3, fixedPromo)).toBe(2800);
        });

        it("scales percentage promos with quantity (nominal)", () => {
            expect(computeDiscountedAmount(1000, 2, percentPromo)).toBe(1800);
        });

        it("caps fixed promo at order amount (edge)", () => {
            expect(computeDiscountedAmount(100, 2, fixedPromo)).toBe(0);
        });
    });
});
