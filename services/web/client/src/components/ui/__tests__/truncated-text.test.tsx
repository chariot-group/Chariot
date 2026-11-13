import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getTruncatedTextClassName,
  isElementTruncated,
  resolveTouchTooltipToggle,
  TruncatedText,
} from "@/components/ui/truncated-text";

const box = (scrollWidth: number, clientWidth: number, scrollHeight = 20, clientHeight = 20) => ({
  scrollWidth,
  clientWidth,
  scrollHeight,
  clientHeight,
});

/** @see docs/design.md §6.4 — full name on hover only when truncated */
describe("isElementTruncated", () => {
  it("nominal: detects a single-line text cut by truncate (width overflow)", () => {
    expect(isElementTruncated(box(320, 200))).toBe(true);
  });

  it("nominal: detects a multi-line text cut by line-clamp (height overflow)", () => {
    expect(isElementTruncated(box(200, 200, 84, 56))).toBe(true);
  });

  it("edge: text that fits, or sub-pixel rounding, is not considered truncated", () => {
    expect(isElementTruncated(box(200, 200))).toBe(false);
    expect(isElementTruncated(box(201, 200, 21, 20))).toBe(false);
  });

  it("failure guard: missing element is not truncated", () => {
    expect(isElementTruncated(null)).toBe(false);
  });
});

describe("getTruncatedTextClassName — cursor", () => {
  it("nominal: truncated text shows the help cursor (tooltip available)", () => {
    expect(getTruncatedTextClassName(1, true)).toContain("cursor-help");
    expect(getTruncatedTextClassName(2, true, "text-lg")).toMatch(/line-clamp-2.*cursor-help.*text-lg/);
  });

  it("edge: text that fits keeps the default cursor", () => {
    expect(getTruncatedTextClassName(1, false)).not.toContain("cursor-help");
  });
});

describe("resolveTouchTooltipToggle — tap on touch screens", () => {
  it("nominal: a tap on a truncated text opens the tooltip, a second tap closes it", () => {
    expect(resolveTouchTooltipToggle({ pointerType: "touch", truncated: true, open: false })).toBe(true);
    expect(resolveTouchTooltipToggle({ pointerType: "touch", truncated: true, open: true })).toBe(false);
  });

  it("edge: a tap on a text that fits does nothing", () => {
    expect(resolveTouchTooltipToggle({ pointerType: "touch", truncated: false, open: false })).toBeNull();
  });

  it("failure guard: mouse, pen or unknown pointers keep the default hover behavior", () => {
    expect(resolveTouchTooltipToggle({ pointerType: "mouse", truncated: true, open: false })).toBeNull();
    expect(resolveTouchTooltipToggle({ pointerType: "pen", truncated: true, open: false })).toBeNull();
    expect(resolveTouchTooltipToggle({ pointerType: null, truncated: true, open: false })).toBeNull();
  });
});

describe("TruncatedText", () => {
  it("nominal: renders the full text in the DOM with single-line truncation and no native title", () => {
    const html = renderToStaticMarkup(<TruncatedText text="Les Chroniques du royaume oublié" />);

    expect(html).toContain("Les Chroniques du royaume oublié");
    expect(html).toMatch(/<span[^>]*class="[^"]*\btruncate\b/);
    expect(html).not.toContain("title=");
  });

  it("edge: renders a two-line heading with custom children; tooltip is closed until truncated + hovered", () => {
    const html = renderToStaticMarkup(
      <TruncatedText
        as="h2"
        lines={2}
        id="heading"
        text="Session - Campagne">
        Session <span>- Campagne</span>
      </TruncatedText>,
    );

    expect(html).toMatch(/<h2[^>]*id="heading"/);
    expect(html).toContain("line-clamp-2");
    expect(html).toContain("<span>- Campagne</span>");
    expect(html).toContain('data-state="closed"');
    expect(html).not.toContain('role="tooltip"');
  });
});
