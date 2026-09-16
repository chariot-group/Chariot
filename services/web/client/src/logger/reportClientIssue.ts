import {
  messageFromUnknown,
  sanitizeClientMessage,
  sanitizeClientPath,
  type ClientLogContext,
  type ClientLogLevel,
} from "@/logger/client-report";

const DEDUP_MS = 10_000;
const MAX_PER_WINDOW = 10;
const WINDOW_MS = 60_000;

const lastSent = new Map<string, number>();
let windowStartedAt = 0;
let windowCount = 0;

function allowSend(key: string, now: number): boolean {
  if (now - windowStartedAt > WINDOW_MS) {
    windowStartedAt = now;
    windowCount = 0;
  }
  if (windowCount >= MAX_PER_WINDOW) return false;

  const previous = lastSent.get(key) ?? 0;
  if (now - previous < DEDUP_MS) return false;

  lastSent.set(key, now);
  windowCount += 1;
  return true;
}

function send(level: ClientLogLevel, message: string, context: ClientLogContext): void {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  const now = Date.now();
  const key = `${level}:${context}:${message}`;
  if (!allowSend(key, now)) return;

  const path = sanitizeClientPath(window.location.pathname);
  void fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, message, context, path }),
    keepalive: true,
  }).catch(() => {
    // swallow — reporting must never break the UI
  });
}

export function reportClientIssue(
  level: ClientLogLevel,
  message: string,
  context: ClientLogContext,
  error?: unknown,
): void {
  const text =
    error !== undefined ? `${message}: ${messageFromUnknown(error)}` : message;
  const sanitized = sanitizeClientMessage(text);

  if (level === "error") {
    console.error(`[${context}] ${sanitized}`);
  } else {
    console.warn(`[${context}] ${sanitized}`);
  }

  send(level, sanitized, context);
}
