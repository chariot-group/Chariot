import { Module } from "@nestjs/common";
import { makeCounterProvider, makeHistogramProvider } from "@willsoto/nestjs-prometheus";
import { MetricsInterceptor } from "./metrics.interceptor";
import { GatewayMetricsService } from "./gateway-metrics.service";

export const httpRequestsCounterProvider = makeCounterProvider({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpRequestDurationProvider = makeHistogramProvider({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const proxyErrorsCounterProvider = makeCounterProvider({
  name: "gateway_proxy_errors_total",
  help: "Total proxy errors to upstream backends",
  labelNames: ["backend", "error_type"],
});

export const rateLimitExceededCounterProvider = makeCounterProvider({
  name: "gateway_rate_limit_exceeded_total",
  help: "Total rate limit exceeded responses",
  labelNames: ["route"],
});

@Module({
  providers: [
    MetricsInterceptor,
    GatewayMetricsService,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    proxyErrorsCounterProvider,
    rateLimitExceededCounterProvider,
  ],
  exports: [
    MetricsInterceptor,
    GatewayMetricsService,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
    proxyErrorsCounterProvider,
    rateLimitExceededCounterProvider,
  ],
})
export class MetricsModule {}
