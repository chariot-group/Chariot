import { Module } from "@nestjs/common";
import {
  makeCounterProvider,
  makeHistogramProvider,
} from "@willsoto/nestjs-prometheus";
import { MetricsInterceptor } from "./metrics.interceptor";

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

@Module({
  providers: [
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
  ],
  exports: [
    MetricsInterceptor,
    httpRequestsCounterProvider,
    httpRequestDurationProvider,
  ],
})
export class MetricsModule {}
