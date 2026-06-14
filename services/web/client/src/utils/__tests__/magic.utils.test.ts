import { describe, expect, it } from "vitest";
import type { Spellcasting } from "@/types/character";
import { hasLevel1OrHigherSpells } from "@/utils/magic.utils";

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
