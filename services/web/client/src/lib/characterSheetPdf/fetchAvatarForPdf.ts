/** @see FR-character-sheet-pdf-export */

import MediaService from "@/services/MediaService";

async function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
}

export async function fetchCharacterAvatarForPdf(
  characterId: string,
  avatarStoredValue: string | undefined | null,
  sessionCode?: string | null,
): Promise<string | null> {
  const trimmed = avatarStoredValue?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return fetchImageAsDataUrl(trimmed);
  }

  try {
    const cacheKey = MediaService.buildCacheKey("character", characterId, "sheet");
    const results = await MediaService.resolvePresignedReads(
      [{ scope: "character", id: characterId, variant: "sheet" }],
      sessionCode,
    );
    const presigned = results[cacheKey];
    if (presigned?.url) {
      return fetchImageAsDataUrl(presigned.url);
    }
  } catch {
    return null;
  }

  return null;
}
