import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CodexResultRow from "@/components/character/CodexResultRow";

const renderRow = (isSelected: boolean, overrides: Partial<Parameters<typeof CodexResultRow>[0]> = {}) =>
  renderToStaticMarkup(
    <CodexResultRow
      name="Aldric le Brave"
      meta="Niv. 3 • Humain"
      isSelected={isSelected}
      onSelect={() => undefined}
      {...overrides}
    />,
  );

const rowOf = (html: string) => html.match(/^<div[^>]*>/)?.[0] ?? "";
const buttonOf = (html: string) => html.match(/<button[^>]*>/)?.[0] ?? "";
const nameOf = (html: string) => html.match(/<div id="[^"]*" class="[^"]*leading-tight[^"]*">[^<]*<\/div>/)?.[0] ?? "";

describe("CodexResultRow", () => {
  it("nominal: plain row without resting background, neutral gray hover, not pressed", () => {
    const html = renderRow(false);
    const row = rowOf(html);

    expect(row).toContain("rounded-[10px]");
    expect(row).toContain("hover:bg-white/10");
    expect(row).not.toContain("bg-card");
    expect(row).not.toMatch(/(^|\s)bg-white\/15/);
    expect(row).not.toContain("purple");
    expect(buttonOf(html)).toContain('aria-pressed="false"');
    expect(buttonOf(html)).toContain('type="button"');
  });

  it("nominal: selected row uses the selection gray and white name", () => {
    const html = renderRow(true);

    expect(rowOf(html)).toMatch(/(^|\s)bg-white\/15/);
    expect(buttonOf(html)).toContain('aria-pressed="true"');
    expect(nameOf(html)).toContain("text-white");
  });

  it("edge: tight name line-height while keeping the gap before metadata", () => {
    const html = renderRow(false);

    expect(nameOf(html)).toContain("leading-tight");
    expect(html).toMatch(/class="mt-1 [^"]*text-muted-foreground[^"]*">Niv\. 3/);
  });

  it("a11y: overlay button is named by the entry name and keeps a visible keyboard focus ring", () => {
    const html = renderRow(false);
    const nameId = nameOf(html).match(/id="([^"]*)"/)?.[1];

    expect(nameId).toBeTruthy();
    expect(buttonOf(html)).toContain(`aria-labelledby="${nameId}"`);
    expect(rowOf(html)).toContain("has-[&gt;button:focus-visible]:ring-2");
  });

  it("failure guard: no badges container is rendered when there is no badge", () => {
    const withoutBadges = renderRow(false, { badges: null });
    const withBadges = renderRow(false, { badges: <svg aria-label="SRD" /> });

    expect(withoutBadges).not.toContain("shrink-0 gap-1.5");
    expect(withBadges).toContain("shrink-0 gap-1.5");
    expect(withBadges).toContain('aria-label="SRD"');
  });
});
