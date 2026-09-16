import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { GatewayMetricsService } from "@/metrics/gateway-metrics.service";
import { instance } from "@/logger/winston.logger";
import { isOpsPath } from "@/common/utils/request-log.utils";

/**
 * Skips CORS preflight (OPTIONS) so each cross-origin API call does not consume
 * two slots in the rate-limit window (OPTIONS + actual request).
 */
@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly gatewayMetrics: GatewayMetricsService,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { req } = this.getRequestResponse(context);
    if (req.method === "OPTIONS") {
      return true;
    }

    const path = typeof req.path === "string" ? req.path : typeof req.url === "string" ? req.url.split("?")[0] : "";
    if (path && isOpsPath(path)) {
      return true;
    }

    return super.shouldSkip(context);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req } = this.getRequestResponse(context);
    const route = req.route?.path || req.path || "unknown";

    this.gatewayMetrics.recordRateLimitExceeded(route);
    instance.warn({
      message: `Rate limit exceeded: ${req.method} ${req.url}`,
      context: "GatewayThrottlerGuard",
      method: req.method,
      url: req.url,
      route,
      ip: req.ip,
      limit: throttlerLimitDetail.limit,
      ttl: throttlerLimitDetail.ttl,
    });

    throw new ThrottlerException(await this.getErrorMessage(context, throttlerLimitDetail));
  }
}
