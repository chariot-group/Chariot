import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const OPS_ROUTES = new Set(['/metrics', '/', '/docs', '/docs-json']);

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    private readonly logger = new Logger(MetricsInterceptor.name);

    constructor(
        @InjectMetric('chariot_payment_http_requests_total')
        private readonly httpRequestsCounter: Counter,
        @InjectMetric('chariot_payment_http_request_duration_seconds')
        private readonly httpRequestDuration: Histogram,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const { method, url, route } = request;
        const routePath = route?.path || url;
        const isOps = OPS_ROUTES.has(routePath);

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    const duration = (Date.now() - startTime) / 1000;

                    this.httpRequestsCounter.inc({
                        method,
                        route: routePath,
                        status_code: statusCode.toString(),
                    });

                    this.httpRequestDuration.observe(
                        { method, route: routePath },
                        duration,
                    );

                    if (!isOps) {
                        this.logger.debug(
                            `${method} ${routePath} ${statusCode} - ${duration.toFixed(3)}s`,
                        );
                    }
                },
                error: (error) => {
                    const statusCode = error.status || 500;
                    const duration = (Date.now() - startTime) / 1000;

                    this.httpRequestsCounter.inc({
                        method,
                        route: routePath,
                        status_code: statusCode.toString(),
                    });

                    this.httpRequestDuration.observe(
                        { method, route: routePath },
                        duration,
                    );

                    if (isOps) {
                        return;
                    }

                    const line = `${method} ${routePath} ${statusCode} - ${duration.toFixed(3)}s - ${error.message}`;
                    if (statusCode >= 500) {
                        this.logger.error(line);
                    } else {
                        this.logger.debug(line);
                    }
                },
            }),
        );
    }
}
