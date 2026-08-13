/**
 * One-shot post-login redirect guard (FR-post-auth-navigation, FR-user-cache-isolation).
 * Survives React remounts so /locale ↔ character loops cannot re-trigger navigation.
 */

const POST_LOGIN_HANDLED_KEY_PREFIX = "chariot_post_login_handled:";
const POST_LOGIN_HANDLED_ANON = "chariot_post_login_handled:anon";

function storageKey(userId: string): string {
  return `${POST_LOGIN_HANDLED_KEY_PREFIX}${userId}`;
}

export function getPostLoginUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chariot_user_id");
}

export function hasCompletedPostLogin(userId: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  if (userId) {
    return sessionStorage.getItem(storageKey(userId)) === "1";
  }
  // Fallback when chariot_user_id is not yet written — still block re-entry.
  return sessionStorage.getItem(POST_LOGIN_HANDLED_ANON) === "1";
}

export function markPostLoginCompleted(userId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (userId) {
    sessionStorage.setItem(storageKey(userId), "1");
    sessionStorage.removeItem(POST_LOGIN_HANDLED_ANON);
    return;
  }
  sessionStorage.setItem(POST_LOGIN_HANDLED_ANON, "1");
}

export function clearPostLoginCompleted(userId?: string | null): void {
  if (typeof window === "undefined") return;
  if (userId) {
    sessionStorage.removeItem(storageKey(userId));
    sessionStorage.removeItem(POST_LOGIN_HANDLED_ANON);
    return;
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(POST_LOGIN_HANDLED_KEY_PREFIX) || key === POST_LOGIN_HANDLED_ANON) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Whether the current path is eligible for the automatic post-auth redirect.
 * Pure helper for unit tests and PostLoginNavigator.
 */
export function shouldRedirectAfterLogin(currentPath: string): boolean {
  if (
    currentPath.includes("/characters/") ||
    currentPath.includes("/campaigns/") ||
    currentPath.includes("/welcome")
  ) {
    return false;
  }
  return currentPath === "/" || !!currentPath.match(/^\/[a-z]{2}$/) || currentPath.includes("/auth/");
}

/**
 * Combined gate: path eligible AND this user has not already completed post-login this tab session.
 */
export function shouldAttemptPostLoginRedirect(
  currentPath: string,
  userId: string | null | undefined,
): boolean {
  if (!shouldRedirectAfterLogin(currentPath)) return false;
  if (hasCompletedPostLogin(userId)) return false;
  return true;
}
