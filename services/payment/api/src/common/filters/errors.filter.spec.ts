import { GoneException, UnprocessableEntityException } from '@nestjs/common';
import { ErrorDetailsFilter } from '@/common/filters/errors.filter';

function createMockHost(url = '/payment/stripe/resolve-code/TEST') {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    return {
        host: {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
                getRequest: () => ({ url }),
            }),
        },
        status,
        json,
    };
}

describe('ErrorDetailsFilter', () => {
    const filter = new ErrorDetailsFilter();

    it('preserves structured promo min-order fields (nominal)', () => {
        const { host, status, json } = createMockHost();
        const exception = new UnprocessableEntityException({
            errorCode: 'PROMO_MIN_ORDER',
            minOrderAmount: 200,
            message: "Le code promo 'TEST' nécessite un panier minimum de 2.00€",
        });

        filter.catch(exception, host as never);

        expect(status).toHaveBeenCalledWith(422);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 422,
                errorCode: 'PROMO_MIN_ORDER',
                minOrderAmount: 200,
                detail: "Le code promo 'TEST' nécessite un panier minimum de 2.00€",
            }),
        );
    });

    it('preserves structured promo exhausted fields (edge)', () => {
        const { host, status, json } = createMockHost();
        const exception = new GoneException({
            errorCode: 'PROMO_EXHAUSTED',
            message: "Le code promo 'TEST' a atteint son nombre maximum d'utilisations",
        });

        filter.catch(exception, host as never);

        expect(status).toHaveBeenCalledWith(410);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 410,
                errorCode: 'PROMO_EXHAUSTED',
                detail: "Le code promo 'TEST' a atteint son nombre maximum d'utilisations",
            }),
        );
    });

    it('keeps plain string exception messages (failure)', () => {
        const { host, status, json } = createMockHost();
        const exception = new GoneException("Code promo expiré");

        filter.catch(exception, host as never);

        expect(status).toHaveBeenCalledWith(410);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 410,
                detail: 'Code promo expiré',
            }),
        );
    });
});
