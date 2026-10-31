import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components/layout/Sidebar", file), "utf8");

const groupList = read("GroupList.tsx");
const characterRowFiles = ["GroupList.tsx", "CharactersWithoutGroupList.tsx", "GmSessionPlayersSidebarSection.tsx"];

/** @see FR-frontend-design — sidebar rows (design.md §5.5) */
describe("Sidebar rows — groups and selection", () => {
  it("nominal: group header has no resting surface and its label is always bold", () => {
    const header = groupList.match(/<Collapsible\b[\s\S]*?<div className="([^"]+)">/)?.[1] ?? "";

    expect(header).not.toContain("bg-card");
    expect(header).toContain("hover:bg-white/10");
    expect(groupList).toContain('<span className="min-w-0 flex-1 truncate text-left text-sm font-bold">');
  });

  it("edge: group label lines up with its characters (pl-1 + 16px chevron + gap-2 = ml-4 + px-3)", () => {
    const header = groupList.match(/<Collapsible\b[\s\S]*?<div className="([^"]+)">/)?.[1] ?? "";
    const trigger = groupList.match(/<CollapsibleTrigger[\s\S]*?className="([^"]+)"/)?.[1] ?? "";
    const content = groupList.match(/<CollapsibleContent[\s\S]*?className="([^"]+)"/)?.[1] ?? "";

    expect(header).toContain("pl-1");
    expect(trigger).toContain("gap-2");
    expect(groupList).toMatch(/<ChevronRight[\s\S]*?h-4 w-4/);
    expect(content).toContain("ml-4");
    expect(groupList).toMatch(/flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 px-3 /);
  });

  it.each(characterRowFiles)("failure guard: %s selected row has no violet bar nor label shift", (file) => {
    const source = read(file);

    expect(source).toContain("bg-white/15");
    expect(source).not.toContain("bg-primary-light");
    expect(source).not.toMatch(/isSelected[^\n]*pl-4/);
  });
});
