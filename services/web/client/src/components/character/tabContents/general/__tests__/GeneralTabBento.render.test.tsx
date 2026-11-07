import type { FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import PlayerGeneralTabEdit from "@/components/character/tabContents/general/form/PlayerGeneralTabEdit";
import NpcGeneralTabEdit from "@/components/character/tabContents/general/form/NpcGeneralTabEdit";
import {
  GENERAL_BENTO_CONTAINER_CLASS,
  GENERAL_BENTO_GRID_CLASS,
} from "@/components/character/tabContents/general/shared/generalBentoLayout";
import type { NPC, Player } from "@/types/character";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";

/** Stub for sections covered by their own tests: renders one grid child carrying the slot classes. */
const { stubSection } = await vi.hoisted(async () => {
  const { createElement } = await import("react");
  return {
    stubSection:
      (name: string) =>
      ({
        className,
        boundedList,
        boundedClassName,
      }: {
        className?: string;
        boundedList?: boolean;
        boundedClassName?: string;
      }) =>
        createElement("section", {
          "data-stub": name,
          "data-bounded": boundedList ? "true" : undefined,
          "data-bounded-class": boundedClassName,
          className,
        }),
  };
});

vi.mock("@/store/hooks", () => ({ useAppSelector: () => false, useAppDispatch: () => vi.fn() }));
vi.mock("@/components/character/tabContents/shared/Statistics", () => ({ default: stubSection("statistics") }));
vi.mock("@/components/character/tabContents/shared/NpcStatistics", () => ({ default: stubSection("statistics") }));
vi.mock("@/components/character/tabContents/shared/StatisticsUpdate", () => ({ default: stubSection("statistics") }));
vi.mock("@/components/character/tabContents/shared/NpcStatisticsUpdate", () => ({
  default: stubSection("statistics"),
}));
vi.mock("@/components/character/tabContents/shared/AbilitiesSection", () => ({ default: stubSection("abilities") }));
vi.mock("@/components/character/tabContents/shared/AbilitiesUpdateSection", () => ({
  default: stubSection("abilities"),
}));
vi.mock("@/components/character/tabContents/general/shared/SensesSection", () => ({ default: () => null }));
vi.mock("@/components/character/tabContents/general/shared/SensesUpdateSection", () => ({ default: () => null }));
vi.mock("@/components/ui/tag-input", () => ({ TagInput: () => null }));
vi.mock("@/components/ui/combobox-input", () => ({ ComboboxInput: () => null }));

const abilityScores = { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 };
const savingThrows = { strength: 0, dexterity: 2, constitution: 1, intelligence: -1, wisdom: 1, charisma: 0 };

const stats = {
  abilityScores,
  savingThrows,
  skills: {},
  masteries: {},
  proficiencyBonus: 2,
  passivePerception: 11,
  languages: ["Commun"],
  tools: [],
  weapons: [],
  armors: [],
  senses: [],
};

const player = {
  _id: "p1",
  firstname: "Aria",
  stats,
  profile: { race: "Elfe", subrace: "", alignment: "Neutral Good", history: "Acolyte" },
  progression: { level: 3, experience: 900 },
  class: [{ name: "Wizard", level: 3, subclass: "Évocation", hitDice: 6 }],
  abilities: [],
  exhaustionLevel: 0,
  inspiration: false,
} as unknown as Player;

const npc = {
  _id: "n1",
  firstname: "Gobelin",
  stats,
  profile: { type: "Humanoïde", subtype: "", alignment: "Neutral Evil" },
  challenge: { challengeRating: 0.25, experiencePoints: 50 },
  abilities: [],
} as unknown as NPC;

const CASES = {
  "player view": () =>
    render(
      <PlayerGeneralTabContent
        player={player}
        accentColor="text-blue"
      />,
    ),
  "npc view": () =>
    render(
      <NpcGeneralTabContent
        npc={npc}
        accentColor="text-blue"
      />,
    ),
  "player edit": () =>
    render(
      <WithForm values={player as unknown as FieldValues}>
        {(form) => (
          <PlayerGeneralTabEdit
            player={player}
            accentColor="text-blue"
            form={form}
          />
        )}
      </WithForm>,
    ),
  "npc edit": () =>
    render(
      <WithForm values={npc as unknown as FieldValues}>
        {(form) => (
          <NpcGeneralTabEdit
            npc={npc}
            accentColor="text-blue"
            form={form}
          />
        )}
      </WithForm>,
    ),
};

const EXPECTED_CARDS = { "player view": 11, "player edit": 11, "npc view": 7, "npc edit": 7 };

/** @see FR-character-general-bento-layout */
describe("General tab — single bento grid", () => {
  for (const [name, renderCase] of Object.entries(CASES)) {
    it(`nominal: ${name} renders every card as a direct child of one grid`, () => {
      const html = renderCase();
      const children = directChildren(html, GENERAL_BENTO_GRID_CLASS);

      expect(html.split(GENERAL_BENTO_GRID_CLASS)).toHaveLength(2);
      expect(children).toHaveLength(EXPECTED_CARDS[name as keyof typeof EXPECTED_CARDS]);
      for (const child of children) expect(child).toMatch(/col-span-\d/);
    });

    it(`nominal: ${name} wraps the grid in a query container, so the sidebar width is taken into account`, () => {
      const html = renderCase();
      const outerClass = html.match(/<div class="([^"]*)"/)?.[1] ?? "";

      expect(outerClass.startsWith(GENERAL_BENTO_CONTAINER_CLASS)).toBe(true);
      expect(html.indexOf(`class="${GENERAL_BENTO_GRID_CLASS}"`)).toBeGreaterThan(html.indexOf(outerClass));
    });

    it(`failure: ${name} has unique ids and every aria-labelledby resolves`, () => {
      const html = renderCase();
      const allIds = ids(html);

      expect(allIds.length - new Set(allIds).size).toBe(0);
      for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
    });
  }

  it("edge: player edit renders the proficiency bonus input once (no mobile/desktop duplicate)", () => {
    const html = CASES["player edit"]();

    expect(html.match(/id="proficiency-bonus"/g)).toHaveLength(1);
    expect(html.match(/id="skills-heading-edit"/g)).toHaveLength(1);
  });

  it("edge: player view shows the four compact tiles before the ability scores", () => {
    const html = CASES["player view"]();
    const order = [
      "passive-perception-heading",
      "inspiration-heading",
      "exhaustion-heading",
      "proficiency-bonus-heading",
      "characteristics-heading",
    ].map((id) => html.indexOf(`id="${id}"`));

    expect(order.every((pos) => pos > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("nominal: PC and NPC view and edit render skills, then ability scores, then saving throws (GM constraint)", () => {
    const orders = {
      "player view": ["skills-heading", "characteristics-heading", "saving-throws-heading", "proficiencies-heading"],
      "player edit": [
        "skills-heading-edit",
        "character-characteristics-edit",
        "character-savingthrows-edit",
        "character-proficiencies-edit",
      ],
      "npc view": ["skills-heading", "characteristics-heading", "saving-throws-heading", "proficiencies-heading"],
      "npc edit": [
        "skills-heading-edit",
        "character-characteristics-edit",
        "character-savingthrows-edit",
        "character-proficiencies-edit",
      ],
    } as const;
    for (const [name, headingIds] of Object.entries(orders)) {
      const html = CASES[name as keyof typeof CASES]();
      const positions = headingIds.map((id) => html.indexOf(`id="${id}"`));

      expect(
        positions.every((pos) => pos > 0),
        name,
      ).toBe(true);
      expect(
        [...positions].sort((a, b) => a - b),
        name,
      ).toEqual(positions);
    }
  });

  it("edge: abilities and traits come after the saving throws and before the proficiencies (skills band)", () => {
    const ids = {
      "player view": ["saving-throws-heading", "proficiencies-heading"],
      "player edit": ["character-savingthrows-edit", "character-proficiencies-edit"],
      "npc view": ["saving-throws-heading", "proficiencies-heading"],
      "npc edit": ["character-savingthrows-edit", "character-proficiencies-edit"],
    } as const;
    for (const [name, [scoresId, savesId]] of Object.entries(ids)) {
      const html = CASES[name as keyof typeof CASES]();
      const abilities = html.indexOf('data-stub="abilities"');

      expect(html.match(/data-stub="abilities"/g), name).toHaveLength(1);
      expect(abilities, name).toBeGreaterThan(html.indexOf(`id="${scoresId}"`));
      expect(abilities, name).toBeLessThan(html.indexOf(`id="${savesId}"`));
      expect(html.indexOf(`id="${scoresId}"`), name).toBeGreaterThan(-1);
    }
  });

  it("nominal: in read mode the abilities list is capped lower than the shared bounded height", () => {
    for (const name of ["player view", "npc view"] as const) {
      expect(CASES[name](), name).toMatch(
        /data-stub="abilities"[^>]*data-bounded="true"[^>]*data-bounded-class="[^"]*max-h-\[var\(--abilities-rows-max,20rem\)\][^"]*"/,
      );
    }
  });

  it("edge: edit mode keeps the same abilities cap as read mode (the sheet does not grow on edit)", () => {
    for (const name of ["player edit", "npc edit"] as const) {
      const html = CASES[name]();

      expect(html, name).toMatch(/data-stub="abilities"[^>]*data-bounded-class="[^"]*max-h-\[var\(--abilities-rows-max,20rem\)\][^"]*"/);
      expect(html, name).not.toContain("max-h-[min(40rem,70dvh)]");
    }
  });

  it("failure: player view keeps every compact tile before the abilities", () => {
    const html = CASES["player view"]();

    expect(html.indexOf('id="exhaustion-heading"')).toBeGreaterThan(0);
    expect(html.indexOf('id="exhaustion-heading"')).toBeLessThan(html.indexOf('data-stub="abilities"'));
  });

  it("nominal: alignment and background are identity cells, NPC passive perception a statistics cell (no side tiles)", () => {
    const player = CASES["player view"]();
    const npcHtml = CASES["npc view"]();
    const identity = (html: string) =>
      html.slice(html.indexOf('id="character-heading"'), html.indexOf('data-stub="statistics"'));

    for (const id of [
      "alignment-heading",
      "background-heading",
      'passive-perception-heading"[^>]*>passivePerception<',
    ]) {
      expect(npcHtml).not.toMatch(new RegExp(`id="${id}`));
    }
    expect(player).not.toContain('id="alignment-heading"');
    expect(player).not.toContain('id="background-heading"');
    expect(identity(player)).toContain(">alignment</dt>");
    expect(identity(player)).toContain(">background</dt>");
    expect(identity(player)).toContain("Acolyte");
    expect(identity(npcHtml)).toContain(">alignment</dt>");
  });

  it("edge: edit mode moves alignment / background into the character card and NPC passive perception into the statistics card", () => {
    const playerEdit = CASES["player edit"]();
    const npcEdit = CASES["npc edit"]();
    const characterCard = (html: string) =>
      html.slice(html.indexOf('aria-labelledby="character-profile-edit"'), html.indexOf('data-stub="statistics"'));

    expect(characterCard(playerEdit)).toContain('id="alignment"');
    expect(characterCard(playerEdit)).toContain('for="background"');
    expect(characterCard(npcEdit)).toContain('id="alignment"');
    expect(playerEdit).not.toContain('id="alignment-heading-edit"');
    expect(npcEdit).not.toContain('id="passive-perception-heading-edit"');
    expect(npcEdit.match(/id="alignment"/g)).toHaveLength(1);
  });

  it("nominal: PC edit shows alignment and background before the classes", () => {
    const html = CASES["player edit"]();
    const positions = ['id="alignment"', 'for="background"', 'id="class-name-0"'].map((needle) => html.indexOf(needle));

    expect(positions.every((pos) => pos > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("nominal: fixed-content cards spread their grid over the card height (no blank bottom)", () => {
    for (const name of ["player view", "npc view"] as const) {
      const html = CASES[name]();
      for (const headingId of ["characteristics-heading", "saving-throws-heading"]) {
        const card = html.slice(html.indexOf(`id="${headingId}"`));
        expect(card.slice(0, card.indexOf('role="list"') + 200)).toMatch(/grid flex-1 content-evenly/);
      }
    }
  });

  it("nominal: lists and label/value stacks spread over the card height (no blank area under the content)", () => {
    for (const name of ["player view", "npc view"] as const) {
      const html = CASES[name]();
      const after = (headingId: string) => html.slice(html.indexOf(`id="${headingId}"`));

      expect(html).toMatch(/aria-labelledby="character-heading"[^>]*><div class="flex flex-1 flex-col justify-between/);
      expect(after("proficiencies-heading")).toMatch(
        /^[^]*?<dl class="grid flex-1 content-start gap-x-6 gap-y-3 @lg:grid-cols-2/,
      );
      expect(after("skills-heading")).toMatch(/^[^]*?class="grid flex-1 content-between/);
      expect(html).toMatch(/data-stub="statistics" class="[^"]*justify-between/);
    }
  });

  it("edge: read mode opts into the bounded list; the edit section is always bounded by itself", () => {
    expect(CASES["player view"]()).toContain('data-stub="abilities" data-bounded="true"');
    expect(CASES["npc view"]()).toContain('data-stub="abilities" data-bounded="true"');
    expect(CASES["player edit"]()).not.toContain('data-bounded="');
    expect(CASES["npc edit"]()).not.toContain('data-bounded="');
  });

  it("nominal: PC and NPC « Personnage » edit cards share the same name layout (first/last name side by side, nickname below)", () => {
    const nameBlock = (html: string) => {
      const start = html.lastIndexOf(
        '<div class="grid grid-cols-1 gap-3 @sm:grid-cols-2">',
        html.indexOf('id="character-firstname"'),
      );
      // Same structure regardless of the field values
      return html.slice(start, html.indexOf('id="character-surname"', start)).replace(/ value="[^"]*"/g, "");
    };
    const player = nameBlock(CASES["player edit"]());
    const npc = nameBlock(CASES["npc edit"]());

    expect(player).toContain('for="character-lastname"');
    expect(player).toMatch(/@sm:col-span-2[^>]*>\s*<label[^>]*for="character-surname"/);
    expect(npc).toEqual(player);
  });

  it("edge: in edit mode the name fields sit next to the avatar, under the card heading", () => {
    for (const name of ["player edit", "npc edit"] as const) {
      const html = CASES[name]();
      const heading = html.indexOf('id="character-profile-edit"');
      const column = html.lastIndexOf('<div class="@container flex min-w-0 flex-1 flex-col gap-3">', heading);

      expect(column).toBeGreaterThan(-1);
      expect(html.indexOf('id="character-surname"')).toBeGreaterThan(heading);
    }
  });
});
