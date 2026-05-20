import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalGuard implements CanActivate {
    private readonly logger = new Logger(InternalGuard.name);
    private readonly SERVICE_NAME = InternalGuard.name;
    private readonly secret: string;

    constructor(private readonly configService: ConfigService) {
        this.secret = this.configService.get<string>('INTERNAL_SERVICE_SECRET') ?? '';
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const headerSecret = request.headers['x-internal-service-secret'];

        if (!this.secret || !headerSecret || headerSecret !== this.secret) {
            this.logger.warn('InternalGuard: unauthorized internal service call attempt', this.SERVICE_NAME);
            throw new ForbiddenException('Internal access denied');
        }

        return true;
    }
}
