export type PromoCodeResolveErrorKind =
    | "exhausted"
    | "user_limit_reached"
    | "min_order"
    | "first_order_only"
    | "not_found";

export type PromoCodeResolveError = {
    kind: PromoCodeResolveErrorKind;
    minOrderAmount?: number;
};

type AxiosLikeError = {
    response?: {
        status?: number;
        data?: {
            errorCode?: string;
            minOrderAmount?: number;
            detail?: string;
            message?:
                | string
                | {
                      errorCode?: string;
                      minOrderAmount?: number;
                      message?: string;
                  };
        };
    };
};

function isFirstOrderOnlyDetail(detail: string | undefined): boolean {
    if (!detail) return false;
    const normalized = detail.toLowerCase();
    return (
        normalized.includes("première commande") ||
        normalized.includes("premiere commande") ||
        normalized.includes("first order")
    );
}

/** @see FR-stripe-checkout — promo code resolution at checkout */
export function parsePromoCodeResolveError(err: unknown): PromoCodeResolveError {
    const axiosErr = err as AxiosLikeError;
    const status = axiosErr?.response?.status;
    const data = axiosErr?.response?.data;
    const nestedMessage = typeof data?.message === "object" ? data.message : undefined;
    const errorCode = data?.errorCode ?? nestedMessage?.errorCode;
    const minOrderAmount = data?.minOrderAmount ?? nestedMessage?.minOrderAmount;
    const detail =
        data?.detail ??
        (typeof data?.message === "string" ? data.message : undefined) ??
        nestedMessage?.message;

    if (status === 410 && errorCode === "PROMO_EXHAUSTED") {
        return { kind: "exhausted" };
    }
    if (status === 410 && errorCode === "PROMO_USER_LIMIT_REACHED") {
        return { kind: "user_limit_reached" };
    }
    if (status === 422 && errorCode === "PROMO_MIN_ORDER" && minOrderAmount != null) {
        return { kind: "min_order", minOrderAmount };
    }
    if (errorCode === "PROMO_FIRST_ORDER_ONLY" || isFirstOrderOnlyDetail(detail)) {
        return { kind: "first_order_only" };
    }

    return { kind: "not_found" };
}

type ShopTranslate = (key: string, values?: Record<string, string>) => string;

export function formatPromoCodeResolveError(
    parsed: PromoCodeResolveError,
    tShop: ShopTranslate,
): string {
    if (parsed.kind === "exhausted") return tShop("codeExhausted");
    if (parsed.kind === "user_limit_reached") return tShop("codeUserLimitReached");
    if (parsed.kind === "first_order_only") return tShop("codeFirstOrderOnly");
    if (parsed.kind === "min_order" && parsed.minOrderAmount != null) {
        const minEuros = (parsed.minOrderAmount / 100).toFixed(2);
        return tShop("codeMinOrder", { minAmount: `${minEuros}€` });
    }
    return tShop("codeNotFound");
}
