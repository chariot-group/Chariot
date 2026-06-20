import { describe, expect, it } from "vitest";
import { isSpellQueued, queuedSpellKeys, toggleSpellInQueue } from "@/lib/codexSpellQueue";

const fireball = { name: "Fireball", level: 3 };
const magicMissile = { name: "Magic Missile", level: 1 };

describe("codexSpellQueue", () => {
  it("nominal: adds a spell to an empty queue", () => {
    const next = toggleSpellInQueue([], "spell-1:en", fireball);
    expect(next).toEqual([{ key: "spell-1:en", spell: fireball }]);
  });

  it("edge: removes a spell when toggled twice", () => {
    const queued = toggleSpellInQueue([], "spell-1:en", fireball);
    const next = toggleSpellInQueue(queued, "spell-1:en", fireball);
    expect(next).toEqual([]);
  });

  it("edge: keeps distinct entries for the same spell in different languages", () => {
    const withEn = toggleSpellInQueue([], "spell-1:en", fireball);
    const withFr = toggleSpellInQueue(withEn, "spell-1:fr", { ...fireball, name: "Boule de feu" });

    expect(withFr).toHaveLength(2);
    expect(isSpellQueued(withFr, "spell-1:en")).toBe(true);
    expect(isSpellQueued(withFr, "spell-1:fr")).toBe(true);
    expect(queuedSpellKeys(withFr)).toEqual(new Set(["spell-1:en", "spell-1:fr"]));
  });

  it("nominal: supports multiple distinct spells", () => {
    const first = toggleSpellInQueue([], "spell-1:en", fireball);
    const second = toggleSpellInQueue(first, "spell-2:en", magicMissile);

    expect(second).toHaveLength(2);
    expect(isSpellQueued(second, "spell-2:en")).toBe(true);
  });
});
