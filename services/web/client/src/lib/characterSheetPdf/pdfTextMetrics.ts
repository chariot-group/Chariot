/**
 * Helvetica text metrics for layout estimates: react-pdf only measures text at render time, so
 * page splits made beforehand (features continuation) measure words with the standard Helvetica
 * glyph widths (PDF core font AFM, 1/1000 em) and wrap them like the renderer does.
 * @see FR-character-sheet-pdf-export
 */

/** Average glyph width (em) for quick character budgets, rounded up so they err on the long side. */
export const PDF_HELVETICA_AVG_CHAR_EM = 0.5;

export type PdfFontWeight = "normal" | "bold";

/** Widths of the printable ASCII range, from space (32) to tilde (126). */
const HELVETICA_ASCII_WIDTHS: Record<PdfFontWeight, readonly number[]> = {
  normal: [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667,
    556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556,
    556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722,
    500, 500, 500, 334, 260, 334, 584,
  ],
  bold: [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722,
    611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556,
    611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778,
    556, 556, 500, 389, 280, 389, 584,
  ],
};

/** Common non-ASCII glyphs of French / Spanish text that have no plain base letter. */
const HELVETICA_EXTRA_WIDTHS: Record<PdfFontWeight, Readonly<Record<string, number>>> = {
  normal: { "’": 222, "‘": 222, "“": 333, "”": 333, "«": 556, "»": 556, "…": 1000, "–": 556, "—": 1000, "œ": 944, "Œ": 1000, "ß": 611, "¡": 333, "¿": 611 },
  bold: { "’": 278, "‘": 278, "“": 500, "”": 500, "«": 556, "»": 556, "…": 1000, "–": 556, "—": 1000, "œ": 944, "Œ": 1000, "ß": 611, "¡": 333, "¿": 611 },
};

/** Width used for any other glyph (a lowercase letter's width). */
const HELVETICA_FALLBACK_WIDTH: Record<PdfFontWeight, number> = { normal: 556, bold: 611 };

function glyphWidth(char: string, weight: PdfFontWeight): number {
  const extra = HELVETICA_EXTRA_WIDTHS[weight][char];
  if (extra !== undefined) return extra;
  // Accented letters take the width of their base letter (é → e, Ñ → N).
  const base = char.normalize("NFD").charCodeAt(0);
  const ascii = HELVETICA_ASCII_WIDTHS[weight][base - 32];
  return ascii ?? HELVETICA_FALLBACK_WIDTH[weight];
}

/** Width of `text` in points, set in Helvetica (or Helvetica-Bold) at `fontSize`. */
export function measureTextWidth(text: string, fontSize: number, weight: PdfFontWeight = "normal"): number {
  let units = 0;
  for (const char of text) units += glyphWidth(char, weight);
  return (units * fontSize) / 1000;
}

/**
 * Lines taken by `text` wrapped at `width` points: greedy word wrap per paragraph (the renderer
 * breaks lines at spaces, hyphenation is off), a word wider than the line is broken over several
 * lines. Empty text takes no line.
 */
export function estimateTextLineCount(
  text: string,
  fontSize: number,
  width: number,
  weight: PdfFontWeight = "normal",
): number {
  if (!text.trim() || width <= 0) return 0;
  const spaceWidth = measureTextWidth(" ", fontSize, weight);

  return text.split("\n").reduce((total, paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) return total + 1;

    let lines = 1;
    let lineWidth = 0;
    for (const word of words) {
      const wordWidth = measureTextWidth(word, fontSize, weight);
      const needed = lineWidth === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
      if (needed <= width) {
        lineWidth = needed;
        continue;
      }
      if (lineWidth > 0) lines += 1;
      lines += Math.max(0, Math.ceil(wordWidth / width) - 1);
      lineWidth = wordWidth % width || width;
    }
    return total + lines;
  }, 0);
}
