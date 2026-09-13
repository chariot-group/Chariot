type LokiLabels = Record<string, string>;

interface LokiTransportOptions {
  host: string;
  labels?: LokiLabels;
  intervalMs?: number;
  maxBatchSize?: number;
  level?: string;
}

const LEVEL_ORDER: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const RESERVED_KEYS = new Set([
  "level",
  "message",
  "timestamp",
  "service",
  "environment",
  "app",
  "context",
  "stack",
  "splat",
  "label",
  "labels",
  "ms",
  "trace_id",
  "span_id",
]);

export type LogInfo = {
  level: string;
  message: string;
  context?: string;
  stack?: string;
  [key: string]: unknown;
};

function buildLogLine(info: LogInfo): { level: string; line: string } {
  const level = String(info.level ?? "info").toLowerCase();
  const message = info.message != null ? String(info.message) : "";
  const context = info.context != null ? String(info.context) : undefined;
  const stack = info.stack != null ? String(info.stack) : undefined;

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(info)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (key.startsWith("Symbol(")) continue;
    extra[key] = value;
  }

  const payload: Record<string, unknown> = { message };
  if (context) payload.context = context;
  if (stack) payload.stack = stack;
  Object.assign(payload, extra);

  return { level, line: JSON.stringify(payload) };
}

/**
 * Fetch → Loki push. Same stream labels / line shape as the Nest backends.
 * Stream labels: service, environment, app, level
 * Line JSON: { message, context?, stack?, ...extras }
 */
export class LokiTransport {
  private readonly pushUrl: string;
  private readonly baseLabels: LokiLabels;
  private readonly intervalMs: number;
  private readonly maxBatchSize: number;
  private readonly minLevel: number;
  private buffer: Array<{ labels: LokiLabels; ts: string; line: string }> = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(opts: LokiTransportOptions) {
    this.pushUrl = `${opts.host.replace(/\/$/, "")}/loki/api/v1/push`;
    this.baseLabels = opts.labels || {};
    this.intervalMs = opts.intervalMs ?? 2000;
    this.maxBatchSize = opts.maxBatchSize ?? 50;
    this.minLevel = LEVEL_ORDER[(opts.level ?? "info").toLowerCase()] ?? LEVEL_ORDER.info;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.intervalMs);
    if (this.timer.unref) this.timer.unref();
  }

  log(info: LogInfo): void {
    const { level, line } = buildLogLine(info);
    if ((LEVEL_ORDER[level] ?? LEVEL_ORDER.info) > this.minLevel) return;

    const ts = `${Date.now() * 1000000}`;
    this.buffer.push({
      labels: { ...this.baseLabels, level },
      ts,
      line,
    });

    if (this.buffer.length >= this.maxBatchSize) {
      void this.flush();
    }
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
      const groups = new Map<string, { stream: LokiLabels; values: Array<[string, string]> }>();
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  if (process.env.LOKI_ENABLED !== "true") return null;
  const host = process.env.LOKI_URL;
  if (!host) return null;

  return new LokiTransport({
    host,
    level: process.env.LOKI_LOG_LEVEL || "info",
    labels: {
      service: serviceName,
      environment:
        process.env.OTEL_ENVIRONMENT || process.env.NEXT_PUBLIC_ENV_NAME || process.env.NODE_ENV || "development",
      app: "chariot",
    },
  });
}
