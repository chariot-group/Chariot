export type PromoCodeResolveErrorKind =
    | "exhausted"
    | "user_limit_reached"
    | "min_order"
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
            message?: {
                errorCode?: string;
                minOrderAmount?: number;
            };
        };
    };
};

/** @see FR-stripe-checkout — promo code resolution at checkout */
export function parsePromoCodeResolveError(err: unknown): PromoCodeResolveError {
    const axiosErr = err as AxiosLikeError;
    const status = axiosErr?.response?.status;
    const data = axiosErr?.response?.data;
    const errorCode = data?.errorCode ?? data?.message?.errorCode;
    const minOrderAmount = data?.minOrderAmount ?? data?.message?.minOrderAmount;

    if (status === 410 && errorCode === "PROMO_EXHAUSTED") {
        return { kind: "exhausted" };
    }
    if (status === 410 && errorCode === "PROMO_USER_LIMIT_REACHED") {
        return { kind: "user_limit_reached" };
    }
    if (status === 422 && errorCode === "PROMO_MIN_ORDER" && minOrderAmount != null) {
        return { kind: "min_order", minOrderAmount };
    }

    return { kind: "not_found" };
}
