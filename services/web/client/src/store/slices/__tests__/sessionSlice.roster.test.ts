import { describe, expect, it } from "vitest";
import sessionReducer, {
  appendInitiativeTrackerRows,
  createInitiativeTrackerRow,
  removeInitiativeTrackerRow,
  setInitiativeTrackerRows,
  startBattle,
  type InitiativeTrackerRow,
} from "../sessionSlice";

const buildRow = (overrides: Partial<InitiativeTrackerRow> & { id: string }): InitiativeTrackerRow =>
  createInitiativeTrackerRow({
    groupId: overrides.groupId ?? "g1",
    groupLabel: overrides.groupLabel ?? "Monstres",
    characterId: overrides.characterId ?? overrides.id,
    firstname: overrides.firstname ?? "Gob",
    lastname: overrides.lastname ?? "",
    surname: overrides.surname ?? "",
    initiative: overrides.initiative ?? 10,
    hitPoints: overrides.hitPoints ?? 5,
    maxHitPoints: overrides.maxHitPoints ?? 5,
    armorClass: overrides.armorClass ?? 12,
    kind: overrides.kind ?? "npc",
    ...overrides,
  });

describe("FR-012 — mid-combat roster", () => {
  it("nominal: append adds only new characterIds", () => {
    let state = sessionReducer(
      undefined,
      setInitiativeTrackerRows([buildRow({ id: "g1:c1", characterId: "c1" })]),
    );
    state = sessionReducer(
      state,
      appendInitiativeTrackerRows([
        buildRow({ id: "g1:c2", characterId: "c2" }),
        buildRow({ id: "g1:c1", characterId: "c1" }),
      ]),
    );
    expect(state.initiativeTrackerRows).toHaveLength(2);
    expect(state.initiativeTrackerRows.map((r) => r.characterId).sort()).toEqual(["c1", "c2"]);
  });

  it("edge: remove active row advances turn during started combat", () => {
    let state = sessionReducer(
      undefined,
      setInitiativeTrackerRows([
        buildRow({ id: "g1:a", characterId: "a", initiative: 20 }),
        buildRow({ id: "g1:b", characterId: "b", initiative: 10 }),
      ]),
    );
    state = sessionReducer(state, startBattle());
    expect(state.activeTurnRowId).toBe("g1:a");

    state = sessionReducer(state, removeInitiativeTrackerRow("g1:a"));
    expect(state.initiativeTrackerRows).toHaveLength(1);
    expect(state.activeTurnRowId).toBe("g1:b");
    expect(state.turnsWithActions.some((k) => k.endsWith(":g1:a"))).toBe(false);
  });

  it("error: removing last row clears battleInitialized", () => {
    let state = sessionReducer(
      undefined,
      setInitiativeTrackerRows([buildRow({ id: "g1:c1", characterId: "c1" })]),
    );
    state = sessionReducer(state, startBattle());
    state = sessionReducer(state, removeInitiativeTrackerRow("g1:c1"));
    expect(state.initiativeTrackerRows).toHaveLength(0);
    expect(state.battleInitialized).toBe(false);
    expect(state.battleStarted).toBe(false);
  });
});

describe("FR-015 — playerDisplayName default on create", () => {
  it("nominal: new row gets real name as default alias", () => {
    const row = createInitiativeTrackerRow({
      groupId: "g1",
      groupLabel: "G",
      characterId: "c1",
      firstname: "Gobelin",
      lastname: "1",
      surname: "",
      hitPoints: 1,
      maxHitPoints: 1,
      armorClass: 10,
      kind: "npc",
    });
    expect(row.playerDisplayName).toBe("Gobelin 1");
  });
});
