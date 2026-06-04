export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
    id: string;
    userId: string;
    userDisplayName: string | null;
    stripeOrderId: string | null;
    referralDiscountType: "referee" | "referrer" | null;
    stripeSessionId: string | null;
    amount: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
    status: PaymentStatus;
    tokenCount: number | null;
    promoCode?: { code: string } | null;
    affiliation?: { code: string; creatorName: string } | null;
    createdAt: string;
}

export const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, "success" | "warning" | "destructive" | "secondary"> = {
    COMPLETED: "success",
    PENDING: "warning",
    FAILED: "destructive",
    REFUNDED: "secondary",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    COMPLETED: "Complété",
    PENDING: "En attente",
    FAILED: "Échoué",
    REFUNDED: "Remboursé",
};

export function buildPaymentsParams(page: number, limit: number, statusFilter: string, search: string): Record<string, unknown> {
    const params: Record<string, unknown> = { page, limit };

    if (statusFilter !== "all") {
        params.status = statusFilter;
    }

    if (search.trim()) {
        params.userId = search.trim();
    }

    return params;
}
