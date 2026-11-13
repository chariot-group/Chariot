import { describe, expect, it, vi } from "vitest";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import SpellDetails from "@/components/character/tabContents/magic/shared/SpellDetails";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import type { Player, Spell } from "@/types/character";

const cast = vi.hoisted(() => ({ inSession: true }));

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
vi.mock("@/services/CharacterService", () => ({ default: { updateCharacter: vi.fn() } }));
/** Stub: the real controls render nothing out of session (same contract). */
vi.mock("@/components/character/tabContents/magic/SpellCastControls", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ selectedSpell }: { selectedSpell: Spell }) =>
      cast.inSession ? createElement("button", { "data-stub": "cast" }, `cast ${selectedSpell.name}`) : null,
  };
});

const FIRE_BOLT = {
  name: "Fire Bolt",
  level: 0,
  school: "Evocation",
  castingTime: "1 action",
  description: "A mote of fire.",
} as unknown as Spell;

const wizard = {
  _id: "p1",
  kind: "player",
  class: [{ name: "Wizard", level: 5 }],
  stats: { proficiencyBonus: 3, abilityScores: { intelligence: 16 } },
  spellcasting: [
    { className: "Wizard", ability: "intelligence", saveDC: 14, attackBonus: 6, totalSlots: 0, spells: [FIRE_BOLT] },
  ],
} as unknown as Player;

const renderView = (onCharacterUpdate?: () => void) =>
  render(
    <CharacterMagicView
      character={wizard}
      accentColor="pink"
      onCharacterUpdate={onCharacterUpdate}
    />,
  );

/** Detail panel: the last card of the grid. */
const panelOf = (html: string) => html.slice(html.lastIndexOf('data-slot="card"'));

/** @see FR-character-magic-list-card (in-session cast controls) */
describe("Spell cast controls — placement next to the spell name", () => {
  it("nominal: the wide panel shows the cast controls on its heading line, outside the scrolling details", () => {
    cast.inSession = true;
    const panel = panelOf(renderView(vi.fn()));
    const heading = panel.indexOf(">Fire Bolt</h2>");
    const button = panel.indexOf('data-stub="cast"');

    expect(panel.match(/data-stub="cast"/g)).toHaveLength(1);
    expect(heading).toBeGreaterThan(-1);
    expect(button).toBeGreaterThan(heading);
    expect(button).toBeLessThan(panel.indexOf('role="group"'));
  });

  it("nominal: an expanded row shows the cast controls first, right-aligned, before the traits", () => {
    cast.inSession = true;
    const html = render(
      <SpellDetails
        spell={FIRE_BOLT}
        castControls={<button data-stub="cast">cast</button>}
      />,
    );

    expect(html.indexOf('data-stub="cast"')).toBeLessThan(html.indexOf("<dl"));
    expect(html).toMatch(/<div class="[^"]*justify-end[^"]*"><button data-stub="cast"/);
  });

  it("edge: out of session the wrappers are empty and hidden, so no gap is left", () => {
    cast.inSession = false;
    const panel = panelOf(renderView(vi.fn()));

    expect(panel).not.toContain('data-stub="cast"');
    expect(panel).toMatch(/<div class="shrink-0 empty:hidden"><\/div>/);
  });

  it("failure: without an update handler no cast controls are rendered", () => {
    cast.inSession = true;
    const panel = panelOf(renderView());

    expect(panel).not.toContain('data-stub="cast"');
    expect(panel).not.toContain("shrink-0 empty:hidden");
  });
});
