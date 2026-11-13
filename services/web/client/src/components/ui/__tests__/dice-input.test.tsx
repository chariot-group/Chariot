import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiceInput } from "@/components/ui/dice-input";
import { DiceHelp } from "@/components/ui/dice-help";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const noop = () => {};

/** @see FR-character-list-card (dice help and suggestions) */
describe("DiceInput / DiceHelp", () => {
  it("nominal: the dice field is a combobox that keeps the typed value", () => {
    const html = renderToStaticMarkup(
      <DiceInput
        id="dice"
        value="2d"
        onChange={noop}
        suggestionsLabel="Dice suggestions"
      />,
    );

    expect(html).toContain('id="dice"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain('value="2d"');
  });

  it("edge: the suggestions stay closed until the player types in the field", () => {
    const html = renderToStaticMarkup(
      <DiceInput
        id="dice"
        value="2d"
        onChange={noop}
        suggestionsLabel="Dice suggestions"
      />,
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="listbox"');
  });

  it("a11y: the help is a button with an explicit accessible name, not a hover-only tooltip", () => {
    const html = renderToStaticMarkup(<DiceHelp />);

    expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-label="diceHelpLabel"/);
    expect(html).toContain('aria-haspopup="dialog"');
  });
});
