/** @see FR-character-sheet-pdf-export */

const UNSAFE_FILENAME_CHARS = /[^a-zA-Z0-9-_]+/g;

export function sanitizeFilenamePart(value: string): string {
  return value.trim().replace(UNSAFE_FILENAME_CHARS, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function buildCharacterSheetPdfFilename(
  firstname: string,
  lastname: string,
  date: Date = new Date(),
): string {
  const namePart = [sanitizeFilenamePart(firstname), sanitizeFilenamePart(lastname)]
    .filter((part) => part.length > 0)
    .join("-");
  const base = namePart.length > 0 ? namePart : "character";
  const datePart = date.toISOString().slice(0, 10);
  return `chariot-${base}-${datePart}.pdf`;
}
