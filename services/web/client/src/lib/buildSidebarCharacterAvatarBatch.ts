import type { MediaAvatarSize } from "@/utils/media.utils";

/** @see FR-sidebar-character-avatars */
export const SIDEBAR_CHARACTER_AVATAR_SIZE: MediaAvatarSize = "xs";

export type SidebarCharacterAvatarSource = {
  _id?: string | null;
  avatar?: string | null;
};

export type SidebarCharacterAvatarBatchItem = {
  scope: "character";
  entityId: string;
  storedValue: string;
  size: MediaAvatarSize;
};

/**
 * Deduplicated presigned batch entries for sidebar character rows (PJ and PNJ).
 */
export function buildSidebarCharacterAvatarBatchItems(
  characters: SidebarCharacterAvatarSource[],
): SidebarCharacterAvatarBatchItem[] {
  const seen = new Set<string>();
  const items: SidebarCharacterAvatarBatchItem[] = [];

  for (const character of characters) {
    const entityId = character._id?.trim();
    const storedValue = character.avatar?.trim();
    if (!entityId || !storedValue || seen.has(entityId)) {
      continue;
    }
    seen.add(entityId);
    items.push({
      scope: "character",
      entityId,
      storedValue,
      size: SIDEBAR_CHARACTER_AVATAR_SIZE,
    });
  }

  return items;
}

export function sidebarAvatarSourcesFromPlayerRows(
  rows: Array<
    | { type: "player"; character: SidebarCharacterAvatarSource; companions: SidebarCharacterAvatarSource[] }
    | { type: "npc"; character: SidebarCharacterAvatarSource }
  >,
): SidebarCharacterAvatarSource[] {
  const sources: SidebarCharacterAvatarSource[] = [];
  for (const row of rows) {
    sources.push(row.character);
    if (row.type === "player") {
      sources.push(...row.companions);
    }
  }
  return sources;
}

export function sidebarCharacterAvatarImageUrl(
  getUrl: (scope: "character", entityId: string, size?: MediaAvatarSize) => string | null,
  entityId: string,
  storedValue?: string | null,
): string | undefined {
  if (!storedValue?.trim()) {
    return undefined;
  }
  return getUrl("character", entityId, SIDEBAR_CHARACTER_AVATAR_SIZE) ?? undefined;
}
