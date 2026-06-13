import { describe, expect, it } from "vitest";

/**
 * Pure derivation extracted from CharactersWithoutGroupList:
 *   const sessionCharacterId =
 *     isInSession && sessionStatus === "launched" ? (currentParticipant?.characterId ?? null) : null;
 */
function deriveSessionCharacterId(
  isInSession: boolean,
  sessionStatus: string | null,
  characterId: string | null | undefined,
): string | null {
  return isInSession && sessionStatus === "launched" ? (characterId ?? null) : null;
}

describe("CharactersWithoutGroupList — session character indicator", () => {
  it("nominal: returns characterId when in a launched session with an assigned character", () => {
    expect(deriveSessionCharacterId(true, "launched", "char-1")).toBe("char-1");
  });

  it("edge: returns null when not in session", () => {
    expect(deriveSessionCharacterId(false, "launched", "char-1")).toBeNull();
  });

  it("edge: returns null when session status is not 'launched'", () => {
    expect(deriveSessionCharacterId(true, "pending", "char-1")).toBeNull();
    expect(deriveSessionCharacterId(true, null, "char-1")).toBeNull();
  });

  it("edge: returns null when participant has no character assigned", () => {
    expect(deriveSessionCharacterId(true, "launched", undefined)).toBeNull();
    expect(deriveSessionCharacterId(true, "launched", null)).toBeNull();
  });

  it("nominal: isSessionCharacter is true when ids match", () => {
    const sessionCharacterId = deriveSessionCharacterId(true, "launched", "char-abc");
    expect(sessionCharacterId === "char-abc").toBe(true);
    expect(sessionCharacterId === "char-xyz").toBe(false);
  });
});
