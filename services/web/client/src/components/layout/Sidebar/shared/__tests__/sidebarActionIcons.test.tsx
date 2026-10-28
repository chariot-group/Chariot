import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SidebarActionLabel } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import { SIDEBAR_ACTION_ICONS } from "@/components/layout/Sidebar/shared/sidebarActionIcons";

const sidebarDir = fileURLToPath(new URL("../..", import.meta.url));

/** Action ids declared by sidebar components (`id: "edit"`, …). */
function declaredSidebarActionIds(): string[] {
  const ids = new Set<string>();
  for (const file of readdirSync(sidebarDir).filter((name) => name.endsWith(".tsx"))) {
    const source = readFileSync(resolve(sidebarDir, file), "utf8");
    for (const match of source.matchAll(/\bid: "([\w-]+)"/g)) ids.add(match[1]);
  }
  return [...ids];
}

/** @see FR-sidebar-context-actions — context menu and overflow menu share the same rows */
describe("Sidebar action menu icons", () => {
  it("nominal: renders the default icon before the label, hidden from assistive tech", () => {
    const html = renderToStaticMarkup(
      <SidebarActionLabel action={{ id: "edit", label: "Modifier", onSelect: () => {} }} />,
    );

    expect(html).toContain("lucide-pencil");
    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*><svg/);
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("Modifier"));
  });

  it("nominal: every action declared in the sidebar has a default icon", () => {
    const ids = declaredSidebarActionIds();

    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !SIDEBAR_ACTION_ICONS[id])).toEqual([]);
  });

  it("edge: an explicit icon wins over the default one", () => {
    const html = renderToStaticMarkup(
      <SidebarActionLabel
        action={{ id: "edit", label: "Modifier", onSelect: () => {}, icon: <svg data-custom="true" /> }}
      />,
    );

    expect(html).toContain('data-custom="true"');
    expect(html).not.toContain("lucide-pencil");
  });

  it("failure: unknown action id renders the label alone", () => {
    const html = renderToStaticMarkup(
      <SidebarActionLabel action={{ id: "unknown", label: "Autre", onSelect: () => {} }} />,
    );

    expect(html).not.toContain("<svg");
    expect(html).not.toContain("aria-hidden");
    expect(html).toContain("Autre");
  });
});
