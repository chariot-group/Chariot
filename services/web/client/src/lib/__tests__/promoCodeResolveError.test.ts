import { describe, expect, it } from "vitest";
import { parsePromoCodeResolveError } from "@/lib/promoCodeResolveError";

describe("parsePromoCodeResolveError", () => {
    it("detects min-order error from ProblemDetails response (nominal)", () => {
        const err = {
            response: {
                status: 422,
                data: {
                    errorCode: "PROMO_MIN_ORDER",
                    minOrderAmount: 200,
                    detail: "Ce code nécessite un panier minimum de 2.00€",
                },
            },
        };

        expect(parsePromoCodeResolveError(err)).toEqual({
            kind: "min_order",
            minOrderAmount: 200,
        });
    });

    it("detects min-order error from nested Nest message (edge)", () => {
        const err = {
            response: {
                status: 422,
                data: {
                    message: {
                        errorCode: "PROMO_MIN_ORDER",
                        minOrderAmount: 200,
                    },
                },
            },
        };

        expect(parsePromoCodeResolveError(err)).toEqual({
            kind: "min_order",
            minOrderAmount: 200,
        });
    });

    it("falls back to not_found for unknown errors (failure)", () => {
        expect(parsePromoCodeResolveError({ response: { status: 404 } })).toEqual({
            kind: "not_found",
        });
    });
});
