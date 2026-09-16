/**
 * OpenTelemetry bootstrap — call before NestFactory.create().
 * Disabled unless OTEL_ENABLED=true.
 * Packages are loaded via runtime dynamic import so the Nest app still
 * compiles when OTel deps are not installed yet.
 */
function isOpsUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return (
    path === '/metrics' ||
    path === '/health' ||
    path === '/ready' ||
    path === '/api/metrics' ||
    path === '/api/health' ||
    path === '/api/ready' ||
    path.endsWith('/metrics') ||
    path.endsWith('/health') ||
    path.endsWith('/ready')
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
      process.env.npm_package_version || '0.0.0',
    'deployment.environment':
      process.env.OTEL_ENVIRONMENT || process.env.NODE_ENV || 'development',
  };
  if (typeof resources.resourceFromAttributes === 'function') {
    return resources.resourceFromAttributes(attrs);
  }
  if (typeof resources.Resource === 'function') {
    return new resources.Resource(attrs);
  }
  throw new Error('No compatible Resource factory in @opentelemetry/resources');
}

type OtelSdkModule = {
  NodeSDK: new (config: {
    resource: unknown;
    traceExporter: unknown;
    instrumentations: unknown[];
  }) => {
    start: () => Promise<void> | void;
    shutdown: () => Promise<void>;
  };
};

type OtelAutoInstrModule = {
  getNodeAutoInstrumentations: (options: Record<string, unknown>) => unknown;
};

type OtelExporterModule = {
  OTLPTraceExporter: new (config: { url: string }) => unknown;
};

export async function initTracing(serviceName: string): Promise<void> {
  if (process.env.OTEL_ENABLED !== 'true') {
    return;
  }

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://127.0.0.1:4318';

  try {
    // Avoid static import paths so TypeScript does not require the packages at build time.
    const dynamicImport = new Function(
      'specifier',
      'return import(specifier)',
    ) as <T = unknown>(specifier: string) => Promise<T>;

    const [{ NodeSDK }, autoInstr, exporter, resources, semconv] =
      await Promise.all([
        dynamicImport<OtelSdkModule>('@opentelemetry/sdk-node'),
        dynamicImport<OtelAutoInstrModule>(
          '@opentelemetry/auto-instrumentations-node',
        ),
        dynamicImport<OtelExporterModule>(
          '@opentelemetry/exporter-trace-otlp-http',
        ),
        dynamicImport<Parameters<typeof buildResource>[0]>(
          '@opentelemetry/resources',
        ),
        dynamicImport<Record<string, string>>(
          '@opentelemetry/semantic-conventions',
        ),
      ]);

    const sdk = new NodeSDK({
      resource: buildResource(resources, semconv, serviceName),
      traceExporter: new exporter.OTLPTraceExporter({
        url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
      }),
      instrumentations: [
        autoInstr.getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-http': {
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
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(
      `[otel] Failed to initialize tracing for ${serviceName}:`,
      error,
    );
  }
}
