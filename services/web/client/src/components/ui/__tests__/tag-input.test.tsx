import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagInput } from "@/components/ui/tag-input";

const noop = () => {};

describe("TagInput — layout", () => {
  it("nominal: renders selected tags after the search field so fields stay aligned", () => {
    const html = renderToStaticMarkup(<TagInput id="tags" value={["Feu", "Froid"]} onChange={noop} />);
    const inputIndex = html.indexOf("<input");
    expect(inputIndex).toBeGreaterThanOrEqual(0);
    expect(html.indexOf("Feu")).toBeGreaterThan(inputIndex);
    expect(html.indexOf("Froid")).toBeGreaterThan(inputIndex);
  });

  it("nominal: tags use the form radius scale instead of a full pill", () => {
    const html = renderToStaticMarkup(<TagInput value={["Feu"]} onChange={noop} />);
    expect(html).toContain("rounded-[12px]");
    expect(html).not.toContain("rounded-[15px] text-sm");
  });

  it("edge: renders no tag container when the value is empty", () => {
    const html = renderToStaticMarkup(<TagInput value={[]} onChange={noop} />);
    expect(html).not.toContain("flex-wrap");
    expect(html).not.toContain("Remove");
  });

  it("a11y: each tag exposes a labelled remove button", () => {
    const html = renderToStaticMarkup(<TagInput value={["Feu"]} onChange={noop} />);
    expect(html).toContain('aria-label="Remove Feu"');
  });
});
