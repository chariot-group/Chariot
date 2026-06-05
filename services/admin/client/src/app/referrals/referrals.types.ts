export interface ReferralItem {
    id: string;
    code: string;
    userId: string;
    username: string | null;
    pendingReferralsCount: number;
    currentDiscountPercent: number;
    refereeCount: number;
    validatedRefereeCount: number;
    nonPayingRefereesCount: number;
    createdAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}