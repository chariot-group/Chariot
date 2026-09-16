import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { instance } from "@/logger/winston.logger";
import { isOpsPath, resolveBackend } from "@/common/utils/request-log.utils";

const LOG_CONTEXT = "LoggingInterceptor";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;

    if (isOpsPath(url)) {
      return next.handle();
    }

    const userAgent = headers["user-agent"] || "Unknown";
    const backend = resolveBackend(url);
    const startTime = Date.now();

    instance.debug({
      message: `Incoming ${method} ${url}`,
      context: LOG_CONTEXT,
      method,
      url,
      ip,
      userAgent,
      backend,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          instance.info({
            message: `${method} ${url} ${statusCode} ${duration}ms`,
            context: LOG_CONTEXT,
            method,
            url,
            statusCode,
            duration,
            ip,
            backend,
          });
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode =
            typeof error === "object" && error !== null && "status" in error
              ? Number((error as { status?: number }).status ?? 500)
              : 500;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const payload = {
            message: `${method} ${url} ${statusCode} ${duration}ms`,
            context: LOG_CONTEXT,
            method,
            url,
            statusCode,
            duration,
            ip,
            backend,
            error: errorMessage,
          };

          if (statusCode >= 500) {
            instance.error(payload);
          } else {
            instance.warn(payload);
          }
        },
      }),
    );
  }
}
