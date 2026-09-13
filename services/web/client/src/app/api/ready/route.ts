export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_KEYCLOAK_URL",
  "NEXT_PUBLIC_KEYCLOAK_REALM",
  "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID",
] as const;

export function GET(): Response {
  const checks = Object.fromEntries(
    REQUIRED_ENV.map((key) => [key, Boolean(process.env[key])]),
  );
  const ready = Object.values(checks).every(Boolean);

  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      checks,
    },
    { status: ready ? 200 : 503 },
  );
}
