import { describe, expect, it, vi } from "vitest";
import ProficiencyValue from "@/components/character/tabContents/general/shared/ProficiencyValue";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import type { NPC, Player } from "@/types/character";
import fr from "@/../messages/fr.json";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";

vi.mock("@/store/hooks", () => ({ useAppSelector: () => false, useAppDispatch: () => vi.fn() }));
vi.mock("@/components/character/tabContents/shared/Statistics", () => ({ default: () => null }));
vi.mock("@/components/character/tabContents/shared/NpcStatistics", () => ({ default: () => null }));
vi.mock("@/components/character/tabContents/shared/AbilitiesSection", () => ({ default: () => null }));

const abilityScores = { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 };
const stats = (lists: Partial<Record<"languages" | "tools" | "weapons" | "armors", string[]>>) => ({
  abilityScores,
  savingThrows: abilityScores,
  skills: {},
  masteries: {},
  proficiencyBonus: 2,
  passivePerception: 11,
  senses: [],
  languages: [],
  tools: [],
  weapons: [],
  armors: [],
  ...lists,
});

const proficienciesOf = (html: string) => html.slice(html.indexOf('aria-labelledby="proficiencies-heading"'));

/** @see FR-character-general-bento-layout (Proficiencies empty states, read mode) */
describe("Proficiencies card — empty states", () => {
  it("nominal: a filled list is joined by commas, without the empty text", () => {
    const html = render(
      <ProficiencyValue
        items={["Commun", "Elfique"]}
        emptyLabel="noLanguages"
      />,
    );

    expect(html).toContain("Commun, Elfique");
    expect(html).not.toContain("noLanguages");
  });

  it("edge: an empty, missing or blank list shows the muted empty text", () => {
    for (const items of [[], undefined, null, ["", "  "]]) {
      const html = render(
        <ProficiencyValue
          items={items}
          emptyLabel="noTools"
        />,
      );

      expect(html).toMatch(/<span class="[^"]*text-muted-foreground[^"]*">noTools<\/span>/);
    }
  });

  it("nominal: PC read mode shows one empty text per empty list, filled lists as text", () => {
    const player = { _id: "p1", stats: stats({ languages: ["Commun"] }), abilities: [], exhaustionLevel: 0 };
    const card = proficienciesOf(
      render(
        <PlayerGeneralTabContent
          player={player as unknown as Player}
          accentColor="text-blue"
        />,
      ),
    );

    expect(card).toContain("Commun");
    expect(card).not.toContain("noLanguages");
    for (const key of ["noTools", "noWeapons", "noArmors", "noSenses"]) expect(card).toContain(key);
  });

  it("nominal: NPC read mode shows the languages empty text", () => {
    const npc = { _id: "n1", stats: stats({}), abilities: [] };
    const card = proficienciesOf(
      render(
        <NpcGeneralTabContent
          npc={npc as unknown as NPC}
          accentColor="text-blue"
        />,
      ),
    );

    expect(card).toContain("noLanguages");
  });

  it("failure: every locale defines the four empty texts", () => {
    for (const messages of [fr, en, es]) {
      const general = messages.characterDetail.player.general as unknown as Record<string, string>;

      for (const key of ["noLanguages", "noTools", "noWeapons", "noArmors"])
        expect(general[key]?.length).toBeGreaterThan(5);
    }
  });
});
