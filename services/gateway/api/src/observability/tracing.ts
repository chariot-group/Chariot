/**
 * OpenTelemetry bootstrap — call before NestFactory.create().
 * Disabled unless OTEL_ENABLED=true.
 * Packages are loaded via runtime dynamic import so the Nest app still
 * compiles when OTel deps are not installed yet.
 */
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
    ) as (specifier: string) => Promise<any>;

    const [{ NodeSDK }, autoInstr, exporter, resources, semconv] =
      await Promise.all([
        dynamicImport('@opentelemetry/sdk-node'),
        dynamicImport('@opentelemetry/auto-instrumentations-node'),
        dynamicImport('@opentelemetry/exporter-trace-otlp-http'),
        dynamicImport('@opentelemetry/resources'),
        dynamicImport('@opentelemetry/semantic-conventions'),
      ]);

    const sdk = new NodeSDK({
      resource: resources.resourceFromAttributes({
        [semconv.ATTR_SERVICE_NAME]: serviceName,
        [semconv.ATTR_SERVICE_VERSION]:
          process.env.npm_package_version || '0.0.0',
        'deployment.environment':
          process.env.OTEL_ENVIRONMENT ||
          process.env.NODE_ENV ||
          'development',
      }),
      traceExporter: new exporter.OTLPTraceExporter({
        url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
      }),
      instrumentations: [
        autoInstr.getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
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
