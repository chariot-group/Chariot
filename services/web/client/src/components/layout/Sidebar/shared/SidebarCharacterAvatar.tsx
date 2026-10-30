"use client";

import { MediaAvatar } from "@/components/media/MediaAvatar";
import { SIDEBAR_CHARACTER_AVATAR_SIZE } from "@/lib/buildSidebarCharacterAvatarBatch";

type SidebarCharacterAvatarProps = {
  characterId: string;
  storedValue?: string | null;
  alt: string;
  sessionCode?: string | null;
  avatarImageUrl?: string | null;
  className?: string;
};

/**
 * Standard PJ/PNJ avatar in sidebar lists (Player and GM spaces).
 * @see FR-sidebar-character-avatars
 */
export function SidebarCharacterAvatar({
  characterId,
  storedValue,
  alt,
  sessionCode = null,
  avatarImageUrl,
  className,
}: SidebarCharacterAvatarProps) {
  const trimmed = storedValue?.trim() ?? "";

  return (
    <MediaAvatar
      scope="character"
      entityId={characterId}
      storedValue={storedValue}
      size={SIDEBAR_CHARACTER_AVATAR_SIZE}
      sessionCode={sessionCode}
      alt={alt}
      enabled={Boolean(trimmed)}
      avatarImageUrl={avatarImageUrl}
      className={className ?? "shrink-0"}
    />
  );
}
