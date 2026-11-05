import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import { GENERAL_ABILITIES_LIST_MAX_HEIGHT_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";
import type { Ability } from "@/types/character";

vi.mock("@/store/hooks", () => ({ useAppSelector: () => false, useAppDispatch: () => vi.fn() }));
vi.mock("@/hooks/useActiveSessionCode", () => ({ useActiveSessionCode: () => undefined }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn() }) }));

const render = (abilities: Ability[], props: { boundedList?: boolean; boundedClassName?: string } = {}) =>
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
        {...props}
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

  it("edge: the bounded list height can be lowered (General tab cap overrides the shared one)", () => {
    const abilities = [{ name: "Darkvision", description: "See." } as Ability];
    const capped = render(abilities, { boundedList: true, boundedClassName: GENERAL_ABILITIES_LIST_MAX_HEIGHT_CLASS });

    expect(capped).toContain("max-h-[20rem]");
    expect(capped).not.toContain("max-h-[28rem]");
    expect(render(abilities, { boundedList: true })).toContain("max-h-[28rem]");
  });

  it("failure: abilities without counter show no counter summary", () => {
    expect(render([{ name: "Darkvision", description: "See." } as Ability])).not.toContain("abilityCounterShort");
  });
});
