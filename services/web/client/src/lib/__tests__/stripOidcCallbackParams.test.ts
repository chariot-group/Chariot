import { describe, expect, it } from "vitest";
import { buildUrlWithoutOidcCallbackParams } from "@/lib/stripOidcCallbackParams";

describe("stripOidcCallbackParams", () => {
  it("nominal: strips OIDC callback params after Keycloak redirect", () => {
    const result = buildUrlWithoutOidcCallbackParams(
      "http://localhost:3000/fr?code=abc&state=xyz&session_state=123&iss=http%3A%2F%2Fkeycloak",
    );

    expect(result.stripped).toBe(true);
    expect(result.url).toBe("/fr");
  });

  it("edge: preserves unrelated query params", () => {
    const result = buildUrlWithoutOidcCallbackParams(
      "http://localhost:3000/fr/checkout?state=xyz&packId=pro&ref=ABCD12",
    );

    expect(result.stripped).toBe(true);
    expect(result.url).toBe("/fr/checkout?packId=pro&ref=ABCD12");
  });

  it("edge: returns unchanged URL when no OIDC params are present", () => {
    const href = "http://localhost:3000/fr/welcome?payment=success";
    const result = buildUrlWithoutOidcCallbackParams(href);

    expect(result.stripped).toBe(false);
    expect(result.url).toBe(href);
  });
});
