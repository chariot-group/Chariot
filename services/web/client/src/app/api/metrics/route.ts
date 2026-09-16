export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response("# chariot web scrape\n", {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
