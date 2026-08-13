import { describe, expect, it } from "vitest";
import type { Spellcasting } from "@/types/character";
import {
  getSpellLevelsFromSpells,
  hasLevel1OrHigherSpells,
  pruneOrphanSpellSlotsByLevel,
  rebindSelectedSpellToList,
} from "@/utils/magic.utils";

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

/** @see FR-magic-spell-level-categories */
describe("getSpellLevelsFromSpells", () => {
  it("nominal: retourne les niveaux uniques triés présents dans la liste", () => {
    expect(
      getSpellLevelsFromSpells([
        { name: "Fireball", level: 3 },
        { name: "Fire Bolt", level: 0 },
        { name: "Counterspell", level: 3 },
      ]),
    ).toEqual([0, 3]);
  });

  it("edge: ignore les niveaux non numériques et retourne [] si vide", () => {
    expect(getSpellLevelsFromSpells([])).toEqual([]);
    expect(getSpellLevelsFromSpells(undefined)).toEqual([]);
    expect(getSpellLevelsFromSpells([{ name: "Bad", level: Number.NaN }])).toEqual([]);
  });
});

/** @see FR-magic-spell-level-categories */
describe("pruneOrphanSpellSlotsByLevel", () => {
  it("nominal: retire les emplacements sans sort restant à ce niveau", () => {
    expect(
      pruneOrphanSpellSlotsByLevel(
        {
          "1": { total: 4, used: 1 },
          "6": { total: 1, used: 0 },
        },
        [{ name: "Disintegrate", level: 6 }],
      ),
    ).toEqual({ "6": { total: 1, used: 0 } });
  });

  it("edge: conserve le niveau si un sort y reste ; retire les intermédiaires orphelins", () => {
    expect(
      pruneOrphanSpellSlotsByLevel(
        {
          "1": { total: 1, used: 0 },
          "2": { total: 1, used: 0 },
          "3": { total: 1, used: 0 },
          "6": { total: 1, used: 0 },
        },
        [
          { name: "Magic Missile", level: 1 },
          { name: "Disintegrate", level: 6 },
        ],
      ),
    ).toEqual({
      "1": { total: 1, used: 0 },
      "6": { total: 1, used: 0 },
    });
  });

  it("edge: retourne {} si plus aucun sort de niveau ≥ 1", () => {
    expect(
      pruneOrphanSpellSlotsByLevel(
        { "6": { total: 1, used: 0 } },
        [{ name: "Fire Bolt", level: 0 }],
      ),
    ).toEqual({});
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
