import type { FieldValues, UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import CharacterMagicTabEdit from "@/components/character/tabContents/magic/form/CharacterMagicTabEdit";
import { MAGIC_BENTO_GRID_CLASS } from "@/components/character/tabContents/magic/shared/spellList";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";
import type { Character, Player } from "@/types/character";

vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({
      user: { user: { preferredMeasurementUnit: "imperial", showBothUnits: false } },
      session: { isInSession: false, battle: {}, initiativeTracker: { rows: [] } },
    }),
  useAppDispatch: () => vi.fn(),
}));
vi.mock("@/store/slices/sessionSlice", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  selectIsInSession: () => false,
  selectBattleStarted: () => false,
  selectCurrentRound: () => 0,
  selectInitiativeTrackerRows: () => [],
}));
vi.mock("@/hooks/useActiveSessionCode", () => ({ useActiveSessionCode: () => undefined }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock("@/hooks/useCodexHealth", () => ({ useCodexHealth: () => ({ isAvailable: true }) }));
vi.mock("@/services/CharacterService", () => ({ default: { updateCharacter: vi.fn() } }));
vi.mock("@/components/character/tabContents/magic/CodexSpellSearchDialog", () => ({ default: () => null }));

const player = {
  _id: "p1",
  kind: "player",
  class: [{ name: "Wizard", level: 5 }],
  stats: { proficiencyBonus: 3, abilityScores: { intelligence: 16 } },
  spellcasting: [
    {
      className: "Wizard",
      ability: "intelligence",
      saveDC: 14,
      attackBonus: 6,
      totalSlots: 0,
      spellSlotsByLevel: { "1": { total: 4, used: 1 }, "3": { total: 2, used: 0 } },
      spells: [
        {
          name: "Fireball",
          level: 3,
          school: "Evocation",
          castingTime: "1 action",
          range: "150 feet",
          duration: "Instantaneous",
          components: ["V", "S", "M"],
          description: "A bright streak.",
          effectType: "attack",
          damageDetails: [{ diceCount: 8, diceType: "d6", bonus: null, damageType: "fire" }],
          prepared: true,
        },
        {
          name: "Fire Bolt",
          level: 0,
          school: "Evocation",
          castingTime: "1 action",
          range: "120 feet",
          duration: "",
          components: [],
          description: "",
          effectType: "attack",
        },
        {
          name: "Shield",
          level: 1,
          school: "Abjuration",
          castingTime: "1 reaction",
          range: "Self",
          duration: "1 round",
          components: ["V", "S"],
          description: "",
          effectType: "utility",
          prepared: false,
        },
        {
          name: "Hold Person",
          level: 1,
          school: "Enchantment",
          castingTime: "1 action",
          range: "60 feet",
          duration: "Concentration, up to 1 minute",
          components: ["V"],
          description: "",
          effectType: "utility",
          prepared: true,
        },
      ],
    },
  ],
} as unknown as Player;

const CASES = {
  view: () =>
    render(
      <CharacterMagicView
        character={player}
        accentColor="pink"
      />,
    ),
  edit: () =>
    render(
      <WithForm values={player as unknown as FieldValues}>
        {(form) => (
          <CharacterMagicTabEdit
            character={player as Character}
            accentColor="pink"
            form={form as unknown as UseFormReturn<Character>}
          />
        )}
      </WithForm>,
    ),
};

/** @see FR-character-magic-list-card */
describe("Magic tab — bento grid and spell list card", () => {
  for (const [name, renderCase] of Object.entries(CASES)) {
    it(`nominal: ${name} renders the Spellcasting and Spells cards as children of one grid`, () => {
      const html = renderCase();
      const children = directChildren(html, MAGIC_BENTO_GRID_CLASS).filter((child) => child.includes('role="region"'));

      expect(children).toHaveLength(2);
      for (const child of children) {
        expect(child).toContain('role="region"');
        expect(child).toContain("xl:col-span-12");
      }
    });

    it(`nominal: ${name} groups the rows under level sub-headings (only non-empty levels)`, () => {
      const html = renderCase();
      const list = html.slice(html.lastIndexOf("xl:col-span-12"));
      const headers = list.match(/<h3[^>]*><span class="truncate">(cantrips|spellLevelShort)/g) ?? [];

      expect(headers).toHaveLength(3);
      expect(headers[0]).toContain("cantrips");
      expect(html).not.toContain("backToList");
    });

    it(`failure: ${name} has unique ids, resolvable labels, no positive tabindex and no card inside rows`, () => {
      const html = renderCase();
      const allIds = ids(html);
      const listCard = html.slice(html.lastIndexOf('data-slot="card"'));

      expect(allIds.length - new Set(allIds).size).toBe(0);
      for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
      expect(html).not.toMatch(/tabindex="[1-9]/);
      expect(listCard.slice(1).match(/data-slot="card"/g) ?? []).toHaveLength(0);
    });
  }

  it("nominal: collapsed read row shows school · casting time · range · damage", () => {
    const html = CASES.view();

    expect(html).toMatch(/Evocation<\/span>[\s\S]*1 action<\/span>[\s\S]*150 feet<\/span>[\s\S]*8d6 fire<\/span>/);
  });

  it("edge: compact spellcasting band holds the stat cells, slots live on the level headers", () => {
    const html = CASES.view();
    const band = html.slice(0, html.lastIndexOf('data-slot="card"'));
    const list = html.slice(html.lastIndexOf('data-slot="card"'));

    expect(band).toContain('aria-label="attackBonus +6"');
    expect(band).toContain('aria-label="saveDC 14"');
    expect(band).not.toContain("slotsRemainingAria");
    expect(list.match(/aria-label="slotsRemainingAria"/g)).toHaveLength(2);
    expect(list).toContain('aria-label="cantrips">∞');
  });

  it("nominal: edit mode puts the slot total input on each level header (level ≥ 1)", () => {
    const list = CASES.edit();

    expect(list.match(/aria-label="spellSlotsTotalForLevel"/g)).toHaveLength(2);
  });

  it("edge: concentration spells carry a text tag", () => {
    expect(CASES.view()).toContain(">concentration<");
  });

  it("nominal: edit mode shows « Add a spell » and « Codex » as visible buttons, not in a menu", () => {
    const html = CASES.edit();

    expect(html).toMatch(/<button[^>]*aria-label="addSpell"/);
    expect(html).toMatch(/<button[^>]*aria-label="addCodexSpell"/);
    expect(html).not.toContain("moreSpellOptions");
    expect(html.match(/aria-label="removeSpellWithName"/g)).toHaveLength(4);
  });

  it("nominal: the class selector is a grid child placed before the Spellcasting card", () => {
    const multiclass = {
      ...player,
      progression: {},
      class: [...player.class, { name: "Cleric", level: 3 }],
    } as unknown as Character;
    const html = render(
      <WithForm values={multiclass as unknown as FieldValues}>
        {(form) => (
          <CharacterMagicTabEdit
            character={multiclass}
            accentColor="pink"
            form={form as unknown as UseFormReturn<Character>}
          />
        )}
      </WithForm>,
    );
    const children = directChildren(html, MAGIC_BENTO_GRID_CLASS);

    expect(children[0]).toContain('role="group"');
    expect(children[0]).toContain('aria-label="spellcastingClass"');
    expect(children[1]).toContain('aria-labelledby="magic-spellcasting-heading"');
    expect(html.indexOf('aria-label="addSpellcasting"')).toBeLessThan(html.indexOf('id="magic-spellcasting-heading"'));
  });

  it("edge: a single block in read mode shows no class selector", () => {
    const html = CASES.view();

    expect(html).not.toContain('aria-label="spellcastingClass"');
    expect(html).not.toContain("aria-pressed");
  });

  it("edge: a Codex abbreviation (WIS) is shown as the translated ability, not a missing key", () => {
    const codexNpc = {
      ...player,
      spellcasting: [{ ...player.spellcasting[0], ability: "WIS" }],
    } as unknown as Player;
    const html = render(
      <CharacterMagicView
        character={codexNpc}
        accentColor="pink"
      />,
    );

    expect(html).toContain('aria-label="spellcastingAbility wisdom"');
    expect(html).not.toContain("WIS");
  });
});
