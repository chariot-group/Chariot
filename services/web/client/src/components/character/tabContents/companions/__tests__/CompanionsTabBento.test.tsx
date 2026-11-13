import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { BREAKPOINTS, emptyCells, place, spanAt } from "@/components/character/tabContents/__tests__/bentoPlacement";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import {
  COMPANIONS_BENTO_GRID_CLASS,
  COMPANIONS_SLOTS,
} from "@/components/character/tabContents/companions/shared/companionsBentoLayout";
import { CompanionsEmptyState } from "@/components/character/tabContents/companions/view/CompanionsEmptyState";
import { CompanionsNoSearchResult } from "@/components/character/tabContents/companions/view/CompanionsNoSearchResult";
import { CompanionsSearchField } from "@/components/character/tabContents/companions/view/CompanionsSearchField";

const renderEmpty = (actions?: ReactNode) =>
  render(
    <div className={COMPANIONS_BENTO_GRID_CLASS}>
      <CompanionsEmptyState actions={actions} />
    </div>,
  );

/** @see FR-npc-player-link — Companions tab bento layout */
describe("Companions tab bento layout", () => {
  for (const [bpName, bp] of Object.entries(BREAKPOINTS)) {
    it(`nominal: empty-state band leaves no empty cell on ${bpName} (${bp.columns} columns)`, () => {
      expect(emptyCells([COMPANIONS_SLOTS.emptyIntro, COMPANIONS_SLOTS.emptyExamples], bp)).toEqual([]);
    });
  }

  it("nominal: toolbar on its own row, companions full width below lg, two per row at lg, three from xl", () => {
    const three = [COMPANIONS_SLOTS.companion, COMPANIONS_SLOTS.companion, COMPANIONS_SLOTS.companion];
    expect(spanAt(COMPANIONS_SLOTS.companion, "col", BREAKPOINTS.mobile)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.companion, "col", BREAKPOINTS.tablet)).toBe(4);
    expect(spanAt(COMPANIONS_SLOTS.companion, "col", BREAKPOINTS.laptop)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.companion, "col", BREAKPOINTS.desktop)).toBe(4);
    expect(place([COMPANIONS_SLOTS.toolbar, ...three], BREAKPOINTS.mobile)).toHaveLength(4);
    expect(place([COMPANIONS_SLOTS.toolbar, ...three], BREAKPOINTS.tablet)).toHaveLength(4);
    expect(place([COMPANIONS_SLOTS.toolbar, ...three], BREAKPOINTS.laptop)).toHaveLength(3);
    expect(place([COMPANIONS_SLOTS.toolbar, ...three], BREAKPOINTS.desktop)).toHaveLength(2);
    expect(spanAt(COMPANIONS_SLOTS.toolbar, "col", BREAKPOINTS.desktop)).toBe(12);
  });

  it("nominal: empty-state cards stack below lg (no sm-level split), then split 2+2 at lg", () => {
    expect(spanAt(COMPANIONS_SLOTS.emptyIntro, "col", BREAKPOINTS.mobile)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.emptyIntro, "col", BREAKPOINTS.tablet)).toBe(4);
    expect(spanAt(COMPANIONS_SLOTS.emptyIntro, "col", BREAKPOINTS.laptop)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.emptyIntro, "col", BREAKPOINTS.desktop)).toBe(8);
    expect(spanAt(COMPANIONS_SLOTS.emptyExamples, "col", BREAKPOINTS.mobile)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.emptyExamples, "col", BREAKPOINTS.tablet)).toBe(4);
    expect(spanAt(COMPANIONS_SLOTS.emptyExamples, "col", BREAKPOINTS.laptop)).toBe(2);
    expect(spanAt(COMPANIONS_SLOTS.emptyExamples, "col", BREAKPOINTS.desktop)).toBe(4);
    // Below lg, both empty-state cards are full width of their own grid (stacked, one per row).
    expect(place([COMPANIONS_SLOTS.emptyIntro, COMPANIONS_SLOTS.emptyExamples], BREAKPOINTS.tablet)).toHaveLength(2);
    expect(place([COMPANIONS_SLOTS.emptyIntro, COMPANIONS_SLOTS.emptyExamples], BREAKPOINTS.laptop)).toHaveLength(1);
  });

  it("nominal: empty state renders the two cards as direct grid children, buttons inside the first", () => {
    const html = renderEmpty(<button type="button">link-action</button>);
    const children = directChildren(html, COMPANIONS_BENTO_GRID_CLASS);
    expect(children).toHaveLength(2);
    expect(children[0]).toContain(COMPANIONS_SLOTS.emptyIntro);
    expect(children[1]).toContain(COMPANIONS_SLOTS.emptyExamples);
    expect(html.indexOf("link-action")).toBeLessThan(html.indexOf("companions-examples-title"));
    expect(html).toMatch(/class="mt-auto flex flex-nowrap justify-end[^"]*"><button[^>]*>link-action/);
    expect(html).not.toContain("flex-wrap");
    expect(html).not.toContain("emptyActionHint");
    // Headings in the tab violet, readable on the card (design.md violet usage rule).
    expect(html.match(/<h2[^>]*text-primary-light/g)).toHaveLength(2);
  });

  it("edge: empty-state CTA row never wraps and the buttons stay accessible icon-only below 375px", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/character/tabContents/companions/CharacterCompanionsTabContent.tsx"),
      "utf8",
    );
    expect(source).toMatch(/aria-label=\{t\("linkExisting"\)\}/);
    expect(source).toMatch(/aria-label=\{t\("createLinked"\)\}/);
    // Custom breakpoint (not `sm`): 375px, below the measured minimum (420px) for the longest
    // (ES) translation — the ES label can clip on narrow ES phones (decision 2026-11-13 amended).
    expect(source).toContain('<span className="sr-only min-[375px]:not-sr-only">{t("linkExisting")}</span>');
    expect(source).toContain('<span className="sr-only min-[375px]:not-sr-only">{t("createLinked")}</span>');
  });

  it("edge: headings are unique and every aria-labelledby resolves", () => {
    const html = renderEmpty();
    const all = ids(html);
    expect(new Set(all).size).toBe(all.length);
    for (const id of labelledBy(html)) expect(all).toContain(id);
    expect(html).toContain('aria-hidden="true"');
  });

  it("failure / guard: session GM empty state (no actions) renders no button", () => {
    const html = renderEmpty();
    expect(html).not.toContain("<button");
    expect(directChildren(html, COMPANIONS_BENTO_GRID_CLASS)).toHaveLength(2);
  });

  it("failure: no slot uses h-fit or order-*", () => {
    for (const classes of Object.values(COMPANIONS_SLOTS)) {
      expect(classes).not.toMatch(/h-fit|order-/);
      expect(classes.split(" ")).toContain("min-w-0");
    }
  });

  it("nominal: search field has an accessible label, a polite live region and a clear button when filled", () => {
    const html = render(
      <CompanionsSearchField
        value="loup"
        onChange={() => {}}
        resultCount={2}
      />,
    );
    const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
    expect(inputId).toBeTruthy();
    expect(html).toContain(`for="${inputId}"`);
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("searchResultCount");
    expect(html).toMatch(/<button[^>]*aria-label="searchClear"/);
  });

  it("edge: empty search field renders no clear button and announces nothing", () => {
    const html = render(
      <CompanionsSearchField
        value=""
        onChange={() => {}}
        resultCount={3}
      />,
    );
    expect(html).not.toContain("<button");
    expect(html).not.toContain("searchResultCount");
  });

  it("edge: no-result band spans the full row and renders no button", () => {
    const html = render(
      <div className={COMPANIONS_BENTO_GRID_CLASS}>
        <CompanionsNoSearchResult query="dragon" />
      </div>,
    );
    const children = directChildren(html, COMPANIONS_BENTO_GRID_CLASS);
    expect(children).toHaveLength(1);
    expect(children[0]).toContain(COMPANIONS_SLOTS.noResults);
    expect(html).toContain("searchNoResults");
    expect(html).not.toContain("<button");
    for (const bp of Object.values(BREAKPOINTS)) expect(emptyCells([COMPANIONS_SLOTS.noResults], bp)).toEqual([]);
  });

  it("failure / guard: empty state renders no search field", () => {
    expect(renderEmpty(<button type="button">link-action</button>)).not.toContain('type="search"');
  });
});
