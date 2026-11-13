import { describe, expect, it } from "vitest";
import { filterCompanionsByQuery, normalizeCompanionSearchText } from "@/lib/companionSearch";
import type { NPC } from "@/types/character";

const npc = (id: string, firstname: string, lastname = "", surname = "") =>
  ({ _id: id, firstname, lastname, surname }) as unknown as NPC;

const list = [npc("1", "Éléonore", "Brisval", "La Pie"), npc("2", "Grimm", "", "Croc"), npc("3", "Loup", "gris")];

/** @see FR-npc-player-link — Companions tab search */
describe("filterCompanionsByQuery", () => {
  it("nominal: matches the display name, ignoring case and diacritics", () => {
    expect(filterCompanionsByQuery(list, "eleo").map((c) => c._id)).toEqual(["1"]);
    expect(filterCompanionsByQuery(list, "GRIS").map((c) => c._id)).toEqual(["3"]);
  });

  it("nominal: matches the nickname and keeps the input order", () => {
    expect(filterCompanionsByQuery(list, "croc").map((c) => c._id)).toEqual(["2"]);
    expect(filterCompanionsByQuery(list, "r").map((c) => c._id)).toEqual(["1", "2", "3"]);
  });

  it("edge: a blank query returns the full list", () => {
    expect(filterCompanionsByQuery(list, "   ")).toBe(list);
  });

  it("edge: no match returns an empty list", () => {
    expect(filterCompanionsByQuery(list, "dragon")).toEqual([]);
  });

  it("failure: tolerates a missing nickname or last name", () => {
    const partial = [{ _id: "4", firstname: "Pip" } as unknown as NPC];
    expect(filterCompanionsByQuery(partial, "pip")).toHaveLength(1);
    expect(filterCompanionsByQuery(partial, "x")).toHaveLength(0);
  });

  it("normalizes diacritics and whitespace", () => {
    expect(normalizeCompanionSearchText("  Éçà ")).toBe("eca");
  });
});
