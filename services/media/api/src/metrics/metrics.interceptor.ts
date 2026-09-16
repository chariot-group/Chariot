import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    @InjectMetric('chariot_media_http_requests_total')
    private readonly httpRequests: Counter<string>,
    @InjectMetric('chariot_media_http_request_duration_seconds')
    private readonly httpDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.path || req.url || 'unknown';
    const end = this.httpDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const statusCode = String(res.statusCode);
          const duration = (Date.now() - startTime) / 1000;

          this.httpRequests.inc({
            method,
            route,
            status_code: statusCode,
          });
          end();

          this.logger.debug(
            `${method} ${route} ${statusCode} - ${duration.toFixed(3)}s`,
          );
        },
        error: (error) => {
          const statusCode = String(error.status || 500);
          const duration = (Date.now() - startTime) / 1000;

          this.httpRequests.inc({
            method,
            route,
            status_code: statusCode,
          });
          end();

          const line = `${method} ${route} ${statusCode} - ${duration.toFixed(3)}s - ${error.message}`;
          if (Number(statusCode) >= 500) {
            this.logger.error(line);
          } else {
            this.logger.debug(line);
          }
        },
      }),
    );
  }
}
