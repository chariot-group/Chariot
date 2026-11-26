import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

const ADMIN_ROLE = 'admin';

/** True when the authenticated request user holds the Keycloak realm role `admin`. */
export function hasAdminRole(user: unknown): boolean {
  const realmAccess = (user as { realm_access?: { roles?: string[] } } | null)
    ?.realm_access;
  return (realmAccess?.roles ?? []).includes(ADMIN_ROLE);
}

@Injectable()
export class IsAdminGuard implements CanActivate {
  private readonly logger = new Logger(IsAdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('IsAdminGuard: no user on request');
      throw new ForbiddenException('Access denied');
    }

    if (!hasAdminRole(user)) {
      this.logger.warn(
        `IsAdminGuard: user ${user.keycloakId} does not have role '${ADMIN_ROLE}'`,
      );
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
