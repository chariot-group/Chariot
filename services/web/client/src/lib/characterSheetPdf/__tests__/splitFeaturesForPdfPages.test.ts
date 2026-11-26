/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  estimateFeatureHeight,
  estimateNarrativeCardHeight,
  getPageOneFeaturesMaxHeight,
  splitFeaturesForPdfPages,
} from "@/lib/characterSheetPdf/splitFeaturesForPdfPages";
import { PDF_PAGE_CONTENT_HEIGHT } from "@/lib/characterSheetPdf/pdfPageGeometry";
import type { PdfAbilityFeature } from "@/lib/characterSheetPdf/types";

function feature(name: string, description: string): PdfAbilityFeature {
  return { name, description };
}

const shortCards = [
  { title: "Personality traits", text: "Curious." },
  { title: "Ideals", text: "Knowledge." },
  { title: "Bonds", text: "My spellbook." },
  { title: "Flaws", text: "Reckless." },
];
const longCards = shortCards.map((card) => ({ ...card, text: "Lorem ipsum dolor sit amet ".repeat(7).trim() }));
const pageOneSpace = (cards = shortCards) =>
  getPageOneFeaturesMaxHeight({ headerHeight: 60, narrativeCards: cards, featuresTitle: "Features & traits" });

describe("FR-character-sheet-pdf-export — splitFeaturesForPdfPages", () => {
  it("nominal: features that fit the free space of the narrative column all stay on page one", () => {
    // Eight medium features: more than the former fixed 175 pt budget, still within the free space.
    const features = Array.from({ length: 8 }, (_, index) =>
      feature(`Feature ${index}`, "Once per short rest, regain one expended spell slot."),
    );
    const total = features.reduce((sum, item) => sum + estimateFeatureHeight(item), 0);
    expect(total).toBeGreaterThan(175);
    expect(total).toBeLessThan(pageOneSpace());

    const result = splitFeaturesForPdfPages(features, pageOneSpace());
    expect(result.pageOne).toHaveLength(8);
    expect(result.pageTwo).toHaveLength(0);
  });

  it("edge: overflow features move to page two in order", () => {
    const longDescription = "Lorem ipsum ".repeat(60);
    const features = Array.from({ length: 6 }, (_, index) => feature(`Feature ${index}`, longDescription));

    const result = splitFeaturesForPdfPages(features, pageOneSpace());
    expect(result.pageOne.length).toBeGreaterThan(0);
    expect(result.pageTwo.length).toBeGreaterThan(0);
    expect([...result.pageOne, ...result.pageTwo]).toEqual(features);
  });

  it("edge: the first feature always stays on page one, even when taller than the space", () => {
    const result = splitFeaturesForPdfPages([feature("Huge", "x ".repeat(2000)), feature("Next", "")], 10);
    expect(result.pageOne.map((item) => item.name)).toEqual(["Huge"]);
    expect(result.pageTwo.map((item) => item.name)).toEqual(["Next"]);
  });

  it("guard: no features gives two empty lists", () => {
    expect(splitFeaturesForPdfPages([], pageOneSpace())).toEqual({ pageOne: [], pageTwo: [] });
  });
});

describe("FR-character-sheet-pdf-export — page one features space", () => {
  it("nominal: short narrative texts leave more room for features than long ones", () => {
    expect(estimateNarrativeCardHeight(longCards[0]!)).toBeGreaterThan(estimateNarrativeCardHeight(shortCards[0]!));
    expect(pageOneSpace(shortCards)).toBeGreaterThan(pageOneSpace(longCards));
    expect(pageOneSpace(shortCards)).toBeLessThan(PDF_PAGE_CONTENT_HEIGHT);
  });

  it("edge: a taller header (multiclass) leaves less room", () => {
    const base = pageOneSpace();
    const tall = getPageOneFeaturesMaxHeight({
      headerHeight: 80,
      narrativeCards: shortCards,
      featuresTitle: "Features & traits",
    });
    expect(base - tall).toBeCloseTo(20);
  });

  it("guard: the space never goes negative", () => {
    const huge = shortCards.map((card) => ({ ...card, text: "word ".repeat(2000) }));
    expect(pageOneSpace(huge)).toBe(0);
  });
});
