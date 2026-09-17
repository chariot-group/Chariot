const OPS_PATHS = ["/health", "/ready", "/metrics"];

export function isOpsPath(url: string): boolean {
  const path = url.split("?")[0];
  return OPS_PATHS.some((ops) => path === ops || path.startsWith(`${ops}/`));
}

export function resolveBackend(url: string): string | undefined {
  const path = url.split("?")[0];
  if (path.startsWith("/api/media")) return "media";
  if (path.startsWith("/api")) return "adventure";
  if (path.startsWith("/session")) return "session";
  if (path.startsWith("/payment")) return "payment";
  return undefined;
}

export function classifyProxyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("timeout")) return "timeout";
  if (message.includes("ECONNRESET")) return "econnreset";
  if (message.includes("ENOTFOUND")) return "enotfound";
  if (message.includes("ECONNREFUSED")) return "econnrefused";
  return "unknown";
}
