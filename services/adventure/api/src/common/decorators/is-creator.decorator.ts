import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { IsCreatorGuard } from '@/common/guards/is-creator.guard';

export const IS_CREATOR_KEY = 'isCreatorService';

export function IsCreator(serviceClass: Type<any>) {
  return applyDecorators(
    SetMetadata('service', serviceClass),
    UseGuards(IsCreatorGuard),
  );
}
