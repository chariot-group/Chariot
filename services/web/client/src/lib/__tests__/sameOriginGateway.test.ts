import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/** next.config.ts lives outside src/ (no @/ alias): resolved from the project root. */
const NEXT_CONFIG = path.resolve(__dirname, "../../../next.config.ts");
type NextConfigModule = { default: { rewrites?: () => Promise<unknown> } };

/**
 * FR-web-first-load-performance, requirement 18 — same-origin API under /gateway/*.
 * Traefik routing and cookie stripping (integ/prod) are declared in services/gateway/compose.*.yml.
 */

vi.mock("next-intl/middleware", () => ({ default: () => () => undefined }));

describe("same-origin gateway prefix (FR-web-first-load-performance)", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalGateway = process.env.GATEWAY_INTERNAL_URL;

  afterEach(() => {
    // Assigning undefined to process.env would store the string "undefined".
    for (const [key, value] of [["NEXT_PUBLIC_API_URL", originalApiUrl], ["GATEWAY_INTERNAL_URL", originalGateway]] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  it("nominal: API clients build gateway URLs under the app-origin prefix", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://app.chariot.test/gateway";
    vi.resetModules();
    const { default: apiClient, createPaymentApiClient } = await import("@/services/ApiService");

    expect(apiClient().defaults.baseURL).toBe("https://app.chariot.test/gateway/api");
    expect(createPaymentApiClient().defaults.baseURL).toBe("https://app.chariot.test/gateway/payment");
  });

  it("edge: the locale middleware leaves /gateway/* to the gateway but still handles look-alike paths", async () => {
    const { config } = await import("@/proxy");
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test("/gateway/api/user/me")).toBe(false);
    expect(matcher.test("/gateway/payment/referral/init")).toBe(false);
    expect(matcher.test("/api/health")).toBe(false);
    expect(matcher.test("/fr/welcome")).toBe(true);
    expect(matcher.test("/gatewayx")).toBe(true);
  });

  it("nominal/guard: Next.js rewrites /gateway/* only when an internal gateway URL is configured", async () => {
    process.env.GATEWAY_INTERNAL_URL = "http://chariot-gateway:8082/";
    const { default: withGateway } = (await import(NEXT_CONFIG)) as NextConfigModule;
    await expect(withGateway.rewrites?.()).resolves.toEqual([
      { source: "/gateway/:path*", destination: "http://chariot-gateway:8082/:path*" },
    ]);

    delete process.env.GATEWAY_INTERNAL_URL;
    vi.resetModules();
    const { default: withoutGateway } = (await import(NEXT_CONFIG)) as NextConfigModule;
    await expect(withoutGateway.rewrites?.()).resolves.toEqual([]);
  });
});
