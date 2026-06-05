import { createPaymentApiClient } from '@/services/ApiService';

interface IResponse<T> {
    message: string;
    data: T;
}

export interface ReferralInfo {
    id: string;
    code: string;
    userId: string;
    pendingReferralsCount: number;
    currentDiscountPercent: number; // discount % available as parrain (0 if none)
    refereeCount: number;           // total filleuls ever (registered)
    validatedRefereeCount: number;  // filleuls who made at least 1 purchase
    createdAt: string;
    referees: Array<{
        id: string;
        refereeUserId: string;
        registeredAt: string;
        discountUsed: boolean;
        discountUsedAt?: string | null;
    }>;
    myRefereeDiscount: {
        available: boolean;
        discountPercent: number;
        usedAt?: string | null;
    } | null;
}

export interface ReferralInitResult {
    code: string;
    refereeDiscountApplied: boolean;
}

class ReferralService {
    private readonly BASE_PATH = '/referral';

    async init(referralCode?: string): Promise<ReferralInitResult> {
        const response = await createPaymentApiClient().post<IResponse<ReferralInitResult>>(
            `${this.BASE_PATH}/init`,
            { referralCode },
        );
        return response.data.data;
    }

    async getMyReferral(): Promise<ReferralInfo> {
        const response = await createPaymentApiClient().get<IResponse<ReferralInfo>>(
            `${this.BASE_PATH}/me`,
        );
        return response.data.data;
    }
}

const referralService = new ReferralService();
export default referralService;
