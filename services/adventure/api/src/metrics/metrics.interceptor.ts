import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    @InjectMetric('chariot_http_requests_total')
    private readonly httpRequestsCounter: Counter,
    @InjectMetric('chariot_http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, route } = request;

    // Le chemin de la route (ex: /campaigns/:id)
    const routePath = route?.path || url;

    return next.handle().pipe(
      tap({
        next: () => {
          // Requête réussie
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = (Date.now() - startTime) / 1000; // En secondes

          // Incrémenter le compteur de requêtes
          this.httpRequestsCounter.inc({
            method,
            route: routePath,
            status_code: statusCode.toString(),
          });

          // Enregistrer la durée de la requête
          this.httpRequestDuration.observe(
            {
              method,
              route: routePath,
            },
            duration,
          );

          this.logger.debug(
            `${method} ${routePath} ${statusCode} - ${duration.toFixed(3)}s`,
          );
        },
        error: (error) => {
          // Requête en erreur
          const statusCode = error.status || 500;
          const duration = (Date.now() - startTime) / 1000;

          this.httpRequestsCounter.inc({
            method,
            route: routePath,
            status_code: statusCode.toString(),
          });

          this.httpRequestDuration.observe(
            {
              method,
              route: routePath,
            },
            duration,
          );

          this.logger.error(
            `${method} ${routePath} ${statusCode} - ${duration.toFixed(3)}s - ${error.message}`,
          );
        },
      }),
    );
  }
}
