import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrackerGridCell } from "@/components/initiativeTracker/TrackerGridCell";

describe("FR-combat-initiative-tracker — TrackerGridCell guardrail", () => {
  it("nominal: applies overflow isolation on every grid cell", () => {
    const html = renderToStaticMarkup(
      <TrackerGridCell align="condition">
        <span>Concentré</span>
      </TrackerGridCell>,
    );

    expect(html).toContain('data-tracker-grid-cell=""');
    expect(html).toContain('data-tracker-grid-cell-align="condition"');
    expect(html).toContain("overflow-x-clip");
    expect(html).toContain("isolate");
    expect(html).toContain("min-w-0");
    expect(html).toContain("max-w-full");
  });

  it("edge: supports span grid cells for the group column", () => {
    const html = renderToStaticMarkup(
      <TrackerGridCell as="span" align="group">
        <span>Participants</span>
      </TrackerGridCell>,
    );

    expect(html).toMatch(/^<span/);
    expect(html).toContain('data-tracker-grid-cell-align="group"');
  });

  it("failure: never renders without the guardrail class", () => {
    const html = renderToStaticMarkup(
      <TrackerGridCell>
        <span>HP</span>
      </TrackerGridCell>,
    );

    expect(html).toContain("min-w-0");
    expect(html).toContain("max-w-full");
    expect(html).not.toContain("overflow-visible");
  });
});
