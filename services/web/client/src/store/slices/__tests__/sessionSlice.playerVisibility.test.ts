import { describe, expect, it } from "vitest";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import sessionReducer, {
  applyPlayerRowVisibilityRules,
  applyRemoteBattleState,
  defaultPlayerFieldVisibilityForKind,
  normalizePlayerFieldVisibility,
  setInitiativeTrackerRows,
  updateInitiativeTrackerRow,
  type InitiativeTrackerRow,
} from "../sessionSlice";
import { filterRowsForPlayerView } from "@/components/initiativeTracker/utils";

const buildRow = (
  overrides: Partial<InitiativeTrackerRow> & { id: string },
): InitiativeTrackerRow => {
  const kind = overrides.kind ?? "npc";
  const groupId = overrides.groupId ?? "g1";
  return {
    id: overrides.id,
    characterId: overrides.characterId ?? overrides.id,
    firstname: overrides.firstname ?? "Gobelin",
    lastname: "",
    surname: "",
    avatar: "",
    initiative: overrides.initiative ?? 10,
    hitPoints: overrides.hitPoints ?? 7,
    maxHitPoints: overrides.maxHitPoints ?? 7,
    tempHitPoints: overrides.tempHitPoints ?? 0,
    armorClass: overrides.armorClass ?? 15,
    conditions: overrides.conditions ?? [],
    groupId,
    groupLabel: overrides.groupLabel ?? "Monstres",
    visible: overrides.visible ?? true,
    playerDisplayName: overrides.playerDisplayName ?? "",
    playerFieldVisibility:
      overrides.playerFieldVisibility ?? defaultPlayerFieldVisibilityForKind(kind, groupId),
    kind,
    deathSavesFailures: overrides.deathSavesFailures ?? 0,
  };
};

describe("FR-015 — player field visibility defaults", () => {
  it("nominal: NPC defaults hide mechanical fields except name", () => {
    const defaults = defaultPlayerFieldVisibilityForKind("npc");
    expect(defaults).toEqual({
      initiative: false,
      name: true,
      hitPoints: false,
      armorClass: false,
      conditions: false,
      groupLabel: false,
    });
  });

  it("nominal: session participant player rows default to all fields visible", () => {
    const defaults = defaultPlayerFieldVisibilityForKind("player", SESSION_PARTICIPANTS_GROUP_ID);
    expect(Object.values(defaults).every(Boolean)).toBe(true);
  });

  it("edge: player rows outside session group use NPC-like defaults", () => {
    const defaults = defaultPlayerFieldVisibilityForKind("player", "g1");
    expect(defaults).toEqual(defaultPlayerFieldVisibilityForKind("npc"));
  });

  it("edge: legacy rows without playerFieldVisibility are normalized on set", () => {
    const legacyRow = {
      ...buildRow({ id: "x", kind: "npc" }),
      playerFieldVisibility: undefined,
    } as InitiativeTrackerRow;

    const state = sessionReducer(undefined, setInitiativeTrackerRows([legacyRow]));
    expect(state.initiativeTrackerRows[0].playerFieldVisibility).toEqual(
      defaultPlayerFieldVisibilityForKind("npc"),
    );
  });
});

describe("FR-015 — player view filtering", () => {
  it("nominal: only visible rows are shown to players", () => {
    const rows = [
      buildRow({ id: "a", visible: true }),
      buildRow({ id: "b", visible: false, kind: "npc" }),
    ];
    expect(filterRowsForPlayerView(rows).map((r) => r.id)).toEqual(["a"]);
  });

  it("nominal: session participant rows are always shown even when marked hidden", () => {
    const rows = [
      buildRow({
        id: "pj",
        visible: false,
        kind: "player",
        groupId: SESSION_PARTICIPANTS_GROUP_ID,
      }),
      buildRow({ id: "npc", visible: false, kind: "npc" }),
    ];
    expect(filterRowsForPlayerView(rows).map((r) => r.id)).toEqual(["pj"]);
  });

  it("edge: non-session player rows respect visible flag", () => {
    const rows = [
      buildRow({ id: "pj", visible: false, kind: "player", groupId: "g1" }),
    ];
    expect(filterRowsForPlayerView(rows)).toHaveLength(0);
  });

  it("edge: empty when all NPC rows hidden", () => {
    expect(filterRowsForPlayerView([buildRow({ id: "a", visible: false, kind: "npc" })])).toHaveLength(0);
  });
});

