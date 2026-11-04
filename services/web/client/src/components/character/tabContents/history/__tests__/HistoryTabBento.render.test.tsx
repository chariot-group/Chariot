import type { FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import CharacterHistoryView from "@/components/character/tabContents/history/view/CharacterHistoryView";
import CharacterHistoryTabEdit from "@/components/character/tabContents/history/form/CharacterHistoryTabEdit";
import { HISTORY_BENTO_GRID_CLASS } from "@/components/character/tabContents/history/shared/historyBentoLayout";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";
import type { Character } from "@/types/character";

vi.mock("@/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ user: { user: { preferredMeasurementUnit: "metric", showBothUnits: false } } }),
  useAppDispatch: () => vi.fn(),
}));

const LONG_EYES =
  "Pale silver-blue irises with a thin gold ring and a faint scar across the left eyelid from a winter campaign";

const character = {
  appearance: { eyes: LONG_EYES, age: 24, skin: "", height: 6, weight: null, hair: "Black", description: "" },
  background: {
    personalityTraits: "Curious\nLoyal",
    ideals: "Freedom",
    bonds: "",
    flaws: null,
    alliesAndOrgs: "Harpers",
    backstory: "Ruisseau-des-Lames-Oubliées-du-Nord-Lointain".repeat(3),
  },
  stats: { size: "Medium" },
} as unknown as Character;

const CASES = {
  view: () =>
    render(
      <CharacterHistoryView
        character={character}
        accentColor="text-green"
      />,
    ),
  edit: () =>
    render(
      <WithForm values={character as unknown as FieldValues}>
        {(form) => (
          <CharacterHistoryTabEdit
            accentColor="text-green"
            form={form}
          />
        )}
      </WithForm>,
    ),
};

/** Markup of the first card (Appearance), up to the opening tag of the second one. */
const appearanceCardOf = (html: string) => {
  const [, second] = directChildren(html, HISTORY_BENTO_GRID_CLASS);
  return html.slice(html.indexOf('aria-labelledby="history-appearance-heading"'), html.indexOf(second));
};

/** @see FR-character-history-bento-layout */
describe("History tab — single bento grid", () => {
  for (const [name, renderCase] of Object.entries(CASES)) {
    it(`nominal: ${name} renders the seven cards as direct children of one grid`, () => {
      const html = renderCase();
      const children = directChildren(html, HISTORY_BENTO_GRID_CLASS);

      expect(html.split(HISTORY_BENTO_GRID_CLASS)).toHaveLength(2);
      expect(children).toHaveLength(7);
      for (const child of children) {
        expect(child).toMatch(/col-span-\d/);
        expect(child).toContain('role="region"');
      }
    });

    it(`failure: ${name} has unique ids, resolvable labels, no positive tabindex, h-fit or role=main`, () => {
      const html = renderCase();
      const allIds = ids(html);

      expect(allIds.length - new Set(allIds).size).toBe(0);
      for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
      expect(html).not.toMatch(/tabindex="[1-9]/);
      expect(html).not.toMatch(/\bh-fit\b|\bself-start\b|role="main"|\border-\d/);
      expect(html).not.toContain("break-all");
    });
  }

  it("nominal: appearance cells carry an accessible label + value and the full size name", () => {
    const html = CASES.view();

    expect(html).toContain('aria-label="hair : Black"');
    expect(html).toContain("sizes.Medium");
    expect(html).not.toContain("sizesAbbr");
    expect(html).toMatch(/grid min-w-0 grid-cols-2 gap-2 @sm:grid-cols-3 @3xl:grid-cols-6/);
    expect(html).not.toContain("content-evenly");
  });

  it("edge: a long appearance value wraps without truncation; empty values show a dash", () => {
    const html = CASES.view();

    expect(html).toContain(LONG_EYES);
    expect(html).not.toContain("truncate");
    expect(html).toContain('aria-label="skin : notSpecified"');
    expect(html).toContain(">—<");
  });

  it("edge: empty text fields show the empty-state line, filled ones are bounded and keep line breaks", () => {
    const html = CASES.view();

    expect(html.match(/>notSpecified<\/p>/g)).toHaveLength(3);
    expect(html).toMatch(/<h3 id="history-description-heading"[^>]*>description<\/h3><p[^>]*>notSpecified<\/p>/);
    expect(html).toMatch(/max-h-\[28rem\][^"]*" role="group" aria-labelledby="history-personalityTraits-heading"/);
    expect(html).toMatch(/<p[^>]*whitespace-pre-wrap wrap-break-word[^>]*>Curious\nLoyal/);
  });

  it("nominal: edit mode labels every textarea and keeps single-line appearance inputs", () => {
    const html = CASES.edit();
    const textareas = [...html.matchAll(/<textarea[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

    expect(textareas).toHaveLength(7);
    expect(textareas).toContain("appearance-description");
    for (const id of textareas) expect(html).toContain(`for="${id}"`);
    for (const key of ["eyes", "age", "skin", "height", "weight", "hair"]) {
      expect(html).toMatch(new RegExp(`<input[^>]*id="appearance-${key}"`));
      expect(html).toContain(`for="appearance-${key}"`);
    }
  });

  it("nominal: the description lives inside the Appearance card, after the cells, bounded when long", () => {
    const withDescription = {
      ...character,
      appearance: { ...character.appearance, description: "Tall and lean.\nAlways wears a grey cloak." },
    } as unknown as Character;
    const html = render(
      <CharacterHistoryView
        character={withDescription}
        accentColor="text-green"
      />,
    );
    const appearanceCard = appearanceCardOf(html);

    expect(appearanceCard.indexOf('id="history-description-heading"')).toBeGreaterThan(
      appearanceCard.indexOf("hair : Black"),
    );
    expect(appearanceCard).toMatch(/max-h-\[28rem\][^"]*" role="group" aria-labelledby="history-description-heading"/);
    expect(html.match(/id="history-description-heading"/g)).toHaveLength(1);
  });

  it("edge: edit mode shows a visible description label inside the Appearance card", () => {
    const appearanceCard = appearanceCardOf(CASES.edit());

    expect(appearanceCard).toMatch(/<label[^>]*for="appearance-description"[^>]*>description<\/label>/);
    expect(appearanceCard).not.toMatch(/<label[^>]*sr-only[^>]*for="appearance-description"/);
  });
});
