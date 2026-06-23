export type MediaAvatarScope = "character" | "user";
export type MediaAvatarVariant = "main" | "thumb";

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

export function isExternalMediaUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && EXTERNAL_URL_PATTERN.test(value.trim());
}

export function hasMediaAvatar(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function mediaAvatarCacheKey(
  scope: MediaAvatarScope,
  entityId: string,
  variant: MediaAvatarVariant,
): string {
  return `${scope}:${entityId}:${variant}`;
}

export type MediaAvatarSize = "sheet" | "profile" | "thumb" | "xs";

export const MEDIA_AVATAR_SIZE_CLASS: Record<MediaAvatarSize, string> = {
  sheet: "h-16 w-20 sm:h-20 sm:w-24 md:h-24 md:w-28",
  profile: "h-full w-full min-h-[120px]",
  thumb: "h-9 w-9 sm:h-10 sm:w-10",
  xs: "h-6 w-6",
};

export const MEDIA_AVATAR_ROUNDED_CLASS: Record<MediaAvatarSize, string> = {
  sheet: "rounded-[18px]",
  profile: "rounded-[15px]",
  thumb: "rounded-full",
  xs: "rounded-full",
};

/** Refresh presigned URLs 2 minutes before expiry. */
export const MEDIA_PRESIGNED_REFRESH_BUFFER_MS = 2 * 60 * 1000;

export function shouldRefreshPresignedUrl(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }
  const expiryMs = Date.parse(expiresAt);
  if (Number.isNaN(expiryMs)) {
    return true;
  }
  return expiryMs - Date.now() <= MEDIA_PRESIGNED_REFRESH_BUFFER_MS;
}

export function pickAvatarVariant(size: MediaAvatarSize): MediaAvatarVariant {
  return size === "thumb" || size === "xs" ? "thumb" : "main";
}
