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

class PaymentService {
    private readonly STRIPE_PATH = '/stripe';

    async getProducts(): Promise<StripeProduct[]> {
        const response = await createPaymentApiClient().get<IResponse<StripeProduct[]>>(
            `${this.STRIPE_PATH}/products`,
        );
        return response.data.data;
    }

    async createCheckoutSession(packId: string, displayName: string): Promise<string> {
        const response = await createPaymentApiClient().post<IResponse<string>>(
            `${this.STRIPE_PATH}/checkout`,
            { packId, displayName },
        );
        return response.data.data;
    }
}

const paymentService = new PaymentService();
export default paymentService;
