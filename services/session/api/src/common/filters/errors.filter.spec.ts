import { BadRequestException, HttpStatus } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { ErrorDetailsFilter } from '@/common/filters/errors.filter';

function httpHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
        getType: () => 'http',
        switchToHttp: () => ({
            getResponse: () => ({ status }),
            getRequest: () => ({ url: '/sessions' }),
        }),
    } as never;
    return { host, status, json };
}

describe('ErrorDetailsFilter', () => {
    afterEach(() => jest.restoreAllMocks());

    it('nominal: formats HTTP exceptions as problem details', () => {
        const { host, status, json } = httpHost();

        new ErrorDetailsFilter().catch(new BadRequestException('nope'), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 400, instance: '/sessions', detail: 'nope' }));
    });

    it('edge: unknown errors become a 500 problem detail', () => {
        const { host, status, json } = httpHost();

        new ErrorDetailsFilter().catch(new Error('boom'), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 500, detail: 'boom' }));
    });

    it('websocket: delegates to the default WS filter without touching an HTTP response', () => {
        const wsCatch = jest.spyOn(BaseWsExceptionFilter.prototype, 'catch').mockImplementation(() => undefined);
        const switchToHttp = jest.fn();
        const host = { getType: () => 'ws', switchToHttp } as never;
        const error = new Error('ws failure');

        new ErrorDetailsFilter().catch(error, host);

        expect(wsCatch).toHaveBeenCalledWith(error, host);
        expect(switchToHttp).not.toHaveBeenCalled();
    });
});
