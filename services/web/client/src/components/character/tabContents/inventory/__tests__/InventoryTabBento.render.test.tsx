import type { FieldValues } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CharacterInventoryView from "@/components/character/tabContents/inventory/view/CharacterInventoryView";
import CharacterInventoryTabEdit from "@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit";
import { INVENTORY_BENTO_GRID_CLASS } from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
import { directChildren, ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";
import type { Player } from "@/types/character";

const session = vi.hoisted(() => ({ inSession: false }));

vi.mock("@/store/hooks", () => ({ useAppSelector: () => session.inSession, useAppDispatch: () => vi.fn() }));
vi.mock("@/hooks/useActiveSessionCode", () => ({ useActiveSessionCode: () => undefined }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock("@/services/CharacterService", () => ({ default: { updateCharacter: vi.fn() } }));

const character = {
  _id: "p1",
  treasure: { pp: 2, gp: 1250, ep: 0, sp: 7, cp: 30, equipment: "Épée longue\nBouclier", treasure: "" },
} as unknown as Player;

const CASES = {
  view: () =>
    render(
      <CharacterInventoryView
        character={character}
        accentColor="text-yellow"
        onCharacterUpdate={vi.fn()}
      />,
    ),
  edit: () =>
    render(
      <WithForm values={character as unknown as FieldValues}>
        {(form) => (
          <CharacterInventoryTabEdit
            accentColor="text-yellow"
            form={form}
          />
        )}
      </WithForm>,
    ),
};

/** @see FR-character-inventory-bento-layout */
/** A tinted box (not a hover / open state): forbidden inside sheet cards, decision 2026-11-13. */
const TINTED_BOX = /(?<![:\w-])bg-gray-middle-light\/\d+/;

describe("Inventory tab — single bento grid", () => {
  beforeEach(() => {
    session.inSession = false;
  });

  for (const [name, renderCase] of Object.entries(CASES)) {
    it(`nominal: ${name} renders the three cards as direct children of one grid`, () => {
      const html = renderCase();
      const children = directChildren(html, INVENTORY_BENTO_GRID_CLASS);

      expect(html.split(INVENTORY_BENTO_GRID_CLASS)).toHaveLength(2);
      expect(children).toHaveLength(3);
      for (const child of children) {
        expect(child).toMatch(/col-span-\d/);
        expect(child).toContain('role="region"');
      }
    });

    it(`failure: ${name} has unique ids and resolvable aria-labelledby`, () => {
      const html = renderCase();
      const allIds = ids(html);

      expect(allIds.length - new Set(allIds).size).toBe(0);
      for (const ref of labelledBy(html)) expect(allIds).toContain(ref);
      for (const heading of ["coins-heading", "equipment-heading", "treasure-heading"])
        expect(allIds).toContain(heading);
      expect(html).not.toMatch(/\border-\d|h-fit/);
    });
  }

  it("nominal: read mode shows five coin cells in pp → cp order with full accessible values", () => {
    const html = CASES.view();
    const labels = [...html.matchAll(/role="group" aria-label="([^"]+)"/g)].map((m) => m[1]);

    expect(labels.slice(0, 5)).toEqual([
      "2 platinumPieces",
      "1 250 goldPieces",
      "0 electrumPieces",
      "7 silverPieces",
      "30 copperPieces",
    ]);
    expect(html).not.toContain('role="text"');
    expect(html).toContain("grid-cols-3");
    expect(html).toContain("@sm:grid-cols-5");
    // No delimiter, no vertical rule, no tinted box (decision 2026-11-13)
    expect(html).not.toContain("border-l");
    expect(html).not.toMatch(TINTED_BOX);
  });

  it("edge: a value ≥ 1 000 is abbreviated with the full value kept for assistive tech", () => {
    const html = CASES.view();

    expect(html).toContain(">1.2k<");
    expect(html).toContain('aria-label="1 250 goldPieces"');
  });

  it("edge: empty treasure shows the empty-state line, equipment text is bounded and keeps line breaks", () => {
    const html = CASES.view();

    expect(html).toContain("noTreasure");
    expect(html).toMatch(/max-h-\[28rem\][^"]*" role="group" aria-labelledby="equipment-heading" tabindex="0"/);
    expect(html).toContain("whitespace-pre-wrap");
  });

  it("edge: outside session coins are static; in session they are buttons opening the dialog", () => {
    const outside = CASES.view();

    expect(outside).not.toContain("editCoinAmountAria");
    expect(outside).not.toContain("editField");
    expect(outside).not.toMatch(/role="group" aria-label="[^"]+" tabindex/);

    session.inSession = true;
    const html = CASES.view();

    expect(html.match(/<button[^>]*aria-label="[^"]*editCoinAmountAria" aria-haspopup="dialog"/g)).toHaveLength(5);
    expect(html).toContain("hover:bg-gray-middle-light/50");
    expect(html).not.toMatch(TINTED_BOX);
    expect(html).toContain("editField");
  });

  it("nominal: edit mode has one labelled input per coin and visually hidden text labels", () => {
    const html = CASES.edit();

    for (const key of ["pp", "gp", "ep", "sp", "cp"]) expect(html).toContain(`for="inventory-${key}"`);
    expect(html).toMatch(/class="[^"]*sr-only[^"]*" for="inventory-equipment"|for="inventory-equipment"[^>]*sr-only/);
  });
});
