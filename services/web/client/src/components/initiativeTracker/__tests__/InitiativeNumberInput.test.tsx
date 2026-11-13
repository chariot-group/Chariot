import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <span data-tooltip="true">{children}</span>,
}));

import { InitiativeNumberInput } from "@/components/initiativeTracker/InitiativeNumberInput";

/** @see FR-combat-initiative-tracker */
describe("FR-combat-initiative-tracker — InitiativeNumberInput", () => {
  it("nominal: shows roll derived from total - modifier", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={17}
        resetKey="row-1"
        ariaLabel="Initiative de Aria"
        modifier={2}
        modifierAriaLabel="Bonus d'initiative +2"
        showModifier
        onCommit={() => {}}
      />,
    );

    // A roll is entered: the line shows the calculation instead of the dice + bonus.
    expect(html).toContain("15 + 2 = 17");
    expect(html).toContain('data-tooltip="true"');
    expect(html).toContain('value="15"');
    expect(html).toContain('aria-label="Initiative de Aria, Bonus d&#x27;initiative +2"');
  });

  it("edge: hides modifier when showModifier is false", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={14}
        resetKey="row-1"
        ariaLabel="Initiative"
        modifier={5}
        showModifier={false}
        onCommit={() => {}}
      />,
    );

    expect(html).not.toContain("+5");
    expect(html).not.toContain("lucide-dices");
    expect(html).toContain('value="9"');
    expect(html).toContain('aria-label="Initiative"');
  });

  it("failure: missing modifier treats total as roll", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={7}
        resetKey="row-2"
        ariaLabel="Initiative"
        modifier={null}
        modifierAriaLabel="Bonus d'initiative +0"
        showModifier
        onCommit={() => {}}
      />,
    );

    expect(html).toContain("+0");
    expect(html).toContain('value="7"');
  });

  it("nominal: calculation replaces the bonus once a roll is entered", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={17}
        resetKey="row-1"
        ariaLabel="Initiative de Aria"
        modifier={2}
        modifierAriaLabel="Bonus d'initiative +2, ajouté automatiquement au jet"
        showModifier
        rollPlaceholder="d20"
        totalPreviewLabel="Total d'initiative :"
        onCommit={() => {}}
      />,
    );

    expect(html).toContain('placeholder="d20"');
    expect(html).toContain("15 + 2 = 17");
    expect(html).not.toContain("lucide-dices");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Total d&#x27;initiative : 15 + 2 = 17");
    expect(html).toContain("ajouté automatiquement au jet");
    expect(html).toMatch(/aria-describedby="[^"]+"/);
  });

  it("edge: negative modifier shows a minus sign", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={7}
        resetKey="row-3"
        ariaLabel="Initiative"
        modifier={-1}
        showModifier
        onCommit={() => {}}
      />,
    );

    expect(html).toContain("8 \u2212 1 = 7");
  });

  it("guard: no roll entered shows the placeholder and the bonus, no calculation", () => {
    const html = renderToStaticMarkup(
      <InitiativeNumberInput
        value={2}
        resetKey="row-4"
        ariaLabel="Initiative"
        modifier={2}
        showModifier
        rollPlaceholder="d20"
        onCommit={() => {}}
      />,
    );

    expect(html).toContain('value=""');
    expect(html).toContain('placeholder="d20"');
    expect(html).toContain("lucide-dices");
    expect(html).toContain(">+2<");
    expect(html).not.toContain(" = ");
    // Placeholder disappears as soon as the field is focused to type a value.
    expect(html).toContain("[&amp;_input:focus::placeholder]:text-transparent");
  });
});
