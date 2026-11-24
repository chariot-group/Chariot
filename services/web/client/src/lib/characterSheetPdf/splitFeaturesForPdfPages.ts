/** @see FR-character-sheet-pdf-export */

import {
  PDF_CARD,
  PDF_CARD_GAP,
  PDF_FEATURE_ITEM,
  PDF_PAGE_CONTENT_HEIGHT,
  PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH,
  PDF_SECTION_GAP,
  PDF_TEXT_BLOCK,
} from "@/lib/characterSheetPdf/pdfPageGeometry";
import { estimateTextLineCount } from "@/lib/characterSheetPdf/pdfTextMetrics";
import type { PdfAbilityFeature } from "@/lib/characterSheetPdf/types";

/** Text width inside a card of the page 1 narrative column. */
const PDF_NARRATIVE_CARD_INNER_WIDTH = PDF_PAGE_ONE_NARRATIVE_COLUMN_WIDTH - 2 * PDF_CARD.paddingHorizontal;
/** Kept free at the bottom of page 1 so a slightly low estimate never pushes a feature off the page. */
const PDF_FEATURES_PAGE1_SAFETY = 6;

export interface PdfNarrativeCard {
  title: string;
  /** Text as rendered (already clamped). */
  text: string;
}

function estimateCardTitleHeight(title: string): number {
  const lines = Math.max(
    1,
    estimateTextLineCount(title, PDF_CARD.titleFontSize, PDF_NARRATIVE_CARD_INNER_WIDTH, "bold"),
  );
  return lines * PDF_CARD.titleFontSize * PDF_CARD.titleLineHeight + PDF_CARD.titleMarginBottom;
}

/** Height of a text card of the page 1 narrative column (an empty text still takes one line). */
export function estimateNarrativeCardHeight(card: PdfNarrativeCard): number {
  const textLines = Math.max(
    1,
    estimateTextLineCount(card.text, PDF_TEXT_BLOCK.fontSize, PDF_NARRATIVE_CARD_INNER_WIDTH),
  );
  return (
    2 * PDF_CARD.paddingVertical +
    estimateCardTitleHeight(card.title) +
    textLines * PDF_TEXT_BLOCK.fontSize * PDF_TEXT_BLOCK.lineHeight
  );
}

export interface PageOneFeaturesSpaceInput {
  /** Height of the page 1 header card. */
  headerHeight: number;
  /** Cards stacked above the features card in the narrative column. */
  narrativeCards: PdfNarrativeCard[];
  featuresTitle: string;
}

/**
 * Height left for the features list at the bottom of the page 1 narrative column: the page content
 * minus the header, the narrative cards above and the features card's own padding and title.
 */
export function getPageOneFeaturesMaxHeight({
  headerHeight,
  narrativeCards,
  featuresTitle,
}: PageOneFeaturesSpaceInput): number {
  const cardsAbove = narrativeCards.reduce((sum, card) => sum + estimateNarrativeCardHeight(card) + PDF_CARD_GAP, 0);
  const featuresCardChrome = 2 * PDF_CARD.paddingVertical + estimateCardTitleHeight(featuresTitle);
  return Math.max(
    0,
    PDF_PAGE_CONTENT_HEIGHT -
      headerHeight -
      PDF_SECTION_GAP -
      cardsAbove -
      featuresCardChrome -
      PDF_FEATURES_PAGE1_SAFETY,
  );
}

export function estimateFeatureHeight(feature: PdfAbilityFeature): number {
  const f = PDF_FEATURE_ITEM;
  const nameLines = Math.max(
    1,
    estimateTextLineCount(feature.name.trim(), f.nameFontSize, PDF_NARRATIVE_CARD_INNER_WIDTH, "bold"),
  );
  const descriptionLines = estimateTextLineCount(
    feature.description.trim(),
    f.descriptionFontSize,
    PDF_NARRATIVE_CARD_INNER_WIDTH,
  );
  return (
    nameLines * f.nameFontSize * f.nameLineHeight +
    f.nameMarginBottom +
    descriptionLines * f.descriptionFontSize * f.descriptionLineHeight +
    f.marginBottom
  );
}

export interface SplitFeaturesForPdfPagesResult {
  pageOne: PdfAbilityFeature[];
  pageTwo: PdfAbilityFeature[];
}

/**
 * Keeps on page 1 every feature that fits in `firstPageMaxHeight` (in order; the first one always
 * stays) and moves the rest to the continuation page.
 */
export function splitFeaturesForPdfPages(
  features: PdfAbilityFeature[],
  firstPageMaxHeight: number,
): SplitFeaturesForPdfPagesResult {
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
