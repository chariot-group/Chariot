/** @see FR-session-lobby-navigation */

export const SESSION_TIMER_LOW_THRESHOLD_SECONDS = 300;

export type HeaderLogoClickIntent = "openSessionLobby" | "goHome";

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

export function isSessionTimerLow(remainingSeconds: number): boolean {
  return remainingSeconds <= SESSION_TIMER_LOW_THRESHOLD_SECONDS;
}

export function formatSessionRemainingDuration(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}
