import { describe, expect, it } from "vitest";
import { isCharacterSheetBackgroundRefresh, shouldReportCharacterFetchError } from "@/hooks/useCharacter";

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

describe("shouldReportCharacterFetchError — FR-character-sheet-skeleton refresh", () => {
  it("nominal: un premier chargement en échec passe en erreur (skeleton / redirection)", () => {
    expect(shouldReportCharacterFetchError(false, false)).toBe(true);
  });

  it("edge: un refresh en arrière-plan en échec garde la fiche affichée", () => {
    expect(shouldReportCharacterFetchError(true, false)).toBe(false);
  });

  it("failure: un accès refusé est toujours remonté, même en arrière-plan", () => {
    expect(shouldReportCharacterFetchError(true, true)).toBe(true);
    expect(shouldReportCharacterFetchError(false, true)).toBe(true);
  });
});
