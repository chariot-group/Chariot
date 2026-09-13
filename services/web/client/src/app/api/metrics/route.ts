export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";
  const body = [
    "# HELP chariot_web_up Next.js process is serving requests.",
    "# TYPE chariot_web_up gauge",
    "chariot_web_up 1",
    "# HELP chariot_web_info Build information.",
    "# TYPE chariot_web_info gauge",
    `chariot_web_info{version="${version}"} 1`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
