import { afterEach, describe, expect, it } from "vitest";
import { initTracing, isOpsUrl } from "@/observability/tracing";

describe("isOpsUrl", () => {
  it("nominal: ignore les routes ops et _next", () => {
    expect(isOpsUrl("/api/metrics")).toBe(true);
    expect(isOpsUrl("/api/ready?ts=1")).toBe(true);
    expect(isOpsUrl("/_next/static/chunk.js")).toBe(true);
    expect(isOpsUrl("/fr/welcome")).toBe(false);
  });

  it("edge: URL absente ou métier", () => {
    expect(isOpsUrl(undefined)).toBe(false);
    expect(isOpsUrl("/api/logs")).toBe(true);
    expect(isOpsUrl("/api/characters")).toBe(false);
  });
});

describe("initTracing", () => {
  const originalEnabled = process.env.OTEL_ENABLED;

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.OTEL_ENABLED;
    } else {
      process.env.OTEL_ENABLED = originalEnabled;
    }
  });

  it("failure: no-op tant que OTEL_ENABLED n'est pas true", async () => {
    delete process.env.OTEL_ENABLED;
    await expect(initTracing("chariot-web")).resolves.toBeUndefined();

    process.env.OTEL_ENABLED = "false";
    await expect(initTracing("chariot-web")).resolves.toBeUndefined();
  });
});
