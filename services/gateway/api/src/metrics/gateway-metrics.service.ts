import { Injectable } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter } from "prom-client";

@Injectable()
export class GatewayMetricsService {
  constructor(
    @InjectMetric("gateway_proxy_errors_total")
    private readonly proxyErrors: Counter<string>,
    @InjectMetric("gateway_rate_limit_exceeded_total")
    private readonly rateLimitExceeded: Counter<string>,
  ) {}

  recordProxyError(backend: string, errorType: string): void {
    this.proxyErrors.inc({ backend, error_type: errorType });
  }

  recordRateLimitExceeded(route: string): void {
    this.rateLimitExceeded.inc({ route });
  }
}
