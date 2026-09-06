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

  it("nominal: increments past an existing copy", () => {
    expect(
      buildDuplicateName({ firstname: "test" }, ["test", "test 2"]),
    ).toBe("test 3");
  });

  it("nominal: duplicating a copy continues the stem sequence", () => {
    expect(
      buildDuplicateName({ firstname: "test 2" }, ["test", "test 2"]),
    ).toBe("test 3");
  });
});
