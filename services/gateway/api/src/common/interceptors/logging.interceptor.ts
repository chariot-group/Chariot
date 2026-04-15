import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode =
            typeof error === "object" && error !== null && "status" in error
              ? Number((error as { status?: number }).status ?? 500)
              : 500;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const errorStack = error instanceof Error ? error.stack : undefined;

          this.logger.error(`Error ${method} ${url} - ${statusCode} - ${duration}ms`, {
            method,
            url,
            statusCode,
            duration,
            ip,
            error: errorMessage,
            stack: errorStack,
          });
        },
      }),
    );
  }
}
