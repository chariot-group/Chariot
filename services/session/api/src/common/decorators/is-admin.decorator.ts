import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { IsAdminGuard } from '@/common/guards/is-admin.guard';

export const IS_ADMIN_KEY = 'isAdmin';

export function IsAdmin() {
    return applyDecorators(
        SetMetadata(IS_ADMIN_KEY, true),
        UseGuards(IsAdminGuard),
    );
}
