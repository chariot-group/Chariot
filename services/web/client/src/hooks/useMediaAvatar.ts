"use client";

import * as React from "react";
import {
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
  const cacheKey = mediaAvatarCacheKey(scope, entityId, variant);
  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    if (!enabled || !entityId || !storedValue?.trim()) {
      setResolvedUrl(null);
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
  }, [scope, entityId, storedValue, variant, sessionCode, enabled, cacheKey]);

  return { url: resolvedUrl, isLoading, variant };
}

type BatchItem = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
  size?: MediaAvatarSize;
};

export function useMediaAvatarBatch(
  items: BatchItem[],
  sessionCode?: string | null,
  enabled = true,
) {
  const [urlsByKey, setUrlsByKey] = React.useState<Record<string, string | null>>({});

  const stableKey = React.useMemo(
    () =>
      items
        .map((item) => {
          const variant = pickAvatarVariant(item.size ?? "thumb");
          return `${item.scope}:${item.entityId}:${variant}:${item.storedValue ?? ""}`;
        })
        .join("\u001f"),
    [items],
  );

  React.useEffect(() => {
    if (!enabled || items.length === 0) {
      setUrlsByKey({});
      return;
    }

    let cancelled = false;

    const batchItems = items
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
        setUrlsByKey(next);
      })
      .catch(() => {
        if (!cancelled) {
          setUrlsByKey({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableKey, sessionCode, enabled, items.length, items]);

  const getUrl = React.useCallback(
    (scope: MediaAvatarScope, entityId: string, size: MediaAvatarSize = "thumb") => {
      const key = mediaAvatarCacheKey(scope, entityId, pickAvatarVariant(size));
      return urlsByKey[key] ?? null;
    },
    [urlsByKey],
  );

  return { getUrl, urlsByKey };
}
