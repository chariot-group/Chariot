import { describe, expect, it } from "vitest";
import { addClassLevels, defaultHitDie, MAX_CLASSES } from "@/utils/multiclass.utils";

/** @see FR-character-general-bento-layout (Multiclass edit tabs) */
describe("addClassLevels", () => {
  it("nominal: uses a free level when class levels are below the global level", () => {
    const next = addClassLevels(4, [{ name: "Wizard", level: 3 }]);

    expect(next?.globalLevel).toBe(4);
    expect(next?.classes).toHaveLength(2);
    expect(next?.classes[1]).toMatchObject({ level: 1, hitDice: 0 });
  });

  it("edge: raises the global level when every level is allocated (multiclassing on level-up)", () => {
    const next = addClassLevels(3, [{ name: "Wizard", level: 3 }]);

    expect(next?.globalLevel).toBe(4);
    expect(next?.classes[0]).toMatchObject({ level: 3 });
  });

  it("edge: at level 20 takes the level from the highest class and caps its remaining hit dice", () => {
    const next = addClassLevels(20, [{ name: "Wizard", level: 20, hitDiceRemaining: 20 }]);

    expect(next?.globalLevel).toBe(20);
    expect(next?.classes[0]).toMatchObject({ level: 19, hitDiceRemaining: 19 });
    expect(next?.classes[1]).toMatchObject({ level: 1 });
  });

  it("failure: never adds a class past the maximum", () => {
    const two = [
      { name: "Wizard", level: 2 },
      { name: "Fighter", level: 1 },
    ];

    expect(two).toHaveLength(MAX_CLASSES);
    expect(addClassLevels(5, two)).toBeNull();
  });
});

describe("defaultHitDie", () => {
  it("nominal: maps classes to their hit die", () => {
    expect(defaultHitDie("Wizard")).toBe(6);
    expect(defaultHitDie("Barbarian")).toBe(12);
    expect(defaultHitDie("Fighter")).toBe(10);
    expect(defaultHitDie("Cleric")).toBe(8);
  });

  it("failure: no class gives no default", () => {
    expect(defaultHitDie(undefined)).toBeUndefined();
    expect(defaultHitDie("")).toBeUndefined();
  });
});
