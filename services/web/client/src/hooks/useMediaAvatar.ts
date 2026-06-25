"use client";

import * as React from "react";
import {
  hasResolvedMediaAvatarCache,
  peekCachedMediaAvatarUrl,
  resolveMediaAvatarUrl,
  resolveMediaAvatarUrlsBatch,
} from "@/lib/mediaAvatarCache";
import {
  mediaAvatarCacheKey,
  pickAvatarVariant,
  type MediaAvatarScope,
  type MediaAvatarSize,
} from "@/utils/media.utils";

type UseMediaAvatarOptions = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
  size?: MediaAvatarSize;
  sessionCode?: string | null;
  /** Skip network when false (e.g. placeholder-only). Default true when storedValue present. */
  enabled?: boolean;
};

export function useMediaAvatar({
  scope,
  entityId,
  storedValue,
  size = "thumb",
  sessionCode,
  enabled = true,
}: UseMediaAvatarOptions) {
  const variant = pickAvatarVariant(size);

  const readSyncCache = React.useCallback((): string | null => {
    if (!enabled || !entityId || !storedValue?.trim()) {
      return null;
    }
    return peekCachedMediaAvatarUrl(scope, entityId, storedValue, variant);
  }, [enabled, entityId, storedValue, variant, scope]);

  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(() => readSyncCache());
  const [isLoading, setIsLoading] = React.useState(
    () => enabled && Boolean(entityId && storedValue?.trim()) && readSyncCache() === null,
  );

  React.useEffect(() => {
    let cancelled = false;

    if (!enabled || !entityId || !storedValue?.trim()) {
      setResolvedUrl(null);
      setIsLoading(false);
      return;
    }

    const cachedUrl = peekCachedMediaAvatarUrl(scope, entityId, storedValue, variant);
    if (cachedUrl) {
      setResolvedUrl((prev) => (prev === cachedUrl ? prev : cachedUrl));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    void resolveMediaAvatarUrl(scope, entityId, storedValue, variant, sessionCode)
      .then((result) => {
        if (!cancelled) {
          setResolvedUrl(result.url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope, entityId, storedValue, variant, sessionCode, enabled]);

  return { url: resolvedUrl, isLoading, variant };
}

type BatchItem = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
  size?: MediaAvatarSize;
};

function serializeBatchItems(items: BatchItem[]): string {
  return items
    .map((item) => {
      const itemVariant = pickAvatarVariant(item.size ?? "thumb");
      return `${item.scope}:${item.entityId}:${itemVariant}:${item.storedValue ?? ""}`;
    })
    .join("\u001f");
}

function shallowUrlsEqual(
  left: Record<string, string | null>,
  right: Record<string, string | null>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
}

export function useMediaAvatarBatch(
  items: BatchItem[],
  sessionCode?: string | null,
  enabled = true,
) {
  const stableKey = serializeBatchItems(items);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  const [urlsByKey, setUrlsByKey] = React.useState<Record<string, string | null>>(() => {
    if (!enabled || items.length === 0) {
      return {};
    }
    const initial: Record<string, string | null> = {};
    for (const item of items) {
      if (!item.entityId || !item.storedValue?.trim()) {
        continue;
      }
      const itemVariant = pickAvatarVariant(item.size ?? "thumb");
      const key = mediaAvatarCacheKey(item.scope, item.entityId, itemVariant);
      initial[key] = peekCachedMediaAvatarUrl(item.scope, item.entityId, item.storedValue, itemVariant);
    }
    return initial;
  });

  React.useEffect(() => {
    const currentItems = itemsRef.current;

    if (!enabled || currentItems.length === 0) {
      setUrlsByKey({});
      return;
    }

    let cancelled = false;

    const batchItems = currentItems
      .filter((item) => item.entityId && item.storedValue?.trim())
      .map((item) => ({
        scope: item.scope,
        entityId: item.entityId,
        storedValue: item.storedValue,
        variant: pickAvatarVariant(item.size ?? "thumb"),
      }));

    if (batchItems.length === 0) {
      setUrlsByKey({});
      return;
    }

    const syncFromCache = (): Record<string, string | null> => {
      const next: Record<string, string | null> = {};
      for (const item of batchItems) {
        const key = mediaAvatarCacheKey(item.scope, item.entityId, item.variant);
        next[key] = peekCachedMediaAvatarUrl(item.scope, item.entityId, item.storedValue, item.variant);
      }
      return next;
    };

    const cachedOnly = syncFromCache();
    const allResolved = batchItems.every((item) =>
      hasResolvedMediaAvatarCache(item.scope, item.entityId, item.storedValue, item.variant),
    );

    if (allResolved) {
      setUrlsByKey((prev) => (shallowUrlsEqual(prev, cachedOnly) ? prev : cachedOnly));
      return;
    }

    void resolveMediaAvatarUrlsBatch(batchItems, sessionCode)
      .then((map) => {
        if (cancelled) {
          return;
        }
        const next: Record<string, string | null> = {};
        for (const item of batchItems) {
          const key = mediaAvatarCacheKey(item.scope, item.entityId, item.variant);
          next[key] = map.get(key)?.url ?? null;
        }
        setUrlsByKey((prev) => (shallowUrlsEqual(prev, next) ? prev : next));
      })
      .catch(() => {
        if (!cancelled) {
          setUrlsByKey({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableKey, sessionCode, enabled]);

  const getUrl = React.useCallback(
    (scope: MediaAvatarScope, entityId: string, size: MediaAvatarSize = "thumb") => {
      const key = mediaAvatarCacheKey(scope, entityId, pickAvatarVariant(size));
      return urlsByKey[key] ?? null;
    },
    [urlsByKey],
  );

  return { getUrl, urlsByKey };
}
