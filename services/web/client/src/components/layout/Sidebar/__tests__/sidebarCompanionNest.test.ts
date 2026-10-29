import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const playerListPath = resolve(
  process.cwd(),
  "src/components/layout/Sidebar/CharactersWithoutGroupList.tsx",
);
const sessionSectionPath = resolve(
  process.cwd(),
  "src/components/layout/Sidebar/GmSessionPlayersSidebarSection.tsx",
);
const nestPath = resolve(
  process.cwd(),
  "src/components/layout/Sidebar/shared/SidebarCompanionNest.tsx",
);

/** @see FR-sidebar-linked-npc-nesting-collapse */
describe("FR-sidebar-linked-npc-nesting-collapse — sidebar UI wiring", () => {
  it("nominal: Mes personnages uses collapsible companion nest", () => {
    const source = readFileSync(playerListPath, "utf8");
    expect(source).toContain("SidebarCompanionNest");
    expect(source).toContain("companionCharacterIds");
    expect(source).not.toContain("companionRail");
  });

  it("nominal: session GM section uses the same nest component", () => {
    const source = readFileSync(sessionSectionPath, "utf8");
    expect(source).toContain("SidebarCompanionNest");
  });

  it("edge: nest component matches GroupList header shell and a11y", () => {
    const source = readFileSync(nestPath, "utf8");
    expect(source).toContain("setCompanionNestCollapsed");
    expect(source).toContain("aria-expanded");
    expect(source).toContain("collapseCompanionsAria");
    expect(source).toContain("selectedCompanionActive");
    expect(source).toContain("bg-card");
    expect(source).toContain("mt-1 ml-3");
    expect(source).not.toContain("border-purple");
    expect(source).toContain("SidebarItemWithActions");
  });
});
