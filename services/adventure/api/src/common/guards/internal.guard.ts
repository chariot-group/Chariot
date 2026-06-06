import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-internal-service-secret'];
    const expected = process.env.INTERNAL_SERVICE_SECRET;

    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid internal service secret');
    }

    return true;
  }
}
