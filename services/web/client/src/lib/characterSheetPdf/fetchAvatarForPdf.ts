/** @see FR-character-sheet-pdf-export */

import { convertImageToPdfDataUrl } from "@/lib/characterSheetPdf/convertImageToPdfDataUrl";
import { peekCachedMediaAvatarUrl, resolveMediaAvatarUrl } from "@/lib/mediaAvatarCache";

export async function fetchCharacterAvatarForPdf(
  characterId: string,
  avatarStoredValue: string | undefined | null,
  sessionCode?: string | null,
): Promise<string | null> {
  const trimmed = avatarStoredValue?.trim();
  if (!trimmed) return null;

  const cachedUrl = peekCachedMediaAvatarUrl("character", characterId, trimmed, "main");
  const resolved = cachedUrl
    ? { url: cachedUrl }
    : await resolveMediaAvatarUrl("character", characterId, trimmed, "main", sessionCode);

  if (!resolved.url) {
    return null;
  }

  return convertImageToPdfDataUrl(resolved.url);
}
