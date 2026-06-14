import CodexService from "@/services/CodexService";

export type CodexHealthSnapshot = {
  isAvailable: boolean;
  isChecking: boolean;
  lastCheckedAt: number | null;
};

/** Quand Codex répond, on ne revérifie pas avant ce délai (sauf nouvel abonné avec cache expiré). */
export const CODEX_HEALTH_CACHE_TTL_MS = 2 * 60 * 1000;
/** Intervalle entre deux checks tant que Codex est joignable. */
export const CODEX_HEALTH_INTERVAL_MS = 5 * 60 * 1000;
/** Intervalle plus court pour détecter un retour en ligne. */
export const CODEX_HEALTH_RETRY_INTERVAL_MS = 60 * 1000;

let snapshot: CodexHealthSnapshot = {
  isAvailable: true,
  isChecking: false,
  lastCheckedAt: null,
};

const listeners = new Set<() => void>();
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let subscriberCount = 0;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function isCacheFresh(now = Date.now()): boolean {
  return snapshot.lastCheckedAt != null && now - snapshot.lastCheckedAt < CODEX_HEALTH_CACHE_TTL_MS;
}

function clearScheduledCheck() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function scheduleNextCheck() {
  clearScheduledCheck();
  if (subscriberCount === 0) {
    return;
  }

  const interval = snapshot.isAvailable ? CODEX_HEALTH_INTERVAL_MS : CODEX_HEALTH_RETRY_INTERVAL_MS;
  timeoutId = setTimeout(() => {
    void runCodexHealthCheck();
  }, interval);
}

export function getCodexHealthSnapshot(): CodexHealthSnapshot {
  return snapshot;
}

export function subscribeToCodexHealth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function runCodexHealthCheck(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  snapshot = { ...snapshot, isChecking: true };
  emit();

  inFlight = (async () => {
    try {
      const available = await CodexService.checkHealth();
      snapshot = {
        isAvailable: available,
        isChecking: false,
        lastCheckedAt: Date.now(),
      };
    } catch {
      snapshot = {
        isAvailable: false,
        isChecking: false,
        lastCheckedAt: Date.now(),
      };
    } finally {
      inFlight = null;
      emit();
      scheduleNextCheck();
    }
  })();

  return inFlight;
}

export function acquireCodexHealthSubscription(): void {
  subscriberCount += 1;
  if (subscriberCount !== 1) {
    return;
  }

  if (!isCacheFresh() && !inFlight) {
    void runCodexHealthCheck();
    return;
  }

  scheduleNextCheck();
}

export function releaseCodexHealthSubscription(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0) {
    clearScheduledCheck();
  }
}

/** Utilisé par les tests pour réinitialiser l'état du singleton. */
export function resetCodexHealthStoreForTests(): void {
  clearScheduledCheck();
  subscriberCount = 0;
  inFlight = null;
  snapshot = {
    isAvailable: true,
    isChecking: false,
    lastCheckedAt: null,
  };
  listeners.clear();
}
