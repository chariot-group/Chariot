import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import type { Player } from "@/types/character";
import fr from "@/../messages/fr.json";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";

const session = vi.hoisted(() => ({ launched: true }));

vi.mock("@/store/hooks", () => ({ useAppSelector: () => session.launched, useAppDispatch: () => vi.fn() }));
vi.mock("@/components/character/tabContents/shared/Statistics", () => ({ default: () => null }));
vi.mock("@/components/character/tabContents/shared/AbilitiesSection", () => ({ default: () => null }));
vi.mock("@/components/character/tabContents/general/shared/SensesSection", () => ({ default: () => null }));

const abilityScores = { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 };

const playerWith = (inspiration: boolean) =>
  ({
    _id: "p1",
    firstname: "Aria",
    stats: {
      abilityScores,
      savingThrows: abilityScores,
      skills: {},
      masteries: {},
      proficiencyBonus: 2,
      passivePerception: 11,
      languages: [],
      tools: [],
      weapons: [],
      armors: [],
      senses: [],
    },
    profile: { race: "Elfe", subrace: "", alignment: "Neutral Good", history: "" },
    progression: { level: 3, experience: 900 },
    class: [],
    abilities: [],
    exhaustionLevel: 0,
    inspiration,
  }) as unknown as Player;

const render = (player: Player) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="fr"
      timeZone="UTC"
      messages={fr}
      onError={() => {}}>
      <PlayerGeneralTabContent
        player={player}
        accentColor="text-blue"
      />
    </NextIntlClientProvider>,
  );

/** The inspiration use button (static markup, node environment): visible text and accessible name, or `null`. */
const useButtonOf = (html: string) => {
  const match = [...html.matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)].find(([, attrs]) =>
    attrs.includes("inspiration"),
  );
  if (!match) return null;
  const label = /aria-label="([^"]*)"/.exec(match[1])?.[1].replaceAll("&#x27;", "'");
  return { text: match[2], label };
};

/** @see FR-character-general-bento-layout (compact tiles — inspiration use button) */
describe("Inspiration tile — use button in session", () => {
  it("nominal: shows a short visible label and keeps a full accessible name", () => {
    session.launched = true;
    const button = useButtonOf(render(playerWith(true)));

    expect(button).toEqual({ text: "Utiliser", label: "Utiliser le point d'inspiration" });
  });

  it("edge: without an inspiration point no use button is shown", () => {
    session.launched = true;

    expect(useButtonOf(render(playerWith(false)))).toBeNull();
  });

  it("edge: outside a session the tile shows the status, not the button", () => {
    session.launched = false;

    expect(useButtonOf(render(playerWith(true)))).toBeNull();
  });

  it("failure: every locale defines a short visible label distinct from the accessible name", () => {
    for (const messages of [fr, en, es]) {
      const general = messages.characterDetail.player.general;

      expect(general.inspirationUseButton.length).toBeLessThan(general.inspirationUseButtonLabel.length);
      expect(general.inspirationUseButton.split(" ")).toHaveLength(1);
    }
  });
});
