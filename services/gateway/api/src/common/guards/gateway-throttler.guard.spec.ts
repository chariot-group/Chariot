import { ExecutionContext } from "@nestjs/common";
import { GatewayThrottlerGuard } from "./gateway-throttler.guard";

describe("GatewayThrottlerGuard", () => {
  const guard = new GatewayThrottlerGuard({ throttlers: [] }, {} as never, {} as never);
  const shouldSkip = (context: ExecutionContext) =>
    (guard as unknown as { shouldSkip(ctx: ExecutionContext): Promise<boolean> }).shouldSkip(context);

  const buildContext = (method: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method, ip: "127.0.0.1" }),
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it("should skip throttling for OPTIONS preflight requests", async () => {
    await expect(shouldSkip(buildContext("OPTIONS"))).resolves.toBe(true);
  });

  it("should not skip throttling for non-OPTIONS requests", async () => {
    await expect(shouldSkip(buildContext("GET"))).resolves.toBe(false);
    await expect(shouldSkip(buildContext("POST"))).resolves.toBe(false);
  });

  it("should skip throttling for operational endpoints", async () => {
    const buildContextWithPath = (method: string, path: string): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ method, ip: "127.0.0.1", path }),
          getResponse: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      }) as unknown as ExecutionContext;

    await expect(shouldSkip(buildContextWithPath("GET", "/metrics"))).resolves.toBe(true);
    await expect(shouldSkip(buildContextWithPath("GET", "/health"))).resolves.toBe(true);
    await expect(shouldSkip(buildContextWithPath("GET", "/api/characters"))).resolves.toBe(false);
  });
});
