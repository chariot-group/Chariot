"use client";

import * as React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaAvatar } from "@/hooks/useMediaAvatar";
import {
  MEDIA_AVATAR_ROUNDED_CLASS,
  MEDIA_AVATAR_SIZE_CLASS,
  type MediaAvatarScope,
  type MediaAvatarSize,
} from "@/utils/media.utils";

export type MediaAvatarProps = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
  size?: MediaAvatarSize;
  sessionCode?: string | null;
  alt: string;
  className?: string;
  /** Disable lazy loading for above-the-fold avatars (character sheet header). */
  priority?: boolean;
  enabled?: boolean;
  /** Local preview URL (deferred upload); bypasses presigned resolution. */
  overrideSrc?: string | null;
  /** Fill parent container instead of fixed thumb/sheet dimensions. */
  fillContainer?: boolean;
};

/**
 * Optimized avatar display: presigned URL cache, thumb variant for small sizes,
 * native img (not next/image) for expiring URLs, lazy loading by default.
 * @see FR-media-private-storage
 */
export function MediaAvatar({
  scope,
  entityId,
  storedValue,
  size = "thumb",
  sessionCode,
  alt,
  className,
  priority = false,
  enabled = true,
  overrideSrc,
  fillContainer = false,
}: MediaAvatarProps) {
  const resolvePresigned = enabled && !overrideSrc;
  const { url, isLoading } = useMediaAvatar({
    scope,
    entityId,
    storedValue,
    size,
    sessionCode,
    enabled: resolvePresigned,
  });

  const displayUrl = overrideSrc ?? url;
  const sizeClass = fillContainer ? "size-full min-h-0" : MEDIA_AVATAR_SIZE_CLASS[size];
  const roundedClass = MEDIA_AVATAR_ROUNDED_CLASS[size];
  const hasImage = Boolean(displayUrl);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray flex items-center justify-center",
        fillContainer ? "min-h-0" : "shrink-0",
        sizeClass,
        roundedClass,
        className,
      )}
      role={hasImage ? undefined : "img"}
      aria-label={hasImage ? undefined : alt}>
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned URLs expire; next/image cache incompatible
        <img
          src={displayUrl!}
          alt={alt}
          width={size === "xs" ? 24 : size === "thumb" ? 40 : undefined}
          height={size === "xs" ? 24 : size === "thumb" ? 40 : undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          className={cn("size-full object-cover object-center", roundedClass)}
        />
      ) : (
        <>
          <User
            className={cn(
              "text-white/40",
              size === "xs" ? "size-3" : size === "thumb" ? "size-4" : "size-8 sm:size-10",
            )}
            aria-hidden="true"
          />
          {isLoading ? (
            <span className="sr-only">{alt}</span>
          ) : null}
        </>
      )}
    </div>
  );
}
