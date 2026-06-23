import { describe, expect, it } from "vitest";
import { isCharacterSheetBackgroundRefresh } from "@/hooks/useCharacter";

describe("isCharacterSheetBackgroundRefresh — FR-session-combat-sync sheet sync", () => {
  it("nominal: refresh silencieux pour une fiche déjà chargée", () => {
    expect(isCharacterSheetBackgroundRefresh("char-1", "char-1")).toBe(true);
  });

  it("edge: premier chargement ou changement de personnage — loader plein écran", () => {
    expect(isCharacterSheetBackgroundRefresh(null, "char-1")).toBe(false);
    expect(isCharacterSheetBackgroundRefresh(undefined, "char-1")).toBe(false);
    expect(isCharacterSheetBackgroundRefresh("char-1", "char-2")).toBe(false);
  });

  it("edge: ignore les espaces autour des identifiants", () => {
    expect(isCharacterSheetBackgroundRefresh(" char-1 ", "char-1")).toBe(true);
  });
});
