export const OIDC_CALLBACK_PARAMS = ["code", "state", "session_state", "iss"] as const;

export function buildUrlWithoutOidcCallbackParams(href: string): { url: string; stripped: boolean } {
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

/**
 * Removes leftover Keycloak OIDC callback query params from the browser URL.
 * Must run once after keycloak-js init() has processed the authorization code.
 */
export function stripOidcCallbackParams(): boolean {
  if (typeof window === "undefined") return false;

  const { url, stripped } = buildUrlWithoutOidcCallbackParams(window.location.href);
  if (!stripped) return false;

  window.history.replaceState(window.history.state, "", url);
  return true;
}

/**
 * True when the URL is a Keycloak authorization callback (fragment or query response mode):
 * the code exchange is about to run, so the authenticated shell can be fetched in parallel.
 * @see FR-web-first-load-performance (Slow-network authentication round trip)
 */
export function isOidcCallbackUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  return [new URLSearchParams(url.hash.replace(/^#/, "")), url.searchParams].some(
    (params) => params.has("state") && (params.has("code") || params.has("error")),
  );
}
