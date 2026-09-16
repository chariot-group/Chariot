export interface TimePoint {
    date: string;
    count: number;
}

export interface UserTimestamp {
    userId: string;
    at: string;
}

export interface PaymentBusinessAnalytics {
    funnel: {
        referralValidated: number;
        firstPurchase: number;
        referralOverTime: TimePoint[];
        firstPurchaseOverTime: TimePoint[];
    };
    monetization: {
        payingUsers: number;
        firstPurchasers: number;
        repeatPurchasers: number;
        repeatPurchaseRate: number;
        firstPurchaseByUser: UserTimestamp[];
    };
}
