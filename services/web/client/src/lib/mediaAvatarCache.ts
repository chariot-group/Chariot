import MediaService from "@/services/MediaService";
import {
  isExternalMediaUrl,
  mediaAvatarCacheKey,
  shouldRefreshPresignedUrl,
  type MediaAvatarScope,
  type MediaAvatarVariant,
} from "@/utils/media.utils";

type CachedAvatarUrl = {
  url: string | null;
  expiresAt: string | null;
  source: "external" | "presigned" | "missing";
};

const urlCache = new Map<string, CachedAvatarUrl>();
const inflight = new Map<string, Promise<CachedAvatarUrl>>();

type CoalescedRequest = {
  scope: MediaAvatarScope;
  entityId: string;
  variant: MediaAvatarVariant;
  sessionCode?: string | null;
  key: string;
  resolve: (value: CachedAvatarUrl) => void;
  reject: (reason: unknown) => void;
};

let coalesceQueue: CoalescedRequest[] = [];
let coalesceScheduled = false;

function cacheKey(
  scope: MediaAvatarScope,
  entityId: string,
  variant: MediaAvatarVariant,
): string {
  return mediaAvatarCacheKey(scope, entityId, variant);
}

function getCached(key: string): CachedAvatarUrl | null {
  const entry = urlCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.source === "presigned" && shouldRefreshPresignedUrl(entry.expiresAt)) {
    urlCache.delete(key);
    return null;
  }
  return entry;
}

function scheduleCoalescedFlush(): void {
  if (coalesceScheduled) {
    return;
  }
  coalesceScheduled = true;
  queueMicrotask(() => {
    coalesceScheduled = false;
    void flushCoalescedQueue();
  });
}

async function flushCoalescedQueue(): Promise<void> {
  const batch = coalesceQueue;
  coalesceQueue = [];
  if (batch.length === 0) {
    return;
  }

  const groups = new Map<string, CoalescedRequest[]>();
  for (const req of batch) {
    const sessionKey = req.sessionCode?.trim() ?? "";
    const group = groups.get(sessionKey);
    if (group) {
      group.push(req);
    } else {
      groups.set(sessionKey, [req]);
    }
  }

  for (const [sessionKey, requests] of groups) {
    const sessionCode = sessionKey || undefined;
    const keyToWaiters = new Map<string, CoalescedRequest[]>();
    const uniqueRequests: Array<{ scope: MediaAvatarScope; id: string; variant: MediaAvatarVariant }> = [];

    for (const req of requests) {
      const waiters = keyToWaiters.get(req.key);
      if (waiters) {
        waiters.push(req);
        continue;
      }
      keyToWaiters.set(req.key, [req]);
      uniqueRequests.push({ scope: req.scope, id: req.entityId, variant: req.variant });
    }

    try {
      const data = await MediaService.resolvePresignedReads(uniqueRequests, sessionCode);
      for (const [key, waiters] of keyToWaiters) {
        const result = data[key] ?? { url: null, expiresAt: null, source: "missing" as const };
        urlCache.set(key, result);
        for (const waiter of waiters) {
          waiter.resolve(result);
        }
      }
    } catch (error) {
      for (const waiters of keyToWaiters.values()) {
        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }
    }
  }
}

function enqueueCoalescedFetch(
  scope: MediaAvatarScope,
  entityId: string,
  variant: MediaAvatarVariant,
  sessionCode?: string | null,
): Promise<CachedAvatarUrl> {
  const key = cacheKey(scope, entityId, variant);

  const promise = new Promise<CachedAvatarUrl>((resolve, reject) => {
    coalesceQueue.push({
      scope,
      entityId,
      variant,
      sessionCode,
      key,
      resolve,
      reject,
    });
    scheduleCoalescedFlush();
  });

  inflight.set(key, promise);
  void promise.finally(() => {
    inflight.delete(key);
  });

  return promise;
}

