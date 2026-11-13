import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components/layout/Sidebar", file), "utf8");

const environment = read("SidebarEnvironment.tsx");
const context = read("SidebarContext.tsx");

/** @see FR-sidebar-navigation — long campaign names (design.md §6.4) */
describe("Sidebar — long campaign names", () => {
  it("nominal: campaign rows truncate on one line and reveal the full name in a tooltip on the row button", () => {
    const row = environment.match(/function CampaignMenuButton[\s\S]*?\n}\n/)?.[0] ?? "";

    expect(row).toContain("useIsTextTruncated<HTMLSpanElement>(label)");
    expect(row).toContain("open={truncated && tooltipOpen}");
    expect(row).toMatch(/<TooltipTrigger asChild>\s*<button/);
    expect(row).toMatch(/ref=\{ref\}\s*className="min-w-0 flex-1 truncate text-left /);
    expect(environment).toContain("<CampaignMenuButton");
  });

  it("failure guard: clickable campaign rows keep the pointer cursor, never the help cursor", () => {
    const row = environment.match(/function CampaignMenuButton[\s\S]*?\n}\n/)?.[0] ?? "";

    expect(row).toContain("menuItemClassName");
    expect(row).not.toContain("cursor-help");
  });

  it("edge: on touch screens (no hover) campaign rows wrap on two lines instead of a tooltip", () => {
    const row = environment.match(/function CampaignMenuButton[\s\S]*?\n}\n/)?.[0] ?? "";

    expect(row).toContain("pointer-coarse:line-clamp-2 pointer-coarse:whitespace-normal pointer-coarse:break-words");
    expect(row).toContain("onClick={onSelect}");
  });

  it("edge: GM space menu width is bounded (trigger width, at least 14rem) with Tailwind v4 var syntax", () => {
    const content = environment.match(/<DropdownMenuContent[\s\S]*?className="([^"]+)"/)?.[1] ?? "";

    expect(content).toContain("w-(--radix-dropdown-menu-trigger-width)");
    expect(content).toContain("min-w-56");
    // Tailwind v3 bracket syntax produces no width in v4, which let the menu grow with the label
    expect(content).not.toContain("w-[--radix");
  });

  it("nominal: GM space campaign title is clamped to two lines with a tooltip", () => {
    const heading = context.match(/<TruncatedText[\s\S]*?\/>/)?.[0] ?? "";

    expect(heading).toContain('as="h2"');
    expect(heading).toContain("lines={2}");
    expect(heading).toContain("text={selectedCampaign.label}");
  });

  it("failure guard: no native browser title and no heading without a selected campaign", () => {
    expect(environment).not.toContain("title={campaign.label}");
    expect(context).not.toContain("title={selectedCampaign.label}");
    expect(context).toMatch(/\{selectedCampaign && \(\s*<TruncatedText/);
  });
});

/** @see design.md §5.4 — selected campaign in the GM space menu */
describe("Sidebar — selected campaign row", () => {
  const row = environment.match(/function CampaignMenuButton[\s\S]*?\n}\n/)?.[0] ?? "";

  it("nominal: the selected campaign uses the shared selected-row background", () => {
    expect(row).toContain("isSelected && menuItemSelectedClassName");
  });

  it("edge: selection is announced to assistive tech, not only shown by color", () => {
    expect(row).toContain('aria-current={isSelected ? "true" : undefined}');
  });

  it("failure guard: no check icon is rendered on the selected campaign", () => {
    expect(row).not.toContain("<Check");
    expect(environment).not.toMatch(/import \{[^}]*\bCheck\b[^}]*\} from "lucide-react"/);
  });
});

describe("Sidebar — campaign rows spacing", () => {
  it("nominal: campaign rows are stacked with a gap so selected/hovered backgrounds never touch", () => {
    expect(environment).toMatch(/<div className="flex flex-col gap-1">\s*\{campaigns\.map/);
  });
});
