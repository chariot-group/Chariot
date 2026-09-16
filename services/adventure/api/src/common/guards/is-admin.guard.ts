import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

const ADMIN_ROLE = 'admin';

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

    const roles: string[] =
      (user.realm_access as { roles?: string[] } | undefined)?.roles ?? [];

    if (!roles.includes(ADMIN_ROLE)) {
      this.logger.warn(
        `IsAdminGuard: user ${user.keycloakId} does not have role '${ADMIN_ROLE}'`,
      );
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
