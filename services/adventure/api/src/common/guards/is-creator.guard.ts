import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  Type,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { Types } from 'mongoose';

type ResourcePayload = { createdBy: string };
type ResourceResponse = { data?: ResourcePayload };
type ResourceService = { findOne: (id: string) => Promise<ResourceResponse> };

@Injectable()
export class IsCreatorGuard implements CanActivate {
  private readonly logger = new Logger(IsCreatorGuard.name);

  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const serviceClass = this.reflector.get<Type<unknown>>('service', handler);

    if (!serviceClass) return true; // No service specified

    const request = context.switchToHttp().getRequest();
    const keycloakId = request.user?.keycloakId;
    const resourceId = request.params?.id;
    if (!keycloakId) throw new UnauthorizedException('User not authenticated');
    if (!resourceId) throw new ForbiddenException('Missing resource id');

    if (!Types.ObjectId.isValid(resourceId)) {
      const message = `Error while fetching resource #${resourceId}: Id is not a valid mongoose id`;
      throw new BadRequestException(message);
    }
    try {
      // Dynamically resolve the service using ModuleRef
      const service = (await this.moduleRef.resolve(
        serviceClass,
      )) as ResourceService;

      if (!service) {
        throw new ForbiddenException(`Service ${serviceClass} not found`);
      }

      const resource = await service.findOne(resourceId);

      if (!resource.data) throw new NotFoundException('Resource not found');

      this.logger.debug(
        `Checking creator: resource.createdBy="${resource.data.createdBy}" vs user.keycloakId="${keycloakId}"`,
      );

      if (resource.data.createdBy !== keycloakId) {
        throw new ForbiddenException('Forbidden: not the creator');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
