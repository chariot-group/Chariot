import { describe, expect, it } from "vitest";
import {
    formatPromoCodeResolveError,
    parsePromoCodeResolveError,
} from "@/lib/promoCodeResolveError";

const tShop = (key: string, values?: Record<string, string>) => {
    if (key === "codeMinOrder" && values?.minAmount) {
        return `Min ${values.minAmount}`;
    }
    return key;
};

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

    it("detects first-order-only error (edge)", () => {
        const err = {
            response: {
                status: 422,
                data: {
                    errorCode: "PROMO_FIRST_ORDER_ONLY",
                    detail: "Ce code est réservé à votre première commande",
                },
            },
        };

        expect(parsePromoCodeResolveError(err)).toEqual({
            kind: "first_order_only",
        });
    });

    it("detects first-order-only error from ProblemDetails detail (edge)", () => {
        const err = {
            response: {
                status: 400,
                data: {
                    detail: "Le code promo 'FIRST' est réservé à la première commande",
                },
            },
        };

        expect(parsePromoCodeResolveError(err)).toEqual({
            kind: "first_order_only",
        });
    });

    it("falls back to not_found for unknown errors (failure)", () => {
        expect(parsePromoCodeResolveError({ response: { status: 404 } })).toEqual({
            kind: "not_found",
        });
    });
});

describe("formatPromoCodeResolveError", () => {
    it("maps first-order-only to shop message (nominal)", () => {
        expect(formatPromoCodeResolveError({ kind: "first_order_only" }, tShop)).toBe(
            "codeFirstOrderOnly",
        );
    });
});
