import type { FieldValues, UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import CharacterMagicTabEdit from "@/components/character/tabContents/magic/form/CharacterMagicTabEdit";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import { MAGIC_BENTO_GRID_CLASS } from "@/components/character/tabContents/magic/shared/spellList";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";
import type { Character, Player } from "@/types/character";
import type { MagicSelectionState } from "@/components/character/tabContents/magic/shared/useMagicSelection";

vi.mock("@/hooks/use-mobile", () => ({ useIsXlUp: () => true }));
vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({
      user: { user: { preferredMeasurementUnit: "imperial", showBothUnits: false } },
      session: { isInSession: false, battle: {}, initiativeTracker: { rows: [] } },
    }),
  useAppDispatch: () => vi.fn(),
}));
vi.mock("@/hooks/useActiveSessionCode", () => ({ useActiveSessionCode: () => undefined }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock("@/store/slices/sessionSlice", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  selectIsInSession: () => false,
  selectBattleStarted: () => false,
  selectCurrentRound: () => 0,
  selectInitiativeTrackerRows: () => [],
}));
vi.mock("@/hooks/useCodexHealth", () => ({ useCodexHealth: () => ({ isAvailable: true }) }));
vi.mock("@/components/character/tabContents/magic/CodexSpellSearchDialog", () => ({ default: () => null }));
vi.mock("@/services/CharacterService", () => ({ default: { updateCharacter: vi.fn() } }));

const wizard = (spells: unknown[]) =>
  ({
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
        spellSlotsByLevel: { "3": { total: 2, used: 0 } },
        spells,
      },
    ],
  }) as unknown as Player;

const SPELLS = [
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
    damageDetails: [
      { diceCount: 8, diceType: "d6", bonus: null, damageType: "feu" },
      { diceCount: 2, diceType: "d6", bonus: 1, damageType: "radiant" },
    ],
    prepared: true,
  },
  {
    name: "Fire Bolt",
    level: 0,
    school: "Evocation",
    castingTime: "1 action",
    range: "120 feet",
    description: "A mote of fire.",
    effectType: "attack",
  },
];

const renderView = (spells: unknown[]) =>
  render(
    <CharacterMagicView
      character={wizard(spells)}
      accentColor="pink"
    />,
  );

const renderEdit = (spells: unknown[]) => {
  const character = wizard(spells) as unknown as Character;
  return render(
    <WithForm values={character as unknown as FieldValues}>
      {(form) => (
        <CharacterMagicTabEdit
          character={character}
          accentColor="pink"
          form={form as unknown as UseFormReturn<Character>}
        />
      )}
    </WithForm>,
  );
};

/** Detail panel: the last card of the grid. */
const panelOf = (html: string) => html.slice(html.lastIndexOf('data-slot="card"'));

