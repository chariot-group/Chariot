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

export interface PaymentIntentResult {
    isFreeOrder: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    giftAmountPerUnit?: number;
}

export interface FreeOrderResult {
    orderId: string;
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

    async resolveCode(code: string, orderAmount: number): Promise<ResolvedCode> {
        const response = await createPaymentApiClient().get<IResponse<ResolvedCode>>(
            `${this.STRIPE_PATH}/resolve-code/${encodeURIComponent(code)}`,
            { params: { orderAmount } },
        );
        return response.data.data;
    }

    async createPaymentIntent(
        packId: string,
        displayName: string,
        promoCode?: string,
        affiliationCode?: string,
        quantity?: number,
    ): Promise<PaymentIntentResult> {
        const response = await createPaymentApiClient().post<IResponse<PaymentIntentResult>>(
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
    ): Promise<PaymentIntentResult> {
        const response = await createPaymentApiClient().patch<IResponse<PaymentIntentResult>>(
            `${this.STRIPE_PATH}/payment-intent/${encodeURIComponent(piId)}`,
            {
                ...(quantity && quantity > 1 && { quantity }),
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
            },
        );
        return response.data.data;
    }

    async fulfillFreeOrder(
        packId: string,
        displayName: string,
        quantity?: number,
        promoCode?: string,
        affiliationCode?: string,
    ): Promise<FreeOrderResult> {
        const response = await createPaymentApiClient().post<IResponse<FreeOrderResult>>(
            `${this.STRIPE_PATH}/free-order`,
            {
                packId,
                displayName,
                ...(quantity && quantity > 1 && { quantity }),
                ...(promoCode && { promoCode }),
                ...(affiliationCode && { affiliationCode }),
            },
        );
        return response.data.data;
    }
}

const paymentService = new PaymentService();
export default paymentService;
