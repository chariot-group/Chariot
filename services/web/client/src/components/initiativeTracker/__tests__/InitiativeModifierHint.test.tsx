import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <span data-tooltip="true">{children}</span>,
}));

import { InitiativeModifierHint } from "@/components/initiativeTracker/InitiativeModifierHint";

/** @see FR-tracker-initiative-modifier-display */
describe("FR-tracker-initiative-modifier-display — InitiativeModifierHint", () => {
  it("nominal: shows dice icon, signed bonus, and tooltip label", () => {
    const html = renderToStaticMarkup(
      <InitiativeModifierHint
        modifierText="+2"
        ariaLabel="Bonus d'initiative +2"
      />,
    );

    expect(html).toContain("lucide-dices");
    expect(html).toContain("+2");
    expect(html).toContain('aria-label="Bonus d&#x27;initiative +2"');
    expect(html).toContain("Bonus d&#x27;initiative +2");
    expect(html).toContain('data-tooltip="true"');
  });

  it("edge: zero modifier stays visible with icon", () => {
    const html = renderToStaticMarkup(
      <InitiativeModifierHint
        modifierText="+0"
        ariaLabel="Bonus d'initiative +0"
      />,
    );

    expect(html).toContain("lucide-dices");
    expect(html).toContain("+0");
    expect(html).toContain('aria-label="Bonus d&#x27;initiative +0"');
  });

  it("failure: negative modifier remains signed and labeled", () => {
    const html = renderToStaticMarkup(
      <InitiativeModifierHint
        modifierText="-1"
        ariaLabel="Bonus d'initiative -1"
      />,
    );

    expect(html).toContain("-1");
    expect(html).toContain('aria-label="Bonus d&#x27;initiative -1"');
    expect(html).not.toContain("+1");
  });
});
