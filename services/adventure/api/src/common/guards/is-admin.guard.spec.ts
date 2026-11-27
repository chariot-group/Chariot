import { ForbiddenException } from '@nestjs/common';
import { hasAdminRole, IsAdminGuard } from '@/common/guards/is-admin.guard';

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

describe('hasAdminRole', () => {
  it('nominal: true for a user with the admin realm role', () => {
    expect(hasAdminRole({ realm_access: { roles: ['user', 'admin'] } })).toBe(
      true,
    );
  });

  it('failure: false without realm roles or user', () => {
    expect(hasAdminRole({ realm_access: { roles: ['user'] } })).toBe(false);
    expect(hasAdminRole({})).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });
});
