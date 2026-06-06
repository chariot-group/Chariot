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

    async createPaymentIntent(
        packId: string,
        displayName: string,
        promoCode?: string,
        affiliationCode?: string,
        quantity?: number,
    ): Promise<{ clientSecret: string; paymentIntentId: string }> {
        const response = await createPaymentApiClient().post<IResponse<{ clientSecret: string; paymentIntentId: string }>>(
            `${this.STRIPE_PATH}/payment-intent`,
            {
                packId,
                displayName,
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
                ...(quantity && quantity > 1 && { quantity }),
            },
        );
        return response.data.data;
    }

    async updatePaymentIntent(
        piId: string,
        quantity?: number,
        promoCode?: string,
        affiliationCode?: string,
    ): Promise<void> {
        await createPaymentApiClient().patch(
            `${this.STRIPE_PATH}/payment-intent/${encodeURIComponent(piId)}`,
            {
                ...(quantity && quantity > 1 && { quantity }),
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
            },
        );
    }
}

const paymentService = new PaymentService();
export default paymentService;
