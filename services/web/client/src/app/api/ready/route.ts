export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredPublicEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  };
}

export function GET(): Response {
  const checks = Object.fromEntries(
    Object.entries(getRequiredPublicEnv()).map(([key, value]) => [key, Boolean(value)]),
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
