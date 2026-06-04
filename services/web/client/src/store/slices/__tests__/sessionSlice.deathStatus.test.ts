import { describe, expect, it } from "vitest";
import sessionReducer, {
  nextBattleTurn,
  previousBattleTurn,
  setInitiativeTrackerRows,
  startBattle,
  updateInitiativeTrackerRow,
  defaultPlayerFieldVisibilityForKind,
  type CurrentSessionState,
  type InitiativeTrackerRow,
} from "../sessionSlice";

const buildRow = (overrides: Partial<InitiativeTrackerRow> & { id: string; initiative: number }): InitiativeTrackerRow => ({
  id: overrides.id,
  characterId: overrides.id,
  firstname: overrides.firstname ?? overrides.id,
  lastname: "",
  surname: "",
  avatar: "",
  initiative: overrides.initiative,
  hitPoints: overrides.hitPoints ?? 10,
  maxHitPoints: overrides.maxHitPoints ?? 10,
  tempHitPoints: overrides.tempHitPoints ?? 0,
  armorClass: overrides.armorClass ?? 12,
  conditions: overrides.conditions ?? [],
  groupId: overrides.groupId ?? "g",
  groupLabel: overrides.groupLabel ?? "Group A",
  visible: overrides.visible ?? true,
  playerDisplayName: overrides.playerDisplayName ?? "",
  playerFieldVisibility:
    overrides.playerFieldVisibility ?? defaultPlayerFieldVisibilityForKind(overrides.kind ?? "npc"),
  kind: overrides.kind ?? "npc",
  deathSavesFailures: overrides.deathSavesFailures ?? 0,
});

const seedState = (rows: InitiativeTrackerRow[]): CurrentSessionState => {
  const baseState = sessionReducer(undefined, { type: "@@INIT" });
  return sessionReducer(baseState, setInitiativeTrackerRows(rows));
};

describe("FR-014 — turn engine skips dead rows", () => {
  it("nominal: nextBattleTurn skips a dead row in the middle of the order", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 15, hitPoints: 0, kind: "npc" }),
      buildRow({ id: "c", initiative: 10 }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());
    expect(state.activeTurnRowId).toBe("a");
    expect(state.currentRound).toBe(1);

    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("c");
    expect(state.currentRound).toBe(1);
  });

  it("edge: skipping a dead row at the end wraps and increments the round exactly once", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 10, hitPoints: 0, kind: "npc" }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());
    expect(state.activeTurnRowId).toBe("a");

    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("a");
    expect(state.currentRound).toBe(2);
  });

  it("edge: an unconscious player (HP 0, failures < 3) is NOT skipped", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 15, hitPoints: 0, kind: "player", deathSavesFailures: 2 }),
      buildRow({ id: "c", initiative: 10 }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());

    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("b");
    expect(state.currentRound).toBe(1);
  });

  it("edge: a player with 3 failures at HP 0 IS skipped (treated as dead)", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 15, hitPoints: 0, kind: "player", deathSavesFailures: 3 }),
      buildRow({ id: "c", initiative: 10 }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());

    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("c");
  });

  it("error: when all rows are dead the active turn becomes null and round does not change", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20, hitPoints: 0, kind: "npc" }),
      buildRow({ id: "b", initiative: 10, hitPoints: 0, kind: "npc" }),
    ];
    let state = seedState(rows);
    // Pas de tour vivant possible : startBattle laisse activeTurnRowId à null.
    state = sessionReducer(state, startBattle());
    expect(state.activeTurnRowId).toBeNull();

    // Force battleStarted = true et currentRound = 1 à la main pour vérifier que nextBattleTurn ne fait rien.
    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBeNull();
    expect(state.currentRound).toBe(1);
  });

  it("nominal: previousBattleTurn skips a dead intermediate row when rolling back within the same round", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 15, hitPoints: 0, kind: "npc" }),
      buildRow({ id: "c", initiative: 10 }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());
    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("c");
    expect(state.currentRound).toBe(1);

    state = sessionReducer(state, previousBattleTurn());
    expect(state.activeTurnRowId).toBe("a");
    expect(state.currentRound).toBe(1);
  });

  it("edge: kills detected mid-combat skip the row on the next advance", () => {
    const rows: InitiativeTrackerRow[] = [
      buildRow({ id: "a", initiative: 20 }),
      buildRow({ id: "b", initiative: 15 }),
      buildRow({ id: "c", initiative: 10 }),
    ];
    let state = seedState(rows);
    state = sessionReducer(state, startBattle());

    state = sessionReducer(state, updateInitiativeTrackerRow({ id: "b", changes: { hitPoints: 0, kind: "npc" } }));

    state = sessionReducer(state, nextBattleTurn());
    expect(state.activeTurnRowId).toBe("c");
  });
});
