import { describe, expect, it } from "vitest";
import { getComboboxSuggestionsStyle } from "@/utils/combobox-suggestions.utils";

describe("getComboboxSuggestionsStyle", () => {
  it("nominal: positions the list below the input when space is available", () => {
    const style = getComboboxSuggestionsStyle(
      { top: 100, bottom: 140, left: 50, width: 200 },
      800,
    );

    expect(style).toMatchObject({
      position: "fixed",
      top: 144,
      bottom: "auto",
      left: 50,
      width: 200,
      maxHeight: 240,
    });
  });

  it("edge: opens above the input when there is not enough space below", () => {
    const style = getComboboxSuggestionsStyle(
      { top: 700, bottom: 740, left: 20, width: 160 },
      800,
    );

    expect(style).toMatchObject({
      position: "fixed",
      top: "auto",
      bottom: 104,
      left: 20,
      width: 160,
    });
    expect(style.maxHeight).toBeLessThanOrEqual(240);
    expect(style.maxHeight).toBeGreaterThan(0);
  });

  it("failure: clamps maxHeight to available space when near the viewport edge", () => {
    const style = getComboboxSuggestionsStyle(
      { top: 10, bottom: 50, left: 0, width: 100 },
      100,
      4,
      240,
    );

    expect(style.top).toBe(54);
    expect(style.maxHeight).toBe(46);
  });
});
