/**
 * OpenTelemetry bootstrap — call from instrumentation.ts before the Next server.
 * Disabled unless OTEL_ENABLED=true.
 */
export function isOpsUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0];
  return (
    path === "/metrics" ||
    path === "/health" ||
    path === "/ready" ||
    path === "/api/metrics" ||
    path === "/api/health" ||
    path === "/api/ready" ||
    path === "/api/logs" ||
    path.startsWith("/_next/") ||
    path.endsWith("/metrics") ||
    path.endsWith("/health") ||
    path.endsWith("/ready")
  );
}

function buildResource(
  resources: {
    Resource?: new (attrs: Record<string, string>) => unknown;
    resourceFromAttributes?: (attrs: Record<string, string>) => unknown;
  },
  semconv: Record<string, string>,
  serviceName: string,
) {
  const attrs = {
    [semconv.ATTR_SERVICE_NAME ?? semconv.SEMRESATTRS_SERVICE_NAME]: serviceName,
    [semconv.ATTR_SERVICE_VERSION ?? semconv.SEMRESATTRS_SERVICE_VERSION]:
      process.env.npm_package_version || "0.0.0",
    "deployment.environment":
      process.env.OTEL_ENVIRONMENT ||
      process.env.NEXT_PUBLIC_ENV_NAME ||
      process.env.NODE_ENV ||
      "development",
  };
  if (typeof resources.resourceFromAttributes === "function") {
    return resources.resourceFromAttributes(attrs);
  }
  if (typeof resources.Resource === "function") {
    return new resources.Resource(attrs);
  }
  throw new Error("No compatible Resource factory in @opentelemetry/resources");
}

export async function initTracing(serviceName: string): Promise<void> {
  if (process.env.OTEL_ENABLED !== "true") {
    return;
  }

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://127.0.0.1:4318";

  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)",
    ) as (specifier: string) => Promise<any>;

    const [{ NodeSDK }, autoInstr, exporter, resources, semconv] =
      await Promise.all([
        dynamicImport("@opentelemetry/sdk-node"),
        dynamicImport("@opentelemetry/auto-instrumentations-node"),
        dynamicImport("@opentelemetry/exporter-trace-otlp-http"),
        dynamicImport("@opentelemetry/resources"),
        dynamicImport("@opentelemetry/semantic-conventions"),
      ]);

    const sdk = new NodeSDK({
      resource: buildResource(resources, semconv, serviceName),
      traceExporter: new exporter.OTLPTraceExporter({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
      }),
      instrumentations: [
        autoInstr.getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
          "@opentelemetry/instrumentation-http": {
            ignoreIncomingRequestHook: (req: { url?: string }) =>
              isOpsUrl(req.url),
          },
        }),
      ],
    });

    await sdk.start();

    const shutdown = async () => {
      try {
        await sdk.shutdown();
      } catch {
        // ignore
      }
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error(`[otel] Failed to initialize tracing for ${serviceName}:`, error);
  }
}
