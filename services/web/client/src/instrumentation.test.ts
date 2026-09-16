import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initTracing = vi.fn().mockResolvedValue(undefined);
const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const isOpsPath = vi.fn().mockReturnValue(false);

vi.mock("@/observability/tracing", () => ({
  initTracing: (...args: unknown[]) => initTracing(...args),
}));

vi.mock("@/logger/logger", () => ({
  logger,
  isOpsPath: (...args: unknown[]) => isOpsPath(...args),
}));

describe("instrumentation", () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    initTracing.mockReset().mockResolvedValue(undefined);
    logger.info.mockReset();
    logger.warn.mockReset();
    logger.error.mockReset();
    isOpsPath.mockReset().mockReturnValue(false);
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8082";
    process.env.NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8081";
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM = "chariot";
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "chariot-app";
  });

  afterEach(() => {
    if (originalRuntime === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = originalRuntime;
    }
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("nominal: démarre le tracing puis le logger Node", async () => {
    const { register } = await import("@/instrumentation");

    await register();

    expect(initTracing).toHaveBeenCalledTimes(1);
    expect(initTracing).toHaveBeenCalledWith("chariot-web");
    expect(logger.info).toHaveBeenCalledWith("Web server started", {
      context: "NextServer",
    });
  });

  it("edge: n'initialise rien hors runtime Node", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const { register } = await import("@/instrumentation");

    await register();

    expect(initTracing).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("failure: un tracing en erreur n'empêche pas le logger de démarrer", async () => {
    initTracing.mockRejectedValueOnce(new Error("otlp down"));
    const { register } = await import("@/instrumentation");

    await register();

    expect(initTracing).toHaveBeenCalledWith("chariot-web");
    expect(logger.info).toHaveBeenCalledWith("Web server started", {
      context: "NextServer",
    });
  });
});
