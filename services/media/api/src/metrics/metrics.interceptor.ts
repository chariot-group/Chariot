import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('chariot_media_http_requests_total')
    private readonly httpRequests: Counter<string>,
    @InjectMetric('chariot_media_http_request_duration_seconds')
    private readonly httpDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.path || 'unknown';
    const end = this.httpDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.httpRequests.inc({
            method,
            route,
            status_code: String(res.statusCode),
          });
          end();
        },
        error: () => {
          this.httpRequests.inc({
            method,
            route,
            status_code: '500',
          });
          end();
        },
      }),
    );
  }
}
