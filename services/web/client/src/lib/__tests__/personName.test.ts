import { describe, expect, it } from "vitest";
import { cleanPersonName, getPersonNameIssue } from "@/lib/personName";

describe("FR-user-profile-keycloak — person name rules (client)", () => {
  it.each(["J", "Jean", "Élise", "Jean-Pierre", "O'Neil", "O’Neil", "de la Fontaine", "  Jean  "])(
    "nominal: accepts %p",
    (value) => expect(getPersonNameIssue(value)).toBeNull(),
  );

  it("edge: measures length after cleanup, 50 ok / 51 too long", () => {
    expect(getPersonNameIssue(`  ${"a".repeat(50)} `)).toBeNull();
    expect(getPersonNameIssue("a".repeat(51))).toBe("tooLong");
  });

  it("edge: cleans spaces, NFC and typographic apostrophes", () => {
    expect(cleanPersonName("  D’Arc   Jeanne ")).toBe("D'Arc Jeanne");
    expect(cleanPersonName("Amélie")).toBe("Amélie");
  });

  it.each([
    ["", "required"],
    ["   ", "required"],
    ["Jean2", "invalidCharacters"],
    ["J@ne", "invalidCharacters"],
    ["Jean--Pierre", "invalidCharacters"],
    ["-Jean", "invalidCharacters"],
  ])("failure: %p → %s", (value, issue) => {
    expect(getPersonNameIssue(value)).toBe(issue);
  });
});
