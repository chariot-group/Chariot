/** @see FR-character-sheet-pdf-export */

import type { PdfAbilityFeature } from "@/lib/characterSheetPdf/types";

/** Approximate chars per line in the page-1 narrative column (~23% of letter width). */
const FEATURES_COL_CHARS_PER_LINE = 42;
const FEATURE_TITLE_HEIGHT = 12;
const FEATURE_DESC_LINE_HEIGHT = 9.5;
const FEATURE_ITEM_MARGIN = 6;

/** Max vertical space for features on page 1 (below personality / ideals / bonds / flaws). */
export const PDF_FEATURES_PAGE1_MAX_HEIGHT = 175;

function estimateFeatureHeight(feature: PdfAbilityFeature): number {
  const description = feature.description.trim();
  const descriptionLines = description
    ? Math.max(1, Math.ceil(description.length / FEATURES_COL_CHARS_PER_LINE))
    : 0;
  return FEATURE_TITLE_HEIGHT + descriptionLines * FEATURE_DESC_LINE_HEIGHT + FEATURE_ITEM_MARGIN;
}

export interface SplitFeaturesForPdfPagesResult {
  pageOne: PdfAbilityFeature[];
  pageTwo: PdfAbilityFeature[];
}

export function splitFeaturesForPdfPages(
  features: PdfAbilityFeature[],
  firstPageMaxHeight: number = PDF_FEATURES_PAGE1_MAX_HEIGHT,
): SplitFeaturesForPdfPagesResult {
  if (features.length === 0) {
    return { pageOne: [], pageTwo: [] };
  }

  let usedHeight = 0;
  let splitIndex = features.length;

  for (let index = 0; index < features.length; index += 1) {
    const itemHeight = estimateFeatureHeight(features[index]);
    if (usedHeight + itemHeight > firstPageMaxHeight && index > 0) {
      splitIndex = index;
      break;
    }
    usedHeight += itemHeight;
  }

  return {
    pageOne: features.slice(0, splitIndex),
    pageTwo: features.slice(splitIndex),
  };
}