describe("FR-015 — session participant rows not maskable", () => {
  it("nominal: applyPlayerRowVisibilityRules forces visible for session group only", () => {
    const locked = applyPlayerRowVisibilityRules(
      buildRow({
        id: "pj",
        kind: "player",
        groupId: SESSION_PARTICIPANTS_GROUP_ID,
        visible: false,
        playerFieldVisibility: {
          initiative: false,
          name: false,
          hitPoints: false,
          armorClass: false,
          conditions: false,
          groupLabel: false,
        },
      }),
    );
    expect(locked.visible).toBe(true);
    expect(locked.playerFieldVisibility).toEqual(
      defaultPlayerFieldVisibilityForKind("player", SESSION_PARTICIPANTS_GROUP_ID),
    );
  });

  it("edge: other player rows are not forced visible", () => {
    const row = applyPlayerRowVisibilityRules(
      buildRow({ id: "pj", kind: "player", groupId: "g1", visible: false }),
    );
    expect(row.visible).toBe(false);
  });

  it("edge: updateInitiativeTrackerRow can hide a non-session player row", () => {
    let state = sessionReducer(
      undefined,
      setInitiativeTrackerRows([buildRow({ id: "pj", kind: "player", groupId: "g1" })]),
    );
    state = sessionReducer(
      state,
      updateInitiativeTrackerRow({
        id: "pj",
        changes: { visible: false, playerFieldVisibility: { ...defaultPlayerFieldVisibilityForKind("npc") } },
      }),
    );
    expect(state.initiativeTrackerRows[0].visible).toBe(false);
  });
});

describe("FR-015 — applyRemoteBattleState", () => {
  it("nominal: replaces battle fields from GM snapshot", () => {
    let state = sessionReducer(undefined, setInitiativeTrackerRows([buildRow({ id: "a" })]));
    state = sessionReducer(
      state,
      applyRemoteBattleState({
        initiativeTrackerRows: [buildRow({ id: "b", firstname: "Orc" })],
        battleInitialized: true,
        battleStarted: true,
        activeTurnRowId: "b",
        currentRound: 3,
      }),
    );

    expect(state.initiativeTrackerRows).toHaveLength(1);
    expect(state.initiativeTrackerRows[0].id).toBe("b");
    expect(state.battleStarted).toBe(true);
    expect(state.currentRound).toBe(3);
    expect(state.activeTurnRowId).toBe("b");
  });

  it("edge: initialized but not started snapshot does not count as started combat for players", () => {
    let state = sessionReducer(undefined, setInitiativeTrackerRows([]));
    state = sessionReducer(
      state,
      applyRemoteBattleState({
        initiativeTrackerRows: [buildRow({ id: "prep" })],
        battleInitialized: true,
        battleStarted: false,
        activeTurnRowId: null,
        currentRound: 1,
      }),
    );

    expect(state.battleInitialized).toBe(true);
    expect(state.battleStarted).toBe(false);
    expect(state.activeTurnRowId).toBeNull();
  });

  it("edge: ending combat from GM snapshot clears player battle access", () => {
    let state = sessionReducer(undefined, setInitiativeTrackerRows([buildRow({ id: "a" })]));
    state = sessionReducer(
      state,
      applyRemoteBattleState({
        initiativeTrackerRows: [],
        battleInitialized: false,
        battleStarted: false,
        activeTurnRowId: null,
        currentRound: 1,
      }),
    );

    expect(state.initiativeTrackerRows).toEqual([]);
    expect(state.battleInitialized).toBe(false);
    expect(state.battleStarted).toBe(false);
    expect(state.activeTurnRowId).toBeNull();
  });

  it("error: partial visibility payload is normalized", () => {
    const row = buildRow({
      id: "c",
      playerFieldVisibility: { name: true } as never,
    });
    const normalized = normalizePlayerFieldVisibility(row.playerFieldVisibility, "npc", row.groupId);
    expect(normalized.name).toBe(true);
    expect(normalized.hitPoints).toBe(false);
  });
});
