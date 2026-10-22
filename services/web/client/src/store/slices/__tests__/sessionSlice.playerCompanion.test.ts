import { describe, expect, it } from "vitest";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import sessionReducer, {
  applyPlayerRowVisibilityRules,
  appendInitiativeTrackerRows,
  clearCurrentSession,
  createInitiativeTrackerRow,
  defaultPlayerFieldVisibilityForKind,
  setSessionCompanionNpcs,
  type InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import type { NPC } from "@/types/character";

const initialState = sessionReducer(undefined, { type: "@@INIT" });

const companionNpc = (id = "npc-1"): NPC =>
  ({
    _id: id,
    kind: "npc",
    firstname: "Wolf",
    linkedPlayerId: "pj-1",
  }) as NPC;

const buildCompanionRow = (characterId = "npc-1"): InitiativeTrackerRow => ({
  ...createInitiativeTrackerRow({
    groupId: SESSION_PARTICIPANTS_GROUP_ID,
    groupLabel: "Participants session",
    characterId,
    firstname: "Wolf",
    lastname: "",
    surname: "",
    hitPoints: 11,
    maxHitPoints: 11,
    armorClass: 13,
    kind: "npc",
  }),
  isPlayerCompanion: true,
});

describe("FR-session-player-companion-combatants — session companion combatants", () => {
  it("nominal: companion NPCs are stored as derived session state", () => {
    const next = sessionReducer(initialState, setSessionCompanionNpcs([companionNpc()]));
    expect(next.sessionCompanionNpcs).toEqual([companionNpc()]);
  });

  it("nominal: companion tracker rows keep NPC visibility defaults", () => {
    const row = buildCompanionRow();
    expect(row.kind).toBe("npc");
    expect(row.playerFieldVisibility).toEqual(defaultPlayerFieldVisibilityForKind("npc"));
  });

  it("edge: appendInitiativeTrackerRows preserves isPlayerCompanion", () => {
    const state = sessionReducer(initialState, appendInitiativeTrackerRows([buildCompanionRow()]));
    expect(state.initiativeTrackerRows[0]?.isPlayerCompanion).toBe(true);
  });

  it("edge: ending the session clears derived companions", () => {
    let state = sessionReducer(initialState, setSessionCompanionNpcs([companionNpc(), companionNpc("npc-2")]));
    state = sessionReducer(state, clearCurrentSession());
    expect(state.sessionCompanionNpcs).toEqual([]);
  });

  it("failure: applyPlayerRowVisibilityRules does not lock isPlayerCompanion rows to full visibility", () => {
    const row = buildCompanionRow();
    row.visible = false;
    row.playerFieldVisibility = {
      initiative: false,
      name: true,
      hitPoints: false,
      lifeStatus: false,
      armorClass: false,
      conditions: false,
      concentration: false,
      groupLabel: false,
    };

    const result = applyPlayerRowVisibilityRules(row);
    expect(result.visible).toBe(false);
    expect(result.playerFieldVisibility.name).toBe(true);
    expect(result.playerFieldVisibility.hitPoints).toBe(false);
  });
});
