import { describe, expect, it } from "vitest";
import { buildUrlWithoutOidcCallbackParams, isOidcCallbackUrl } from "@/lib/stripOidcCallbackParams";

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

describe("isOidcCallbackUrl (FR-web-first-load-performance)", () => {
  it("nominal: fragment and query callbacks with a code are detected", () => {
    expect(isOidcCallbackUrl("http://localhost:3000/fr#state=s1&session_state=x&iss=http%3A%2F%2Fkc&code=c1")).toBe(true);
    expect(isOidcCallbackUrl("http://localhost:3000/fr?state=s1&code=c1")).toBe(true);
  });

  it("edge: an error callback counts (keycloak-js handles it), a plain visit or a lone state does not", () => {
    expect(isOidcCallbackUrl("http://localhost:3000/fr#error=login_required&state=s1")).toBe(true);
    expect(isOidcCallbackUrl("http://localhost:3000/fr/characters/abc?tab=magic")).toBe(false);
    expect(isOidcCallbackUrl("http://localhost:3000/fr#state=s1")).toBe(false);
    expect(isOidcCallbackUrl("http://localhost:3000/fr?code=join-123")).toBe(false);
  });

  it("failure: a malformed URL is not a callback", () => {
    expect(isOidcCallbackUrl("not a url")).toBe(false);
  });
});
