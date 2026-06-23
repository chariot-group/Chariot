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

  const promise = MediaService.resolvePresignedReads(
    [{ scope, id: entityId, variant }],
    sessionCode,
  )
    .then((data) => {
      const result = data[key] ?? { url: null, expiresAt: null, source: "missing" as const };
      urlCache.set(key, result);
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
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
}
