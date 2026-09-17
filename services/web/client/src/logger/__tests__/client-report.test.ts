import { describe, expect, it } from "vitest";
import {
  messageFromUnknown,
  parseClientLogPayload,
  sanitizeClientMessage,
  sanitizeClientPath,
} from "@/logger/client-report";

describe("client-report", () => {
  it("nominal: accepte error/warn avec contexte connu", () => {
    expect(
      parseClientLogPayload({
        level: "error",
        message: "Keycloak initialization failed",
        context: "Keycloak",
        path: "/fr/welcome?code=abc",
      }),
    ).toEqual({
      level: "error",
      message: "Keycloak initialization failed",
      context: "Keycloak",
      path: "/fr/welcome",
    });
  });

  it("redacte JWT et Bearer, coupe à 300", () => {
    const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${"a".repeat(40)}.${"b".repeat(20)}`;
    expect(sanitizeClientMessage(`Bearer ${jwt} boom`)).toBe("Bearer [redacted] boom");
    expect(sanitizeClientMessage("x".repeat(400)).length).toBe(300);
  });

  it("error: refuse niveau, contexte ou message invalides", () => {
    expect(parseClientLogPayload({ level: "info", message: "x", context: "Keycloak" })).toBeNull();
    expect(parseClientLogPayload({ level: "error", message: "x", context: "ApiService" })).toBeNull();
    expect(parseClientLogPayload({ level: "error", message: "   ", context: "Keycloak" })).toBeNull();
    expect(sanitizeClientPath("https://evil.test/fr")).toBeUndefined();
    expect(messageFromUnknown(new Error("nope"))).toBe("nope");
  });
});
