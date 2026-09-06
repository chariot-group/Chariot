/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import {
  PDF_FEATURES_PAGE1_MAX_HEIGHT,
  splitFeaturesForPdfPages,
} from "@/lib/characterSheetPdf/splitFeaturesForPdfPages";
import type { PdfAbilityFeature } from "@/lib/characterSheetPdf/types";

function feature(name: string, description: string): PdfAbilityFeature {
  return { name, description };
}

describe("splitFeaturesForPdfPages", () => {
  it("keeps all features on page one when they fit the height budget", () => {
    const features = [
      feature("A", "Short"),
      feature("B", "Also short"),
    ];

    const result = splitFeaturesForPdfPages(features, PDF_FEATURES_PAGE1_MAX_HEIGHT);
    expect(result.pageOne).toHaveLength(2);
    expect(result.pageTwo).toHaveLength(0);
  });

  it("moves overflow features to page two based on estimated height", () => {
    const longDescription = "Lorem ipsum ".repeat(40);
    const features = [
      feature("One", longDescription),
      feature("Two", longDescription),
      feature("Three", longDescription),
      feature("Four", longDescription),
      feature("Five", "Tail"),
    ];

    const result = splitFeaturesForPdfPages(features, PDF_FEATURES_PAGE1_MAX_HEIGHT);
    expect(result.pageOne.length).toBeGreaterThan(0);
    expect(result.pageOne.length).toBeLessThan(features.length);
    expect(result.pageTwo.length).toBeGreaterThan(0);
    expect(result.pageOne.length + result.pageTwo.length).toBe(features.length);
    expect(result.pageTwo[0]?.name).toBe(features[result.pageOne.length]?.name);
  });

  it("returns empty lists when no features are provided", () => {
    expect(splitFeaturesForPdfPages([])).toEqual({ pageOne: [], pageTwo: [] });
  });
});
