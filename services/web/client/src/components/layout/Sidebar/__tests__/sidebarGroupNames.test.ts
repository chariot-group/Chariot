import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components/layout/Sidebar", file), "utf8");

const groupList = read("GroupList.tsx");
const itemWithActions = read("shared/SidebarItemWithActions.tsx");
const headerTrigger = groupList.match(/function GroupHeaderTrigger[\s\S]*?\n}\n/)?.[0] ?? "";
const menuTitle = itemWithActions.match(/function SidebarMenuTitle[\s\S]*?\n}\n/)?.[0] ?? "";

/** @see FR-sidebar-context-actions — truncated group names */
describe("Sidebar — truncated group names", () => {
  it("nominal: hovering the group header never shows the group name", () => {
    expect(headerTrigger).not.toContain("useIsTextTruncated");
    expect(headerTrigger).toContain("open={Boolean(activeTooltip) && tooltipOpen}");
    expect(headerTrigger).not.toMatch(/<TooltipContent[\s\S]*\{label\}[\s\S]*<\/TooltipContent>/);
  });

  it("nominal: the group menus (⋮ and right-click) start with the full group name", () => {
    expect(groupList).toContain("menuTitle={group.label}");
    expect(menuTitle).toContain("<DropdownMenuLabel className={menuTitleClassName}>{title}</DropdownMenuLabel>");
    expect(menuTitle).toContain("<ContextMenuLabel className={menuTitleClassName}>{title}</ContextMenuLabel>");
    // overflow menu, context menu, and context menu with trailing actions
    expect(itemWithActions.match(/\{menuTitle \? \(/g)).toHaveLength(3);
  });

  it("edge: the menu title wraps instead of being cut", () => {
    expect(itemWithActions).toMatch(/menuTitleClassName = "[^"]*break-words/);
    expect(itemWithActions).not.toMatch(/menuTitleClassName = "[^"]*truncate/);
  });

  it("edge: the collapsed-active indication moves to the app tooltip, no native title on the header", () => {
    expect(headerTrigger).toMatch(
      /className=\{truncatedTextTooltipClassName\}>\s*\{activeTooltip\}\s*<\/TooltipContent>/,
    );
    expect(groupList).not.toContain("title={activeTooltip");
  });

  it("failure guard: the header still toggles the group and the title is a label, not a menu item", () => {
    expect(headerTrigger).toContain("aria-controls={`group-${groupId}-content`}");
    expect(groupList).toContain("onOpenChange={() => onToggleGroup(group._id)}");
    expect(menuTitle).not.toContain("MenuItem");
  });
});
