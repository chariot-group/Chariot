import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/ready/route";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_KEYCLOAK_URL",
  "NEXT_PUBLIC_KEYCLOAK_REALM",
  "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID",
] as const;

const SAMPLE_ENV: Record<(typeof REQUIRED_ENV)[number], string> = {
  NEXT_PUBLIC_API_URL: "https://api.integ.example",
  NEXT_PUBLIC_KEYCLOAK_URL: "https://auth.integ.example",
  NEXT_PUBLIC_KEYCLOAK_REALM: "chariot",
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: "chariot-app",
};

describe("GET /api/ready", () => {
  const originalEnv = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of REQUIRED_ENV) {
      originalEnv.set(key, process.env[key]);
      process.env[key] = SAMPLE_ENV[key];
    }
  });

  afterEach(() => {
    for (const key of REQUIRED_ENV) {
      const previous = originalEnv.get(key);
      if (previous === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
  });

  it("nominal: returns 200 ready when all required env vars are set", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ready",
      checks: {
        NEXT_PUBLIC_API_URL: true,
        NEXT_PUBLIC_KEYCLOAK_URL: true,
        NEXT_PUBLIC_KEYCLOAK_REALM: true,
        NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: true,
      },
    });
  });

  it("edge: returns 503 when a single required env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.checks).toEqual({
      NEXT_PUBLIC_API_URL: false,
      NEXT_PUBLIC_KEYCLOAK_URL: true,
      NEXT_PUBLIC_KEYCLOAK_REALM: true,
      NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: true,
    });
  });

  it("failure: returns 503 when all required env vars are missing", async () => {
    for (const key of REQUIRED_ENV) {
      delete process.env[key];
    }

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "not_ready",
      checks: {
        NEXT_PUBLIC_API_URL: false,
        NEXT_PUBLIC_KEYCLOAK_URL: false,
        NEXT_PUBLIC_KEYCLOAK_REALM: false,
        NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: false,
      },
    });
  });
});
