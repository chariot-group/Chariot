import assert from "node:assert/strict";
import { describe, it } from "node:test";

const OIDC_CALLBACK_PARAMS = ["code", "state", "session_state", "iss"];

function buildUrlWithoutOidcCallbackParams(href) {
  const url = new URL(href);
  const stripped = OIDC_CALLBACK_PARAMS.some((param) => url.searchParams.has(param));
  if (!stripped) {
    return { url: href, stripped: false };
  }

  OIDC_CALLBACK_PARAMS.forEach((param) => url.searchParams.delete(param));

  const search = url.searchParams.toString();
  const cleanUrl = url.pathname + (search ? `?${search}` : "") + url.hash;

  return { url: cleanUrl, stripped: true };
}

describe("stripOidcCallbackParams", () => {
  it("strips OIDC callback params after Keycloak redirect", () => {
    const result = buildUrlWithoutOidcCallbackParams(
      "http://localhost:3001/?code=abc&state=xyz&session_state=123",
    );

    assert.equal(result.stripped, true);
    assert.equal(result.url, "/");
  });

  it("preserves unrelated query params", () => {
    const result = buildUrlWithoutOidcCallbackParams("http://localhost:3001/payments?state=xyz&page=2");

    assert.equal(result.stripped, true);
    assert.equal(result.url, "/payments?page=2");
  });

  it("returns unchanged URL when no OIDC params are present", () => {
    const href = "http://localhost:3001/referrals";
    const result = buildUrlWithoutOidcCallbackParams(href);

    assert.equal(result.stripped, false);
    assert.equal(result.url, href);
  });
});
