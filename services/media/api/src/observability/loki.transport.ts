import TransportStream from 'winston-transport';

type LokiLabels = Record<string, string>;

interface LokiTransportOptions extends TransportStream.TransportStreamOptions {
  host: string;
  labels?: LokiLabels;
  intervalMs?: number;
  maxBatchSize?: number;
}

const RESERVED_KEYS = new Set([
  'level',
  'message',
  'timestamp',
  'service',
  'environment',
  'app',
  'context',
  'stack',
  'splat',
  'label',
  'labels',
  'ms',
  'trace_id',
  'span_id',
]);

function getTraceIds(): { trace_id?: string; span_id?: string } {
  try {
    // Optional peer dependency — present when OTEL is enabled
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const otel = require('@opentelemetry/api');
    const span = otel.trace.getSpan(otel.context.active());
    const spanCtx = span?.spanContext();
    return {
      trace_id: spanCtx?.traceId,
      span_id: spanCtx?.spanId,
    };
  } catch {
    return {};
  }
}

function buildLogLine(info: Record<string, unknown>): {
  level: string;
  line: string;
} {
  const level = String(info.level ?? 'info').toLowerCase();
  const message = info.message != null ? String(info.message) : '';
  const context =
    info.context != null ? String(info.context) : undefined;
  const stack = info.stack != null ? String(info.stack) : undefined;
  const { trace_id, span_id } = getTraceIds();

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(info)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (key.startsWith('Symbol(')) continue;
    extra[key] = value;
  }

  // Lean body: service / env / timestamp are Loki labels or Grafana time.
  const payload: Record<string, unknown> = { message };
  if (context) payload.context = context;
  if (stack) payload.stack = stack;
  if (trace_id) payload.trace_id = trace_id;
  if (span_id) payload.span_id = span_id;
  Object.assign(payload, extra);

  return { level, line: JSON.stringify(payload) };
}

/**
 * Winston → Loki push transport.
 * Stream labels: service, environment, app, level
 * Line JSON: { message, context?, stack?, trace_id?, span_id?, ...extras }
 */
export class LokiTransport extends TransportStream {
  private readonly pushUrl: string;
  private readonly baseLabels: LokiLabels;
  private readonly intervalMs: number;
  private readonly maxBatchSize: number;
  private buffer: Array<{ labels: LokiLabels; ts: string; line: string }> = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(opts: LokiTransportOptions) {
    super(opts);
    this.pushUrl = `${opts.host.replace(/\/$/, '')}/loki/api/v1/push`;
    this.baseLabels = opts.labels || {};
    this.intervalMs = opts.intervalMs ?? 2000;
    this.maxBatchSize = opts.maxBatchSize ?? 50;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.intervalMs);
    if (this.timer.unref) this.timer.unref();
  }

  log(info: Record<string, unknown>, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const { level, line } = buildLogLine(info);
    const ts = `${BigInt(Date.now()) * 1000000n}`;
    this.buffer.push({
      labels: { ...this.baseLabels, level },
      ts,
      line,
    });

    if (this.buffer.length >= this.maxBatchSize) {
      void this.flush();
    }
    callback();
  }

  async close(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    const batch = this.buffer.splice(0, this.maxBatchSize);
    try {
      const groups = new Map<
        string,
        { stream: LokiLabels; values: Array<[string, string]> }
      >();
      for (const entry of batch) {
        const key = JSON.stringify(entry.labels);
        let group = groups.get(key);
        if (!group) {
          group = { stream: entry.labels, values: [] };
          groups.set(key, group);
        }
        group.values.push([entry.ts, entry.line]);
      }

      await fetch(this.pushUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streams: [...groups.values()] }),
      });
    } catch {
      // drop on failure to avoid backpressure loops
    } finally {
      this.flushing = false;
    }
  }
}

export function createLokiTransport(serviceName: string): LokiTransport | null {
  if (process.env.LOKI_ENABLED !== 'true') return null;
  const host = process.env.LOKI_URL;
  if (!host) return null;

  return new LokiTransport({
    host,
    level: process.env.LOKI_LOG_LEVEL || 'info',
    labels: {
      service: serviceName,
      environment:
        process.env.OTEL_ENVIRONMENT || process.env.NODE_ENV || 'development',
      app: 'chariot',
    },
  });
}
