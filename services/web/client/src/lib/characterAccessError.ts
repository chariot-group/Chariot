import axios from "axios";

/**
 * True when the API denies access or the resource is missing (do not retry / do not post-login there).
 */
export function isCharacterAccessDeniedError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 403 || status === 404;
}

/**
 * FR-session-combat-navigation — after a 403/404 without session context, allow one retry
 * when `sessionCode` appears (URL hydration / Redux fallback).
 */
export function shouldClearCharacterAccessDeniedOnSessionCodeChange(
  previousSessionCode: string | null | undefined,
  nextSessionCode: string | null | undefined,
): boolean {
  const prev = previousSessionCode?.trim() ?? "";
  const next = nextSessionCode?.trim() ?? "";
  return !prev && Boolean(next);
}

/**
 * FR-user-cache-isolation — leave the sheet route only on definitive access denial,
 * not on transient API/network failures (e.g. session validate 503).
 */
export function shouldRedirectAwayFromCharacterSheet(accessDenied: boolean): boolean {
  return accessDenied;
}
