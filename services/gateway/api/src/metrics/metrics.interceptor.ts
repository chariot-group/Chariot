import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";
import { Observable, tap } from "rxjs";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric("http_requests_total")
    private readonly httpRequests: Counter<string>,
    @InjectMetric("http_request_duration_seconds")
    private readonly httpDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.path || "unknown";
    const end = this.httpDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.httpRequests.inc({
            method,
            route,
            status: String(res.statusCode),
          });
          end();
        },
        error: (err: unknown) => {
          const status =
            typeof err === "object" && err !== null && "status" in err
              ? String((err as { status?: number }).status ?? 500)
              : "500";
          this.httpRequests.inc({ method, route, status });
          end();
        },
      }),
    );
  }
}
