import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StableLabel } from "@/components/ui/stable-label";

/** @see FR-frontend-button-system (copy confirmation keeps the button width) */
describe("StableLabel", () => {
  it("nominal: shows the current label and reserves the other one in the same cell", () => {
    const html = renderToStaticMarkup(<StableLabel label="Copier le lien" alternates={["Copier le lien", "Copié !"]} />);

    expect(html).toContain(">Copier le lien</span>");
    expect(html).toContain('aria-hidden="true" data-stable-label-ghost="" class="invisible col-start-1 row-start-1 truncate">Copié !</span>');
    expect(html.match(/col-start-1 row-start-1/g)).toHaveLength(2);
  });

  it("edge: after switching, the previous label becomes the invisible width reservation", () => {
    const html = renderToStaticMarkup(<StableLabel label="Copié !" alternates={["Copier le lien", "Copié !"]} />);

    expect(html).toContain('class="col-start-1 row-start-1 truncate">Copié !</span>');
    expect(html).toContain('class="invisible col-start-1 row-start-1 truncate">Copier le lien</span>');
  });

  it("guard: the current label is never duplicated as a hidden ghost", () => {
    const html = renderToStaticMarkup(<StableLabel label="Copié !" alternates={["Copié !"]} />);

    expect(html).not.toContain("data-stable-label-ghost");
    expect(html.match(/Copié !/g)).toHaveLength(1);
  });
});
