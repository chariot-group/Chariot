/** @see FR-character-sheet-pdf-export */

export function buildCharacterSheetPagePath(locale: string, characterId: string): string {
  const safeLocale = locale.trim() || "fr";
  const safeId = characterId.trim();
  return `/${safeLocale}/characters/${encodeURIComponent(safeId)}`;
}

export function buildCharacterSheetPageUrl(
  origin: string,
  locale: string,
  characterId: string,
): string {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  return `${normalizedOrigin}${buildCharacterSheetPagePath(locale, characterId)}`;
}
