import { describe, expect, it, vi } from "vitest";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import {
  computeConcentrationCheckFromHpChange,
  computeConcentrationSaveDc,
  formatConcentrationRoundLabel,
  isConcentrationSpell,
  normalizeTrackerConcentration,
  buildPendingConcentrationCheckSignature,
  clearConcentrationSaveAutoShownKeys,
  formatConcentrationBadgeLabel,
  markConcentrationSaveAutoShown,
  shouldAutoOpenConcentrationSaveDialog,
  shouldShowConcentrationSaveDialog,
} from "@/components/initiativeTracker/concentration.utils";

describe("FR-tracker-concentration — concentration.utils", () => {
  it("nominal: detects concentration from duration text", () => {
    expect(isConcentrationSpell({ duration: "Concentration, up to 1 minute" })).toBe(true);
    expect(isConcentrationSpell({ duration: "Instantaneous" })).toBe(false);
  });

  it("edge: computes CON save DC from damage", () => {
    expect(computeConcentrationSaveDc(8)).toBe(10);
    expect(computeConcentrationSaveDc(24)).toBe(12);
  });

  it("edge: creates pending check when effective HP drops", () => {
    const pending = computeConcentrationCheckFromHpChange(
      {
        hitPoints: 20,
        tempHitPoints: 5,
        concentration: { spellName: "Bless" },
      },
      {
        hitPoints: 12,
        tempHitPoints: 5,
        concentration: { spellName: "Bless" },
      },
    );

    expect(pending).toEqual({ damageAmount: 8, dc: 10 });
  });

  it("nominal: formats compact round label", () => {
    expect(formatConcentrationRoundLabel(3)).toBe("R3");
    expect(formatConcentrationRoundLabel(undefined)).toBeNull();
  });

  it("failure: rejects invalid concentration payload", () => {
    expect(normalizeTrackerConcentration({ spellName: "   " })).toBeNull();
  });

  it("nominal: player row modal is shown only to owning player", () => {
    const row = {
      groupId: SESSION_PARTICIPANTS_GROUP_ID,
      characterId: "char-1",
      concentration: { spellName: "Bless" },
      pendingConcentrationCheck: { damageAmount: 8, dc: 10 },
    };

    expect(
      shouldShowConcentrationSaveDialog({ row, isGameMaster: false, ownCharacterId: "char-1" }),
    ).toBe(true);
    expect(
      shouldShowConcentrationSaveDialog({ row, isGameMaster: false, ownCharacterId: "char-2" }),
    ).toBe(false);
    expect(
      shouldShowConcentrationSaveDialog({ row, isGameMaster: true, ownCharacterId: null }),
    ).toBe(false);
  });

  it("nominal: formats spell name as badge label", () => {
    expect(formatConcentrationBadgeLabel("Hold Person")).toBe("Hold Person");
    expect(formatConcentrationBadgeLabel("  ")).toBe("—");
  });

  it("edge: GM sees concentration-save modal for non-player rows only", () => {
    const npcRow = {
      groupId: "goblin-pack",
      characterId: "npc-1",
      concentration: { spellName: "Hold Person" },
      pendingConcentrationCheck: { damageAmount: 12, dc: 10 },
    };

    expect(
      shouldShowConcentrationSaveDialog({ row: npcRow, isGameMaster: true, ownCharacterId: null }),
    ).toBe(true);
    expect(
      shouldShowConcentrationSaveDialog({ row: npcRow, isGameMaster: false, ownCharacterId: "char-1" }),
    ).toBe(false);
  });

  it("edge: auto-open is suppressed after a pending check was already shown", () => {
    const storage = new Map<string, string>();
    const sessionStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };

    vi.stubGlobal("sessionStorage", sessionStorageMock);

    const signature = buildPendingConcentrationCheckSignature({ damageAmount: 8, dc: 10 });
    expect(shouldAutoOpenConcentrationSaveDialog("row-1", signature)).toBe(true);

    markConcentrationSaveAutoShown("row-1", signature);
    expect(shouldAutoOpenConcentrationSaveDialog("row-1", signature)).toBe(false);

    clearConcentrationSaveAutoShownKeys();
    expect(shouldAutoOpenConcentrationSaveDialog("row-1", signature)).toBe(true);

    vi.unstubAllGlobals();
  });
});
