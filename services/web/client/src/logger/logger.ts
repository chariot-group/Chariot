import { createLokiTransport, type LokiTransport } from "@/observability/loki.transport";

const SERVICE = "web";
const isDev = process.env.NODE_ENV === "development";
const consoleLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

const LEVEL_ORDER: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  context?: string;
  stack?: string;
  [key: string]: unknown;
};

function allowed(level: LogLevel, min: string): boolean {
  return (LEVEL_ORDER[level] ?? 2) <= (LEVEL_ORDER[min] ?? 2);
}

let loki: LokiTransport | null | undefined;

function getLoki(): LokiTransport | null {
  if (loki === undefined) {
    loki = createLokiTransport(SERVICE);
  }
  return loki;
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const context = fields?.context != null ? String(fields.context) : undefined;
  const stack = fields?.stack != null ? String(fields.stack) : undefined;
  const timestamp = new Date().toISOString();

  if (allowed(level, consoleLevel)) {
    if (isDev) {
      const scope = context ? `${SERVICE}/${context}` : SERVICE;
      const line = `${timestamp} ${level} [${scope}] ${stack || message}`;
      if (level === "error") console.error(line);
      else if (level === "warn") console.warn(line);
      else console.log(line);
    } else {
      console.log(JSON.stringify({ timestamp, level, message, context, stack }));
    }
  }

  getLoki()?.log({ level, message, context, stack, ...fields });
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

export function isOpsPath(path: string): boolean {
  return (
    path.startsWith("/api/metrics") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/logs") ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico" ||
    path === "/favicon.svg" ||
    path === "/site.webmanifest"
  );
}
