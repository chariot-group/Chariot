import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ListSelectRow from "@/components/character/tabContents/shared/listCard/ListSelectRow";

const renderRow = (props: { isSelected: boolean; hasError?: boolean }) =>
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
});
