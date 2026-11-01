import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import PlayerGeneralTabContent from "@/components/character/tabContents/general/view/PlayerGeneralTabContent";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import PlayerGeneralTabEdit from "@/components/character/tabContents/general/form/PlayerGeneralTabEdit";
import NpcGeneralTabEdit from "@/components/character/tabContents/general/form/NpcGeneralTabEdit";
import { GENERAL_BENTO_GRID_CLASS } from "@/components/character/tabContents/general/shared/generalBentoLayout";
import type { NPC, Player } from "@/types/character";

/** Stub for sections covered by their own tests: renders one grid child carrying the slot classes. */
const { stubSection } = await vi.hoisted(async () => {
  const { createElement } = await import("react");
  return {
    stubSection:
      (name: string) =>
      ({ className, boundedList }: { className?: string; boundedList?: boolean }) =>
        createElement("section", { "data-stub": name, "data-bounded": boundedList ? "true" : undefined, className }),
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

const render = (ui: ReactElement) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}>
      {ui}
    </NextIntlClientProvider>,
  );

function WithForm({
  values,
  children,
}: {
  values: FieldValues;
  children: (form: UseFormReturn<FieldValues>) => ReactElement;
}) {
  const form = useForm<FieldValues>({ defaultValues: values });
  return children(form);
}

const VOID_TAGS = new Set(["img", "input", "br", "hr", "meta", "link", "source", "area", "col", "wbr"]);

/** Opening tags of the direct children of the first element carrying `rootMarker`. */
const directChildren = (html: string, rootMarker: string) => {
  const start = html.indexOf(rootMarker);
  const tagRe = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
  tagRe.lastIndex = html.lastIndexOf("<", start);
  const children: string[] = [];
  let depth = 0;
  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    const [tag, closing, name, , selfClosing] = m;
    if (closing) {
      depth--;
      if (depth === 0) break;
      continue;
    }
    if (depth === 1) children.push(tag);
    if (!selfClosing && !VOID_TAGS.has(name.toLowerCase())) depth++;
  }
  return children;
};

const ids = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const labelledBy = (html: string) => [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);

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

const EXPECTED_CARDS = { "player view": 13, "player edit": 13, "npc view": 9, "npc edit": 9 };

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
      "proficiency-bonus-heading",
      "passive-perception-heading",
      "inspiration-heading",
      "exhaustion-heading",
      "characteristics-heading",
    ].map((id) => html.indexOf(`id="${id}"`));

    expect(order.every((pos) => pos > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
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

      expect(after("character-heading")).toMatch(/^[^]*?<dl class="flex flex-1 flex-col justify-between/);
      expect(after("proficiencies-heading")).toMatch(/^[^]*?<dl class="flex flex-1 flex-col justify-between/);
      expect(after("skills-heading")).toMatch(/^[^]*?class="grid flex-1 content-between/);
      expect(html).toMatch(/data-stub="statistics" class="[^"]*justify-between/);
    }
  });

  it("edge: only the read-mode abilities list is bounded (scrolls inside its card)", () => {
    expect(CASES["player view"]()).toContain('data-stub="abilities" data-bounded="true"');
    expect(CASES["npc view"]()).toContain('data-stub="abilities" data-bounded="true"');
    expect(CASES["player edit"]()).not.toContain("data-bounded");
    expect(CASES["npc edit"]()).not.toContain("data-bounded");
  });
});