async function fetchSingle(
  scope: MediaAvatarScope,
  entityId: string,
  variant: MediaAvatarVariant,
  sessionCode?: string | null,
): Promise<CachedAvatarUrl> {
  const key = cacheKey(scope, entityId, variant);
  const existing = getCached(key);
  if (existing) {
    return existing;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  return enqueueCoalescedFetch(scope, entityId, variant, sessionCode);
}

export function hasResolvedMediaAvatarCache(
  scope: MediaAvatarScope,
  entityId: string,
  storedValue: string | null | undefined,
  variant: MediaAvatarVariant,
): boolean {
  if (!entityId || !storedValue?.trim()) {
    return true;
  }
  if (isExternalMediaUrl(storedValue)) {
    return true;
  }
  return getCached(cacheKey(scope, entityId, variant)) !== null;
}

/**
 * Synchronous read from the in-memory presigned URL cache (no network).
 * Use to hydrate avatars before async resolution completes.
 */
export function peekCachedMediaAvatarUrl(
  scope: MediaAvatarScope,
  entityId: string,
  storedValue: string | null | undefined,
  variant: MediaAvatarVariant,
): string | null {
  if (!entityId || !storedValue?.trim()) {
    return null;
  }

  if (isExternalMediaUrl(storedValue)) {
    return storedValue.trim();
  }

  return getCached(cacheKey(scope, entityId, variant))?.url ?? null;
}

export async function resolveMediaAvatarUrl(
  scope: MediaAvatarScope,
  entityId: string,
  storedValue: string | null | undefined,
  variant: MediaAvatarVariant,
  sessionCode?: string | null,
): Promise<CachedAvatarUrl> {
  if (!storedValue?.trim()) {
    return { url: null, expiresAt: null, source: "missing" };
  }

  if (isExternalMediaUrl(storedValue)) {
    return { url: storedValue.trim(), expiresAt: null, source: "external" };
  }

  return fetchSingle(scope, entityId, variant, sessionCode);
}

export async function resolveMediaAvatarUrlsBatch(
  items: Array<{
    scope: MediaAvatarScope;
    entityId: string;
    storedValue: string | null | undefined;
    variant: MediaAvatarVariant;
  }>,
  sessionCode?: string | null,
): Promise<Map<string, CachedAvatarUrl>> {
  const results = new Map<string, CachedAvatarUrl>();
  const toFetch: Array<{ scope: MediaAvatarScope; id: string; variant: MediaAvatarVariant; key: string }> = [];

  for (const item of items) {
    const key = cacheKey(item.scope, item.entityId, item.variant);

    if (!item.storedValue?.trim()) {
      results.set(key, { url: null, expiresAt: null, source: "missing" });
      continue;
    }

    if (isExternalMediaUrl(item.storedValue)) {
      results.set(key, {
        url: item.storedValue.trim(),
        expiresAt: null,
        source: "external",
      });
      continue;
    }

    const cached = getCached(key);
    if (cached) {
      results.set(key, cached);
      continue;
    }

    toFetch.push({
      scope: item.scope,
      id: item.entityId,
      variant: item.variant,
      key,
    });
  }

  if (toFetch.length === 0) {
    return results;
  }

  const uniqueRequests = toFetch.map(({ scope, id, variant }) => ({ scope, id, variant }));
  const data = await MediaService.resolvePresignedReads(uniqueRequests, sessionCode);

  for (const item of toFetch) {
    const result = data[item.key] ?? { url: null, expiresAt: null, source: "missing" as const };
    urlCache.set(item.key, result);
    results.set(item.key, result);
  }

  return results;
}

export function invalidateMediaAvatarCache(
  scope: MediaAvatarScope,
  entityId: string,
): void {
  for (const variant of ["main", "thumb"] as const) {
    const key = cacheKey(scope, entityId, variant);
    urlCache.delete(key);
    inflight.delete(key);
  }
}

/** @internal — test helper */
export function clearMediaAvatarCacheForTests(): void {
  urlCache.clear();
  inflight.clear();
  coalesceQueue = [];
  coalesceScheduled = false;
}
