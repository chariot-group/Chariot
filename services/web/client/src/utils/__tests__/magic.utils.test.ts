import { describe, expect, it } from "vitest";
import type { Spellcasting } from "@/types/character";
import { hasLevel1OrHigherSpells, rebindSelectedSpellToList } from "@/utils/magic.utils";

const baseSpellcasting = (spells: Spellcasting["spells"]): Spellcasting => ({
  className: "wizard",
  ability: "intelligence",
  saveDC: 13,
  attackBonus: 5,
  spells,
});

describe("hasLevel1OrHigherSpells", () => {
  it("nominal: retourne true lorsqu’un sort de niveau 1+ est présent", () => {
    expect(
      hasLevel1OrHigherSpells(
        baseSpellcasting([
          { name: "Fire Bolt", level: 0 },
          { name: "Magic Missile", level: 1 },
        ]),
      ),
    ).toBe(true);
  });

  it("edge: retourne false avec uniquement des cantrips (niveau 0)", () => {
    expect(
      hasLevel1OrHigherSpells(
        baseSpellcasting([
          { name: "Fire Bolt", level: 0 },
          { name: "Prestidigitation", level: 0 },
        ]),
      ),
    ).toBe(false);
  });

  it("edge: retourne false lorsque la liste de sorts est vide", () => {
    expect(hasLevel1OrHigherSpells(baseSpellcasting([]))).toBe(false);
  });
});

describe("rebindSelectedSpellToList — conservation du sort sélectionné", () => {
  it("nominal: réattache le sort par nom et niveau après mise à jour des données", () => {
    const selected = { name: "Magic Missile", level: 1, prepared: true };
    const freshList = [
      { name: "Fire Bolt", level: 0 },
      { name: "Magic Missile", level: 1, prepared: true },
    ];
    const rebound = rebindSelectedSpellToList(freshList, selected);
    expect(rebound).toBe(freshList[1]);
    expect(rebound).not.toBe(selected);
  });

  it("edge: conserve la sélection si le sort n’est plus dans la liste", () => {
    const selected = { name: "Removed Spell", level: 2 };
    const rebound = rebindSelectedSpellToList([{ name: "Other", level: 1 }], selected);
    expect(rebound).toBe(selected);
  });

  it("edge: retourne null si aucun sort n’est sélectionné", () => {
    expect(rebindSelectedSpellToList([{ name: "X", level: 0 }], null)).toBeNull();
  });
});
