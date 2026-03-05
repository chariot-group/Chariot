import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers["user-agent"] || "Unknown";
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`Incoming ${method} ${url} from ${ip}`, {
      method,
      url,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          this.logger.log(`Response ${method} ${url} - ${statusCode} - ${duration}ms`, {
            method,
            url,
            statusCode,
            duration,
            ip,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(`Error ${method} ${url} - ${statusCode} - ${duration}ms`, {
            method,
            url,
            statusCode,
            duration,
            ip,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
