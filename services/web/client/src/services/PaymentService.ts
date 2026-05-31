import { createPaymentApiClient } from '@/services/ApiService';

interface IResponse<T> {
    message: string;
    data: T;
}

interface StripePrice {
    id: string;
    currency: string;
    unit_amount: number | null;
}

export interface StripeProduct {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    metadata: {
        token_number?: string;
        [key: string]: string | undefined;
    };
    prices: StripePrice[];
}

export interface ResolvedCode {
    type: 'promo' | 'affiliation';
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
}

export interface CheckoutSessionStatus {
    status: 'complete' | 'expired' | 'open';
    paymentStatus: string;
}

class PaymentService {
    private readonly STRIPE_PATH = '/stripe';

    async getProducts(): Promise<StripeProduct[]> {
        const response = await createPaymentApiClient().get<IResponse<StripeProduct[]>>(
            `${this.STRIPE_PATH}/products`,
        );
        return response.data.data;
    }

    async createCheckoutSession(
        packId: string,
        displayName: string,
        promoCode?: string,
        affiliationCode?: string,
    ): Promise<string> {
        const response = await createPaymentApiClient().post<IResponse<string>>(
            `${this.STRIPE_PATH}/checkout`,
            {
                packId,
                displayName,
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
            },
        );
        return response.data.data;
    }

    async createEmbeddedCheckoutSession(
        packId: string,
        displayName: string,
        locale: string,
        promoCode?: string,
        affiliationCode?: string,
    ): Promise<string> {
        const response = await createPaymentApiClient().post<IResponse<{ clientSecret: string }>>(
            `${this.STRIPE_PATH}/checkout/embedded`,
            {
                packId,
                displayName,
                locale,
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
            },
        );
        return response.data.data.clientSecret;
    }

    async getCheckoutStatus(sessionId: string): Promise<CheckoutSessionStatus> {
        const response = await createPaymentApiClient().get<IResponse<CheckoutSessionStatus>>(
            `${this.STRIPE_PATH}/checkout/status/${encodeURIComponent(sessionId)}`,
        );
        return response.data.data;
    }

    async resolveCode(code: string): Promise<ResolvedCode> {
        const response = await createPaymentApiClient().get<IResponse<ResolvedCode>>(
            `${this.STRIPE_PATH}/resolve-code/${encodeURIComponent(code)}`,
        );
        return response.data.data;
    }
}

const paymentService = new PaymentService();
export default paymentService;
