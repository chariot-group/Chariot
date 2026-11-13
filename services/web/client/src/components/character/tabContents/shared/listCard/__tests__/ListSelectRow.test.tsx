import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ListSelectRow from "@/components/character/tabContents/shared/listCard/ListSelectRow";

const renderRow = (props: { isSelected: boolean; hasError?: boolean; trailing?: ReactNode }) =>
  renderToStaticMarkup(
    <ListSelectRow
      id="row"
      name="Assistance"
      meta={["1 action", "Contact"]}
      label="Assistance"
      onSelect={vi.fn()}
      {...props}
    />,
  );

/** First `class` attribute: the row wrapper. */
const rowClasses = (html: string) => html.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];

/** @see FR-character-magic-list-card (selectable rows under sticky group headers) */
describe("ListSelectRow", () => {
  it("nominal: the selected row is tinted with an inset ring and pressed", () => {
    const html = renderRow({ isSelected: true });

    expect(rowClasses(html)).toEqual(expect.arrayContaining(["bg-gray-middle-light", "ring-1", "ring-inset"]));
    expect(html).toContain('aria-pressed="true"');
  });

  it("edge: an unselected row has no ring, only its bottom divider", () => {
    const classes = rowClasses(renderRow({ isSelected: false }));

    expect(classes).toContain("border-b");
    expect(classes.some((name) => name.startsWith("ring"))).toBe(false);
  });

  it("failure: the error ring is inset too, so the sticky header above cannot cover it", () => {
    const classes = rowClasses(renderRow({ isSelected: true, hasError: true }));

    expect(classes).toEqual(expect.arrayContaining(["ring-2", "ring-inset", "ring-destructive"]));
  });

  it("edge: the trailing control (prepared dot) is inset from the right border like the row's left padding", () => {
    const html = renderRow({ isSelected: false, trailing: <span data-testid="dot" /> });

    expect(html).toContain('<div class="shrink-0 pr-3"><span data-testid="dot"></span></div>');
  });

  it("edge: no trailing wrapper is rendered without a trailing control", () => {
    expect(renderRow({ isSelected: false })).not.toContain("shrink-0 pr-3");
  });
});
