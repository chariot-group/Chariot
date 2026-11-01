import type { FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import PlayerBattleTabContent from "@/components/character/tabContents/battle/view/PlayerBattleTabContent";
import NPCBattleTabContent from "@/components/character/tabContents/battle/view/NPCBattleTabContent";
import PlayerBattleTabEdit from "@/components/character/tabContents/battle/form/PlayerBattleTabEdit";
import NPCBattleTabEdit from "@/components/character/tabContents/battle/form/NPCBattleTabEdit";
import { BATTLE_BENTO_GRID_CLASS } from "@/components/character/tabContents/battle/shared/battleBentoLayout";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";
import type { NPC, Player } from "@/types/character";

/** Stub for sections covered by their own tests: renders one grid child carrying the slot classes. */
const { stubSection } = await vi.hoisted(async () => {
  const { createElement } = await import("react");
  return {
    stubSection:
      (name: string) =>
      ({ className, title, boundedList }: { className?: string; title?: string; boundedList?: boolean }) =>
        createElement("section", {
          "data-stub": name,
          "data-title": title,
          "data-bounded": boundedList ? "true" : undefined,
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
vi.mock("@/components/character/tabContents/battle/shared/ActionSection", () => ({ default: stubSection("actions") }));
vi.mock("@/components/character/tabContents/battle/shared/ActionUpdateSection", () => ({
  default: stubSection("actions"),
}));
vi.mock("@/components/ui/damage-type-tag-input", () => ({ DamageTypeTagInput: () => null }));

const stats = {
  abilityScores: { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 },
  savingThrows: { strength: 0, dexterity: 2, constitution: 1, intelligence: -1, wisdom: 1, charisma: 0 },
  proficiencyBonus: 2,
};
const noAffinities = { resistances: [], vulnerabilities: [], immunities: [] };

const player = {
  _id: "p1",
  stats,
  actions: [],
  abilities: [],
  affinities: { ...noAffinities, resistances: ["fire"] },
  deathSaves: { successes: 1, failures: 0 },
} as unknown as Player;

const npc = {
  _id: "n1",
  stats,
  actions: { standard: [], legendary: [], lair: [] },
  abilities: [],
  affinities: noAffinities,
} as unknown as NPC;

const CASES = {
  "player view": () =>
    render(
      <PlayerBattleTabContent
        player={player}
        accentColor="text-red"
      />,
    ),
  "npc view": () =>
    render(
      <NPCBattleTabContent
        npc={npc}
        accentColor="text-red"
      />,
    ),
  "player edit": () =>
    render(
      <WithForm values={player as unknown as FieldValues}>
        {(form) => (
          <PlayerBattleTabEdit
            player={player}
            accentColor="text-red"
            form={form}
          />
        )}
      </WithForm>,
    ),
  "npc edit": () =>
    render(
      <WithForm values={npc as unknown as FieldValues}>
        {(form) => (
          <NPCBattleTabEdit
            npc={npc}
            accentColor="text-red"
            form={form}
          />
        )}
      </WithForm>,
    ),
};

const EXPECTED_CARDS = { "player view": 6, "player edit": 6, "npc view": 7, "npc edit": 7 };

/** @see FR-character-battle-bento-layout */
describe("Combat tab — single bento grid", () => {
  for (const [name, renderCase] of Object.entries(CASES)) {
    it(`nominal: ${name} renders every card as a direct child of one grid`, () => {
      const html = renderCase();
      const children = directChildren(html, BATTLE_BENTO_GRID_CLASS);

      expect(html.split(BATTLE_BENTO_GRID_CLASS)).toHaveLength(2);
      expect(children).toHaveLength(EXPECTED_CARDS[name as keyof typeof EXPECTED_CARDS]);
      for (const child of children) expect(child).toMatch(/col-span-\d/);
    });

    it(`failure: ${name} has unique ids, resolvable aria-labelledby and actions before abilities`, () => {
      const html = renderCase();
      const allIds = ids(html);

      expect(allIds.length - new Set(allIds).size).toBe(0);
      for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
      expect(html.indexOf('data-stub="actions"')).toBeLessThan(html.indexOf('data-stub="abilities"'));
      expect(html).not.toMatch(/\border-\d/);
    });
  }

  it("edge: NPC keeps the three action sections (legendary and lair included) even when empty", () => {
    for (const name of ["npc view", "npc edit"] as const) {
      const html = CASES[name]();

      expect(html).toContain('data-title="actions"');
      expect(html).toContain('data-title="legendaryActions"');
      expect(html).toContain('data-title="lairActions"');
    }
  });

  it("edge: affinities show an explicit empty state when every list is empty", () => {
    expect(CASES["npc view"]()).toContain("noAffinities");
    expect(CASES["player view"]()).not.toContain("noAffinities");
    expect(CASES["player view"]()).toContain("fire");
  });

  it("nominal: value grids and stacks spread over the card height", () => {
    const html = CASES["player view"]();

    expect(html).toMatch(/grid flex-1 grid-cols-3 content-evenly/);
    expect(html).toMatch(/grid w-full flex-1 grid-cols-\[auto_1fr\] content-evenly/);
    expect(html).toMatch(/data-stub="statistics"[^>]*class="[^"]*justify-between/);
  });

  it("edge: affinity values start on the label line", () => {
    const html = CASES["player view"]();

    expect(html).toMatch(/<dt class="inline font-semibold">resistances :<\/dt> <dd class="inline">fire<\/dd>/);
  });

  it("nominal: in read mode every action list and the abilities list are bounded; edit mode never scrolls", () => {
    for (const name of ["player view", "npc view"] as const) {
      const html = CASES[name]();
      const lists = html.match(/data-stub="(actions|abilities)"[^>]*/g) ?? [];

      expect(lists.length).toBeGreaterThan(1);
      for (const list of lists) expect(list).toContain('data-bounded="true"');
    }
    for (const name of ["player edit", "npc edit"] as const) expect(CASES[name]()).not.toContain("data-bounded");
  });
});
