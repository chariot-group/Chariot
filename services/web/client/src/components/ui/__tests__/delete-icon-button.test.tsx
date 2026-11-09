import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeleteIconButton } from "@/components/ui/delete-icon-button";

/** @see FR-frontend-button-system (shared delete button in edit forms) */
describe("DeleteIconButton", () => {
  it("nominal: renders a labelled icon button with the shared red styling", () => {
    const html = renderToStaticMarkup(<DeleteIconButton aria-label="Remove sense" />);

    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Remove sense"');
    expect(html).toContain("size-9");
    expect(html).toContain("text-red");
    expect(html).toContain("hover:bg-red/10");
    expect(html).toContain('aria-hidden="true"');
  });

  it("edge: merges extra layout classes without dropping the shared styling", () => {
    const html = renderToStaticMarkup(
      <DeleteIconButton
        aria-label="Remove"
        className="shrink-0"
      />,
    );

    expect(html).toContain("shrink-0");
    expect(html).toContain("text-red");
  });

  it("failure: a disabled button stays disabled and neutralizes its hover", () => {
    const html = renderToStaticMarkup(
      <DeleteIconButton
        aria-label="Remove"
        disabled
      />,
    );

    expect(html).toContain("disabled");
    expect(html).toContain("disabled:hover:bg-transparent");
  });
});
