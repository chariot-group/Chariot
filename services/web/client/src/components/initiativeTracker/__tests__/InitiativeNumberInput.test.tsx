import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));

import { InitiativeNumberInput } from "@/components/initiativeTracker/InitiativeNumberInput";

/** @see FR-tracker-initiative-modifier-display */
describe("FR-tracker-initiative-modifier-display — InitiativeNumberInput", () => {
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

    expect(html).toContain("+2");
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
});
