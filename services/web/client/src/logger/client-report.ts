export const CLIENT_LOG_CONTEXTS = [
  "Keycloak",
  "Codex",
  "ErrorBoundary",
  "Navigation",
  "Storage",
] as const;

export const CLIENT_LOG_LEVELS = ["warn", "error"] as const;

export type ClientLogContext = (typeof CLIENT_LOG_CONTEXTS)[number];
export type ClientLogLevel = (typeof CLIENT_LOG_LEVELS)[number];

export type ClientLogPayload = {
  level: ClientLogLevel;
  message: string;
  context: ClientLogContext;
  path?: string;
};

const CONTEXT_SET = new Set<string>(CLIENT_LOG_CONTEXTS);
const LEVEL_SET = new Set<string>(CLIENT_LOG_LEVELS);

export function sanitizeClientMessage(raw: string): string {
  let text = raw.replace(/\s+/g, " ").trim();
  text = text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  text = text.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+/g, "[redacted-jwt]");
  return text.slice(0, 300);
}

export function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

export function sanitizeClientPath(raw: string): string | undefined {
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/")) return undefined;
  return path.slice(0, 200);
}

export function parseClientLogPayload(body: unknown): ClientLogPayload | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  if (!LEVEL_SET.has(String(rec.level))) return null;
  if (!CONTEXT_SET.has(String(rec.context))) return null;
  if (typeof rec.message !== "string" || !rec.message.trim()) return null;

  const path = typeof rec.path === "string" ? sanitizeClientPath(rec.path) : undefined;

  return {
    level: rec.level as ClientLogLevel,
    message: sanitizeClientMessage(rec.message),
    context: rec.context as ClientLogContext,
    path,
  };
}
