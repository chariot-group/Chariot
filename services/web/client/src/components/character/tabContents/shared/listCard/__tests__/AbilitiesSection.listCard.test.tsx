import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import type { Ability } from "@/types/character";

vi.mock("@/store/hooks", () => ({ useAppSelector: () => false, useAppDispatch: () => vi.fn() }));
vi.mock("@/hooks/useActiveSessionCode", () => ({ useActiveSessionCode: () => undefined }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn() }) }));

const render = (abilities: Ability[]) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}>
      <AbilitiesSection
        abilities={abilities}
        accentColor="text-red"
        title="Abilities"
        headingId="abilities-heading"
        characterId="c1"
        characterKind="players"
      />
    </NextIntlClientProvider>,
  );

/** @see FR-character-list-card, FR-character-ability-counter-display */
describe("AbilitiesSection — list card rows", () => {
  it("nominal: same list card as actions, collapsed row shows remaining uses", () => {
    const html = render([
      { name: "Second wind", description: "Heal.", hasCounter: true, counterMax: 3, counterCurrent: 1 } as Ability,
    ]);

    expect(html.match(/data-slot="card"/g)).toHaveLength(1);
    expect(html).toContain("Second wind");
    expect(html).toContain("abilityCounterShort");
  });

  it("edge: an empty list keeps the heading and shows the empty-state line", () => {
    const html = render([]);

    expect(html).toContain('id="abilities-heading"');
    expect(html).toContain("noAbilities");
  });

  it("failure: abilities without counter show no counter summary", () => {
    expect(render([{ name: "Darkvision", description: "See." } as Ability])).not.toContain("abilityCounterShort");
  });
});
