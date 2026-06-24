import { describe, expect, it } from "vitest";
import characterReducer, {
  clearCharacters,
  fetchCharactersWithoutGroupSuccess,
  upsertCharacterWithoutGroup,
} from "@/store/slices/characterSlice";
import type { Character } from "@/types/character";

const buildCharacter = (overrides: Partial<Character> & { _id: string }): Character =>
  ({
    _id: overrides._id,
    firstname: overrides.firstname ?? "Hero",
    lastname: overrides.lastname ?? "",
    surname: overrides.surname ?? "",
    avatar: "",
    stats: {} as Character["stats"],
    affinities: { resistances: [], immunities: [], vulnerabilities: [] },
    abilities: [],
    spellcasting: [],
    appearance: {},
    background: {},
    treasure: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, treasure: "", equipment: "" },
    conditions: {} as Character["conditions"],
    groups: [],
    ...overrides,
  }) as Character;

describe("FR-character-duplicate — characterSlice — duplication optimistic update", () => {
  it("nominal: upsertCharacterWithoutGroup prepends a new character to an existing list", () => {
    const page1 = buildCharacter({ _id: "c1", firstname: "Existing" });
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({ characters: [page1], total: 1 }),
    );

    const duplicate = buildCharacter({ _id: "c2", firstname: "Existing 2" });
    state = characterReducer(state, upsertCharacterWithoutGroup(duplicate));

    expect(state.charactersWithoutGroup).toHaveLength(2);
    expect(state.charactersWithoutGroup[0]._id).toBe("c2");
    expect(state.totalWithoutGroup).toBe(2);
  });

  it("nominal: upsertCharacterWithoutGroup preserves existing pagination state (page, hasMore)", () => {
    const characters = Array.from({ length: 10 }, (_, i) => buildCharacter({ _id: `c${i}` }));
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({ characters, total: 15 }),
    );
    expect(state.hasMoreWithoutGroup).toBe(true);
    expect(state.currentPageWithoutGroup).toBe(1);

    const duplicate = buildCharacter({ _id: "c-new" });
    state = characterReducer(state, upsertCharacterWithoutGroup(duplicate));

    expect(state.currentPageWithoutGroup).toBe(1);
    expect(state.hasMoreWithoutGroup).toBe(true);
  });

  it("edge: upsertCharacterWithoutGroup updates an existing character in-place (same _id)", () => {
    const original = buildCharacter({ _id: "c1", firstname: "Original" });
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({ characters: [original], total: 1 }),
    );

    const updated = buildCharacter({ _id: "c1", firstname: "Updated" });
    state = characterReducer(state, upsertCharacterWithoutGroup(updated));

    expect(state.charactersWithoutGroup).toHaveLength(1);
    expect(state.charactersWithoutGroup[0].firstname).toBe("Updated");
    expect(state.totalWithoutGroup).toBe(1);
  });

  it("edge: upsertCharacterWithoutGroup removes character when it now has groups", () => {
    const character = buildCharacter({ _id: "c1" });
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({ characters: [character], total: 1 }),
    );

    const withGroup = { ...character, groups: [{ _id: "g1", label: "Group", characters: [], campaigns: [] }] };
    state = characterReducer(state, upsertCharacterWithoutGroup(withGroup as Character));

    expect(state.charactersWithoutGroup).toHaveLength(0);
    expect(state.totalWithoutGroup).toBe(0);
  });

  it("failure guard: clearCharacters (used by refetch) DOES wipe the list — contrast with upsert", () => {
    const character = buildCharacter({ _id: "c1" });
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({ characters: [character], total: 1 }),
    );
    expect(state.charactersWithoutGroup).toHaveLength(1);

    state = characterReducer(state, clearCharacters());
    expect(state.charactersWithoutGroup).toHaveLength(0);
    expect(state.currentPageWithoutGroup).toBe(1);
  });
});
