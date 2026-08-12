/** @see FR-character-sheet-pdf-export */

/** Approximate char budget for proficiencies in the narrow left column on page 1. */
export const PDF_PROFICIENCIES_PAGE1_MAX_CHARS = 280;

/** Approximate char budget for equipment on page 1 before continuation on page 2. */
export const PDF_EQUIPMENT_PAGE1_MAX_CHARS = 220;

export interface SplitTextForPdfPagesResult {
  pageOne: string;
  pageTwo: string;
}

export function splitTextForPdfPages(
  text: string,
  pageOneMaxChars: number,
): SplitTextForPdfPagesResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length <= pageOneMaxChars) {
    return { pageOne: normalized, pageTwo: "" };
  }

  let cut = pageOneMaxChars;
  while (cut > 0 && normalized[cut] !== " ") {
    cut -= 1;
  }
  if (cut <= 0) {
    cut = pageOneMaxChars;
  }

  return {
    pageOne: normalized.slice(0, cut).trimEnd(),
    pageTwo: normalized.slice(cut).trimStart(),
  };
}
