const SEEN_KEY_PREFIX = 'chariot_release_notes_seen';
const MUTED_KEY_PREFIX = 'chariot_release_notes_muted';

function getSeenKey(userId: string | null): string {
  return userId ? `${SEEN_KEY_PREFIX}_${userId}` : SEEN_KEY_PREFIX;
}

function getMutedKey(userId: string | null): string {
  return userId ? `${MUTED_KEY_PREFIX}_${userId}` : MUTED_KEY_PREFIX;
}

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('chariot_user_id');
  } catch {
    return null;
  }
}

export function getLastSeenVersion(userId: string | null): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(getSeenKey(userId));
  } catch {
    return null;
  }
}

export function setLastSeenVersion(userId: string | null, version: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getSeenKey(userId), version);
  } catch {
    // localStorage unavailable (private mode, quota exceeded, etc.)
  }
}

export function isReleaseNotesMuted(userId: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(getMutedKey(userId)) === 'true';
  } catch {
    return false;
  }
}

export function setReleaseNotesMuted(userId: string | null, muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (muted) {
      localStorage.setItem(getMutedKey(userId), 'true');
    } else {
      localStorage.removeItem(getMutedKey(userId));
    }
  } catch {
    // localStorage unavailable
  }
}
