import { of } from 'rxjs';
import { MetricsInterceptor } from '@/metrics/metrics.interceptor';

function createInterceptor() {
    const counter = { inc: jest.fn() };
    const histogram = { observe: jest.fn() };
    const interceptor = new MetricsInterceptor(counter as never, histogram as never);
    return { interceptor, counter, histogram };
}

describe('MetricsInterceptor', () => {
    it('nominal: records an HTTP request', (done) => {
        const { interceptor, counter, histogram } = createInterceptor();
        const context = {
            getType: () => 'http',
            switchToHttp: () => ({
                getRequest: () => ({ method: 'GET', url: '/sessions', route: { path: '/sessions' } }),
                getResponse: () => ({ statusCode: 200 }),
            }),
        } as never;

        interceptor.intercept(context, { handle: () => of('ok') }).subscribe({
            complete: () => {
                expect(counter.inc).toHaveBeenCalledWith({ method: 'GET', route: '/sessions', status_code: '200' });
                expect(histogram.observe).toHaveBeenCalled();
                done();
            },
        });
    });

    it('websocket: passes gateway handlers through without HTTP metrics', (done) => {
        const { interceptor, counter, histogram } = createInterceptor();
        const switchToHttp = jest.fn();
        const context = { getType: () => 'ws', switchToHttp } as never;

        // A WS context has no HTTP response: reading `statusCode` used to crash every gateway message.
        interceptor.intercept(context, { handle: () => of('ack') }).subscribe({
            next: (value) => expect(value).toBe('ack'),
            complete: () => {
                expect(switchToHttp).not.toHaveBeenCalled();
                expect(counter.inc).not.toHaveBeenCalled();
                expect(histogram.observe).not.toHaveBeenCalled();
                done();
            },
        });
    });
});
