import { describe, expect, it } from "vitest";
import { buildDuplicateName } from "@/components/dialogs/DuplicateCharacterDialog";

describe("FR-character-duplicate — DuplicateCharacterDialog — buildDuplicateName", () => {
  it("nominal: appends '2' after first and last name", () => {
    expect(buildDuplicateName({ firstname: "Aragorn", lastname: "Telcontar" })).toBe("Aragorn Telcontar 2");
  });

  it("nominal: appends '2' when only firstname is present", () => {
    expect(buildDuplicateName({ firstname: "Gimli", lastname: "" })).toBe("Gimli 2");
  });

  it("nominal: appends '2' when lastname is undefined", () => {
    expect(buildDuplicateName({ firstname: "Legolas" })).toBe("Legolas 2");
  });

  it("edge: trims whitespace from both parts before combining", () => {
    expect(buildDuplicateName({ firstname: "  Frodo  ", lastname: "  Baggins  " })).toBe("Frodo Baggins 2");
  });

  it("edge: returns '2' when character is null", () => {
    expect(buildDuplicateName(null)).toBe("2");
  });

  it("edge: returns '2' when firstname and lastname are both empty strings", () => {
    expect(buildDuplicateName({ firstname: "", lastname: "" })).toBe("2");
  });

  it("edge: returns '2' when firstname is only whitespace", () => {
    expect(buildDuplicateName({ firstname: "   ", lastname: "" })).toBe("2");
  });
});

describe("FR-character-duplicate — multi-copy naming", () => {
  const copyName = (base: string, i: number) => (i === 0 ? base : `${base} ${i + 1}`);

  it("nominal: first copy keeps name as-is", () => {
    expect(copyName("Goblin 2", 0)).toBe("Goblin 2");
  });

  it("nominal: subsequent copies append incremented suffix", () => {
    expect(copyName("Goblin 2", 1)).toBe("Goblin 2 2");
    expect(copyName("Goblin 2", 2)).toBe("Goblin 2 3");
  });

  it("edge: count=1 produces exactly one name", () => {
    const names = Array.from({ length: 1 }, (_, i) => copyName("Hero", i));
    expect(names).toEqual(["Hero"]);
  });

  it("edge: count=3 produces three distinct names", () => {
    const names = Array.from({ length: 3 }, (_, i) => copyName("Orc", i));
    expect(names).toEqual(["Orc", "Orc 2", "Orc 3"]);
  });
});
