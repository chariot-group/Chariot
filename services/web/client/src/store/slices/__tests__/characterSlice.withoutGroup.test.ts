import { describe, expect, it } from "vitest";
import characterReducer, {
  fetchCharactersWithoutGroupSuccess,
  loadMoreCharactersWithoutGroupSuccess,
  removeCharacterWithoutGroup,
} from "@/store/slices/characterSlice";
import type { Character } from "@/types/character";

const buildCharacter = (id: string): Character =>
  ({
    _id: id,
    firstname: "Hero",
    lastname: id,
    kind: "player",
    groups: [],
  }) as Character;

describe("FR-005 — characters without group pagination", () => {
  it("nominal: removeCharacterWithoutGroup drops item and keeps pagination depth", () => {
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({
        characters: Array.from({ length: 10 }, (_, index) => buildCharacter(`c${index + 1}`)),
        total: 20,
      }),
    );
    state = characterReducer(
      state,
      loadMoreCharactersWithoutGroupSuccess({
        characters: [buildCharacter("c11"), buildCharacter("c12"), buildCharacter("c13"), buildCharacter("c14"), buildCharacter("c15")],
        total: 20,
      }),
    );
    expect(state.charactersWithoutGroup).toHaveLength(15);
    expect(state.currentPageWithoutGroup).toBe(2);

    state = characterReducer(state, removeCharacterWithoutGroup("c8"));

    expect(state.charactersWithoutGroup).toHaveLength(14);
    expect(state.charactersWithoutGroup.some((character) => character._id === "c8")).toBe(false);
    expect(state.totalWithoutGroup).toBe(19);
    expect(state.currentPageWithoutGroup).toBe(2);
    expect(state.hasMoreWithoutGroup).toBe(true);
  });

  it("edge: remove unknown id is a no-op", () => {
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({
        characters: [buildCharacter("c1")],
        total: 1,
      }),
    );

    state = characterReducer(state, removeCharacterWithoutGroup("missing"));

    expect(state.charactersWithoutGroup).toHaveLength(1);
    expect(state.totalWithoutGroup).toBe(1);
    expect(state.hasMoreWithoutGroup).toBe(false);
  });

  it("edge: removing last visible item clears hasMore when total matches", () => {
    let state = characterReducer(
      undefined,
      fetchCharactersWithoutGroupSuccess({
        characters: [buildCharacter("c1")],
        total: 1,
      }),
    );

    state = characterReducer(state, removeCharacterWithoutGroup("c1"));

    expect(state.charactersWithoutGroup).toHaveLength(0);
    expect(state.totalWithoutGroup).toBe(0);
    expect(state.hasMoreWithoutGroup).toBe(false);
  });
});
