/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { isNpcGroupCharacter } from "@/lib/isNpcGroupCharacter";
import type { Character as GroupCharacter } from "@/types/campaign";

function baseCharacter(overrides: Partial<GroupCharacter> = {}): GroupCharacter {
  return {
    _id: "c1",
    firstname: "A",
    lastname: "B",
    surname: "",
    userId: "u1",
    ...overrides,
  };
}

describe("FR-character-sheet-pdf-export — isNpcGroupCharacter", () => {
  it("nominal: marks group NPC when challenge is present", () => {
    expect(isNpcGroupCharacter(baseCharacter({ challenge: { challengeRating: 1 } }))).toBe(true);
  });

  it("nominal: does not mark Player with progression as NPC", () => {
    expect(isNpcGroupCharacter(baseCharacter({ progression: { experience: 0 } }))).toBe(false);
  });

  it("edge: incomplete sidebar payload without challenge stays exportable", () => {
    expect(isNpcGroupCharacter(baseCharacter())).toBe(false);
  });
});