/** @see FR-character-magic-list-card (wide read mode) */
describe("Magic tab — wide read mode (xl)", () => {
  it("nominal: Spellcasting and Spells list share the 5-column left column, panel on 7 columns", () => {
    const children = directChildren(renderView(SPELLS), MAGIC_BENTO_GRID_CLASS);

    expect(children).toHaveLength(3);
    expect(children[0]).toContain('aria-labelledby="magic-spellcasting-heading"');
    expect(children[0]).toContain("xl:col-span-5");
    expect(children[1]).toContain("xl:col-span-5");
    expect(children[2]).toContain("xl:col-span-7");
    expect(children[2]).toContain("xl:row-span-2");
  });

  it("nominal: the first spell in display order (cantrip) is shown by default", () => {
    const html = renderView(SPELLS);
    const panel = html.slice(html.lastIndexOf('data-slot="card"'));

    expect(panel).toMatch(/<h2[^>]*>Fire Bolt<\/h2>/);
    expect(panel).toContain("A mote of fire.");
    expect(panel).not.toContain("A bright streak.");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it("nominal: traits come first as a definition list, the description in its own labelled section", () => {
    const html = renderView(SPELLS);
    const panel = html.slice(html.lastIndexOf('data-slot="card"'));

    expect(panel).toMatch(/<dt[^>]*>spellDetails.school<\/dt><dd[^>]*>Evocation<\/dd>/);
    expect(panel.indexOf("<dl")).toBeLessThan(panel.indexOf("spellDetails.description"));
    expect(panel.indexOf("spellDetails.description")).toBeLessThan(panel.indexOf("A mote of fire."));
  });

  it("edge: a spell without description shows no Description section", () => {
    const html = renderView([{ ...SPELLS[1], description: "" }]);

    expect(html).not.toContain("spellDetails.description");
    expect(html).toContain("<dl");
  });

  it("edge: rows are selectable buttons, no accordion and no expand / collapse all", () => {
    const html = renderView(SPELLS);

    expect(html.match(/<button[^>]*aria-pressed="(true|false)"/g)).toHaveLength(2);
    expect(html).not.toContain("expandAll");
    expect(html).not.toContain('data-slot="accordion');
  });

  it("failure: an empty block shows no detail panel", () => {
    const html = renderView([]);

    expect(directChildren(html, MAGIC_BENTO_GRID_CLASS)).toHaveLength(2);
    expect(html).toContain("noSpells");
  });

  it("failure: unique ids, resolvable labels and controls, no positive tabindex", () => {
    const html = renderView(SPELLS);
    const allIds = ids(html);

    expect(allIds.length - new Set(allIds).size).toBe(0);
    for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
    for (const [, ref] of html.matchAll(/aria-controls="([^"]+)"/g)) expect(allIds).toContain(ref);
    expect(html).not.toMatch(/tabindex="[1-9]/);
  });
});

/** @see FR-character-magic-list-card (effect cell) */
describe("Magic tab — damage and healing cells", () => {
  const fireball = [SPELLS[0]];

  it("nominal: first cell on its own full line, entries side by side, formula apart from its type", () => {
    const panel = panelOf(renderView(fireball));
    const grid = panel.slice(panel.indexOf("<dl"));

    expect(grid).toMatch(/^<dl[^>]*><div class="[^"]*basis-full[^"]*"><dt[^>]*>damage<\/dt><dd class="[^"]*flex-wrap/);
    expect(panel).toMatch(/>8d6<\/span><span[^>]*>Feu<\/span>/);
    expect(panel).toMatch(/>2d6\+1<\/span><span[^>]*>Radiant<\/span>/);
    expect(panel.indexOf(">8d6<")).toBeLessThan(panel.indexOf("spellDetails.school"));
  });

  it("edge: a legacy damage string is split into formula and type; healing shares the block", () => {
    const panel = panelOf(renderView([{ ...SPELLS[0], damageDetails: [], damage: "3d8+2 lightning", healing: "1d4" }]));

    expect(panel).toMatch(/>3d8\+2<\/span><span[^>]*>Lightning<\/span>/);
    expect(panel).toMatch(/<dt[^>]*>healing<\/dt>/);
    expect(panel).toContain(">1d4<");
  });

  it("failure: a spell without damage or healing shows no effect cell", () => {
    const panel = panelOf(renderView([SPELLS[1]]));

    expect(panel).not.toContain(">damage<");
    expect(panel).not.toContain(">healing<");
  });
});

/** @see FR-character-magic-list-card (wide edit mode) */
describe("Magic tab — wide edit mode (xl)", () => {
  it("nominal: Spellcasting and list on the left, the first spell's form in the right panel", () => {
    const html = renderEdit(SPELLS);
    const children = directChildren(html, MAGIC_BENTO_GRID_CLASS).filter((child) => child.includes('role="region"'));

    expect(children).toHaveLength(3);
    expect(children[0]).toContain("xl:col-span-5");
    expect(children[1]).toContain("xl:col-span-5");
    expect(children[2]).toContain("xl:col-span-7");
    expect(panelOf(html)).toMatch(/<h2[^>]*>Fire Bolt<\/h2>/);
  });

  it("edge: rows are selectable with their delete buttons, a single spell form is rendered", () => {
    const html = renderEdit(SPELLS);

    expect(html.match(/<button[^>]*aria-pressed="true"[^>]*aria-controls=/g)).toHaveLength(1);
    expect(html.match(/aria-controls=/g)).toHaveLength(2);
    expect(html.match(/aria-label="removeSpellWithName"/g)).toHaveLength(2);
    expect(html.match(/id="[^"]*-spell-\d+-name"/g)).toHaveLength(1);
    expect(html).not.toContain("expandAll");
  });

  it("failure: unique ids, resolvable labels and controls, no positive tabindex", () => {
    const html = renderEdit(SPELLS);
    const allIds = ids(html);

    expect(allIds.length - new Set(allIds).size).toBe(0);
    for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
    for (const [, ref] of html.matchAll(/aria-controls="([^"]+)"/g)) expect(allIds).toContain(ref);
    expect(html).not.toMatch(/tabindex="[1-9]/);
  });
});

/** @see FR-character-magic-list-card (damage / healing lines entered like action damage) */
describe("Magic tab — damage and healing form lines", () => {
  const fireball = [SPELLS[0]];

  it("nominal: each damage line is a dice formula field, then the type and delete, like action damage", () => {
    const html = renderEdit(fireball);

    expect(html).toMatch(/id="[^"]*-damage-0-dice"[^>]*value="8d6"/);
    expect(html).toMatch(/id="[^"]*-damage-1-dice"[^>]*value="2d6\+1"/);
    expect(html).toMatch(/-damage-0-dice"[\s\S]*-damage-0-type"[\s\S]*removeSpellDamage/);
    expect(html).toMatch(/-damage-0-dice"[^>]*role="combobox"|role="combobox"[^>]*-damage-0-dice"/);
    // No AUTO ability bonus on spells and no separate count / die / bonus fields.
    expect(html).not.toContain("AUTO");
    expect(html).not.toMatch(/-damage-0-(count|bonus)"/);
    // Dice, type and delete share one line on every width (no wrapping of the type).
    expect(html).toContain("grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]");
    expect(html).not.toContain("order-last col-span-full");
  });

  it("edge: healing uses the same dice field without a type; a damage entry without dice shows an empty field", () => {
    const html = renderEdit([
      {
        ...SPELLS[0],
        damageDetails: [{ diceCount: null, diceType: null, bonus: null, damageType: "feu" }],
        healingDetails: { diceCount: 2, diceType: "d8", bonus: -1 },
      },
    ]);

    expect(html).toMatch(/id="[^"]*-damage-0-dice"[^>]*value=""/);
    expect(html).toMatch(/id="[^"]*-healing-dice"[^>]*value="2d8-1"/);
    expect(html).not.toContain("-healing-type");
  });

  it("failure: every dice field keeps a visible label and shows no error before the user types", () => {
    const html = renderEdit(fireball);

    for (const field of ["damage-0-dice", "damage-1-dice", "healing-dice"]) {
      expect(html).toMatch(new RegExp(`<label for="[^"]*-${field}" class="[^"]*">diceFormula</label>`));
    }
    expect(html).not.toContain("invalidDiceFormula");
    expect(html).not.toMatch(/-dice"[^>]*aria-invalid="true"/);
  });
});

/** @see FR-character-magic-list-card (selection kept across read / edit) */
describe("Magic tab — selection shared between read and edit", () => {
  const keepFireball = () => [{ block: 0, spell: 0 }, vi.fn()] as MagicSelectionState;

  it("nominal: edit mode opens the spell selected in read mode, not the first one", () => {
    const character = wizard(SPELLS) as unknown as Character;
    const html = render(
      <WithForm values={character as unknown as FieldValues}>
        {(form) => (
          <CharacterMagicTabEdit
            character={character}
            accentColor="pink"
            form={form as unknown as UseFormReturn<Character>}
            selectionState={keepFireball()}
          />
        )}
      </WithForm>,
    );

    expect(panelOf(html)).toMatch(/<h2[^>]*>Fireball<\/h2>/);
  });

  it("edge: read mode shows the spell selected in edit mode", () => {
    const html = render(
      <CharacterMagicView
        character={wizard(SPELLS)}
        accentColor="pink"
        selectionState={keepFireball()}
      />,
    );

    expect(panelOf(html)).toMatch(/<h2[^>]*>Fireball<\/h2>/);
  });

  it("failure: a stale selection (removed spell, removed block) falls back to the first spell", () => {
    const html = render(
      <CharacterMagicView
        character={wizard(SPELLS)}
        accentColor="pink"
        selectionState={[{ block: 3, spell: 9 }, vi.fn()]}
      />,
    );

    expect(panelOf(html)).toMatch(/<h2[^>]*>Fire Bolt<\/h2>/);
  });
});

/** @see FR-character-magic-list-card (trait cells in wrapping lines) */
describe("Magic tab — trait lines of a spell", () => {
  const cellOf = (html: string, label: string) => {
    const grid = panelOf(html).slice(panelOf(html).indexOf("<dl"));
    return grid.match(new RegExp(`<div class="([^"]*)"><dt[^>]*>${label}<`))?.[1] ?? "";
  };

  it("nominal: short traits fill their lines; duration, components and healing share a line of their own", () => {
    const html = renderView([{ ...SPELLS[0], healing: "1d4", classes: ["wizard", "sorcerer"] }]);
    const panel = panelOf(html);
    const lists = [...panel.matchAll(/<dl[\s\S]*?<\/dl>/g)].map((match) => match[0]);

    expect(lists).toHaveLength(2);
    expect(lists[0]).toContain(">spellDetails.school<");
    expect(lists[0]).not.toContain(">spellDetails.duration<");
    expect(lists[1]).toMatch(
      />spellDetails.duration<[\s\S]*>spellDetails.components<[\s\S]*>healing<[\s\S]*>general.classes</,
    );
    for (const label of ["spellDetails.school", "spellDetails.duration", "spellDetails.components", "healing"]) {
      expect(cellOf(html, label)).toContain("flex-1");
    }
    expect(cellOf(html, "general.classes")).toContain("basis-full");
  });

  it("edge: without duration, components, healing or classes, only the first list is rendered", () => {
    const panel = panelOf(renderView([SPELLS[1]]));

    expect(panel.match(/<dl/g)).toHaveLength(1);
    expect(panel).toContain(">spellDetails.school<");
  });

  it("edge: many damage entries stay in one wrapping cell", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      diceCount: i + 1,
      diceType: "d6",
      bonus: null,
      damageType: `type${i}`,
    }));
    const html = renderView([{ ...SPELLS[0], damageDetails: many }]);

    expect(panelOf(html).match(/<dt[^>]*>damage<\/dt>/g)).toHaveLength(1);
    expect(panelOf(html).match(/>Type\d<\/span>/g)).toHaveLength(6);
  });

  it("failure: no fixed-column grid spans are left", () => {
    const panel = panelOf(renderView(SPELLS));
    const list = panel.slice(panel.indexOf("<dl"), panel.lastIndexOf("</dl>"));

    expect(list).not.toMatch(/col-span-(2|full)|grid-flow-row-dense/);
  });
});
