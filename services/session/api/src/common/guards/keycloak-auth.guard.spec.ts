import { UnauthorizedException } from '@nestjs/common';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';

function mockContext(type: string, request: unknown = undefined) {
    return {
        getType: () => type,
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({ getRequest: () => request }),
    } as never;
}

function createGuard(isPublic = false) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) };
    const configService = { get: jest.fn() };
    return new KeycloakAuthGuard(reflector as never, configService as never);
}

describe('KeycloakAuthGuard', () => {
    describe('websocket context', () => {
        it('nominal: lets gateway handlers through without reading HTTP headers', async () => {
            const guard = createGuard();

            // A Socket.IO client has no `headers`/`method`: reading them used to crash
            // every `@SubscribeMessage` handler once NestJS 12 applied global guards to gateways.
            await expect(guard.canActivate(mockContext('ws', { id: 'socket-1' }))).resolves.toBe(true);
        });

        it('edge: also skips non-http contexts with an undefined client payload', async () => {
            const guard = createGuard();

            await expect(guard.canActivate(mockContext('ws', undefined))).resolves.toBe(true);
        });
    });

    describe('http context', () => {
        it('nominal: lets CORS preflight requests through', async () => {
            const guard = createGuard();

            await expect(guard.canActivate(mockContext('http', { method: 'OPTIONS', headers: {} }))).resolves.toBe(
                true,
            );
        });

        it('nominal: lets @Public() routes through', async () => {
            const guard = createGuard(true);

            await expect(guard.canActivate(mockContext('http', { method: 'GET', headers: {} }))).resolves.toBe(true);
        });

        it('failure: rejects a request without authorization header', async () => {
            const guard = createGuard();

            await expect(guard.canActivate(mockContext('http', { method: 'GET', headers: {} }))).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('failure: rejects a malformed authorization header', async () => {
            const guard = createGuard();
            const request = { method: 'GET', headers: { authorization: 'Basic abc' } };

            await expect(guard.canActivate(mockContext('http', request))).rejects.toThrow(UnauthorizedException);
        });
    });
});
