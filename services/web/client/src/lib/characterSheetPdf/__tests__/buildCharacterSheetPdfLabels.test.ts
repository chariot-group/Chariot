import { describe, expect, it, vi } from "vitest";
import { buildCharacterSheetPdfLabels } from "@/lib/characterSheetPdf/buildCharacterSheetPdfLabels";

const identityT =
  (prefix: string) =>
  (key: string, values?: Record<string, string | number>) =>
    values ? `${prefix}.${key}:${JSON.stringify(values)}` : `${prefix}.${key}`;

describe("buildCharacterSheetPdfLabels", () => {
  it("passes placeholder values for pageOf so next-intl does not throw at label build time", () => {
    const tPdf = vi.fn((key: string, values?: Record<string, string | number>) => {
      if (key === "pageOf" && values) {
        return `Page ${values.page} / ${values.total}`;
      }
      return key;
    });

    const labels = buildCharacterSheetPdfLabels({
      tPdf,
      tGeneral: identityT("general"),
      tBattle: identityT("battle"),
      tEdit: identityT("edit"),
      tNpc: identityT("npc"),
      tClass: identityT("class"),
      tAlignment: identityT("alignment"),
      tCommon: (key) => key,
      tMagic: identityT("magic"),
    });

    expect(tPdf).toHaveBeenCalledWith("pageOf", { page: "{page}", total: "{total}" });
    expect(labels.pageOf).toBe("Page {page} / {total}");
    expect(labels.pageOf.replace("{page}", "2").replace("{total}", "5")).toBe("Page 2 / 5");
  });
});
