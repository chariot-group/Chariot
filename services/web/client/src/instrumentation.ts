type RequestInfo = {
  path: string;
  method: string;
};

type ErrorContext = {
  routePath?: string;
  routeType?: string;
};

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_KEYCLOAK_URL",
  "NEXT_PUBLIC_KEYCLOAK_REALM",
  "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID",
] as const;

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initTracing } = await import("@/observability/tracing");
  try {
    await initTracing("chariot-web");
  } catch {
    // Observability must never block Next boot (OTEL_ENABLED, OTLP, missing deps).
  }

  const { logger } = await import("@/logger/logger");

  logger.info("Web server started", { context: "NextServer" });

  for (const key of REQUIRED_PUBLIC_ENV) {
    if (!process.env[key]) {
      logger.warn(`Missing ${key}`, { context: "NextServer", env: key });
    }
  }
}

export async function onRequestError(
  error: Error & { digest?: string },
  request: RequestInfo,
  errorContext: ErrorContext,
): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logger, isOpsPath } = await import("@/logger/logger");
  const path = request.path || errorContext.routePath || "";
  if (isOpsPath(path)) return;

  logger.error(error.message || "Request failed", {
    context: "RequestError",
    path,
    method: request.method,
    routeType: errorContext.routeType,
    digest: error.digest,
    stack: error.stack,
  });
}
