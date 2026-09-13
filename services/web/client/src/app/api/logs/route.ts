import { parseClientLogPayload } from "@/logger/client-report";
import { logger } from "@/logger/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function allow(key: string): boolean {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || now > current.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request): Promise<Response> {
  if (!allow(clientKey(request))) {
    return new Response(null, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const payload = parseClientLogPayload(body);
  if (!payload) {
    return new Response(null, { status: 400 });
  }

  const fields = {
    context: payload.context,
    path: payload.path,
    source: "client",
  };

  if (payload.level === "error") {
    logger.error(payload.message, fields);
  } else {
    logger.warn(payload.message, fields);
  }

  return new Response(null, { status: 204 });
}
