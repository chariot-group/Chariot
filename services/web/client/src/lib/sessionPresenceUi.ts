/** @see FR-session-lobby-navigation */

export const SESSION_TIMER_WARNING_THRESHOLD_SECONDS = 30 * 60;
export const SESSION_TIMER_LOW_THRESHOLD_SECONDS = 5 * 60;

export type HeaderLogoClickIntent = "openSessionLobby" | "goHome";
export type SessionLiveTone = "live" | "warning" | "critical";

export function resolveHeaderLogoClickIntent(isInSession: boolean): HeaderLogoClickIntent {
  return isInSession ? "openSessionLobby" : "goHome";
}

export function shouldShowSessionTimer(
  status: string | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  return status === "launched" && Boolean(expiresAt);
}

export function computeSessionRemainingSeconds(expiresAt: string, nowMs: number): number {
  return Math.floor((new Date(expiresAt).getTime() - nowMs) / 1000);
}

export function resolveSessionLiveTone(remainingSeconds: number | null): SessionLiveTone {
  if (remainingSeconds === null) return "live";
  if (remainingSeconds <= SESSION_TIMER_LOW_THRESHOLD_SECONDS) return "critical";
  if (remainingSeconds <= SESSION_TIMER_WARNING_THRESHOLD_SECONDS) return "warning";
  return "live";
}

export function isSessionTimerLow(remainingSeconds: number): boolean {
  return resolveSessionLiveTone(remainingSeconds) === "critical";
}

export function shouldNotifySessionTimeWarning(input: {
  previousRemainingSeconds: number | null;
  currentRemainingSeconds: number | null;
}): boolean {
  const { previousRemainingSeconds, currentRemainingSeconds } = input;
  if (previousRemainingSeconds === null || currentRemainingSeconds === null) {
    return false;
  }
  return (
    previousRemainingSeconds > SESSION_TIMER_WARNING_THRESHOLD_SECONDS &&
    currentRemainingSeconds <= SESSION_TIMER_WARNING_THRESHOLD_SECONDS
  );
}

export function formatSessionRemainingDuration(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}
