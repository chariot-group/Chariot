import { ForbiddenException } from '@nestjs/common';
import { IsAdminGuard } from '@/common/guards/is-admin.guard';

function mockContext(user: unknown) {
    return {
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
    } as never;
}

describe('IsAdminGuard', () => {
    const guard = new IsAdminGuard();

    it('nominal: allows a user with realm role admin', () => {
        expect(
            guard.canActivate(
                mockContext({
                    keycloakId: 'user-1',
                    realm_access: { roles: ['admin'] },
                }),
            ),
        ).toBe(true);
    });

    it('failure: rejects a user without admin role', () => {
        expect(() =>
            guard.canActivate(
                mockContext({
                    keycloakId: 'user-1',
                    realm_access: { roles: ['user'] },
                }),
            ),
        ).toThrow(ForbiddenException);
    });

    it('failure: rejects a request without user', () => {
        expect(() => guard.canActivate(mockContext(undefined))).toThrow(
            ForbiddenException,
        );
    });
});
