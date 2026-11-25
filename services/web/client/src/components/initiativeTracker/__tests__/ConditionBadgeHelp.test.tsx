import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";

const tooltipRoots: Array<{ delayDuration?: number; open?: boolean }> = [];
const triggerChildren: React.ReactElement<{ onClick?: (event: unknown) => void }>[] = [];

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, delayDuration, open }: { children: React.ReactNode; delayDuration?: number; open?: boolean }) => {
    tooltipRoots.push({ delayDuration, open });
    return <>{children}</>;
  },
  TooltipTrigger: ({ children }: { children: React.ReactElement<{ onClick?: (event: unknown) => void }> }) => {
    triggerChildren.push(children);
    return children;
  },
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-tooltip-content="">{children}</span>,
}));

import { CONDITION_HELP_DELAY_MS, ConditionBadgeHelp } from "@/components/initiativeTracker/ConditionBadgeHelp";

const renderBadge = (description?: string | null) =>
  renderToStaticMarkup(
    <ConditionBadgeHelp
      title="Prone (2 rounds)"
      description={description}
      className="rounded-full border">
      <span>Prone (2 rounds)</span>
    </ConditionBadgeHelp>,
  );

describe("FR-combat-initiative-tracker — condition badge help", () => {
  it("nominal: the badge itself triggers the help after 0.5 s, without help icon", () => {
    tooltipRoots.length = 0;
    const html = renderBadge("A prone creature can only crawl.");

    expect(CONDITION_HELP_DELAY_MS).toBe(500);
    expect(tooltipRoots.at(-1)?.delayDuration).toBe(500);
    expect(tooltipRoots.at(-1)?.open).toBe(false);
    expect(html).toContain('data-slot="condition-badge"');
    expect(html).toContain('type="button"');
    expect(html).toContain("A prone creature can only crawl.");
    expect(html).not.toContain("lucide-info");
  });

  it("edge: without description the badge stays a plain pill with its native title", () => {
    tooltipRoots.length = 0;
    const html = renderBadge("   ");

    expect(tooltipRoots).toHaveLength(0);
    expect(html).not.toContain("<button");
    expect(html).toContain('title="Prone (2 rounds)"');
  });

  it("guard: a click is handled by the badge (toggle) and never reaches the row", () => {
    triggerChildren.length = 0;
    renderBadge("Help");
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    triggerChildren.at(-1)?.props.onClick?.(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
