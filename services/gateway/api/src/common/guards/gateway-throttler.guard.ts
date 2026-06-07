import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

const THROTTLE_EXEMPT_PATHS = ["/health", "/ready", "/metrics"];

/**
 * Skips CORS preflight (OPTIONS) so each cross-origin API call does not consume
 * two slots in the rate-limit window (OPTIONS + actual request).
 */
@Injectable()
export class GatewayThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { req } = this.getRequestResponse(context);
    if (req.method === "OPTIONS") {
      return true;
    }

    const path = typeof req.path === "string" ? req.path : typeof req.url === "string" ? req.url.split("?")[0] : "";
    if (path && THROTTLE_EXEMPT_PATHS.some((exempt) => path === exempt || path.startsWith(`${exempt}/`))) {
      return true;
    }

    return super.shouldSkip(context);
  }
}
