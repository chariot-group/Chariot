import { describe, expect, it } from "vitest";
import { ROUND_DURATION_SECONDS } from "@/components/initiativeTracker/conditionDuration";
import sessionReducer, {
  clearCurrentSession,
  endBattle,
  nextBattleTurn,
  setCurrentSession,
  setCustomEffectCatalog,
  setInitiativeTrackerRows,
  startBattle,
  updateInitiativeTrackerRow,
  createInitiativeTrackerRow,
  type InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";

const buildRow = (overrides: Partial<InitiativeTrackerRow> & { id: string }): InitiativeTrackerRow => ({
  ...createInitiativeTrackerRow({
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
  }),
  ...overrides,
});

describe("FR-tracker-custom-effects — session catalog", () => {
  it("nominal: catalog survives combat end and can be reused on a new roster", () => {
    let state = sessionReducer(
      undefined,
      setCustomEffectCatalog([{ id: "fx-1", name: "Béni", description: "Avantage" }]),
    );
    state = sessionReducer(
      state,
      setInitiativeTrackerRows([
        buildRow({
          id: "g1:a",
          characterId: "a",
          customEffects: [{ effectId: "fx-1", name: "Béni", duration: { amount: 1, unit: "untilCombatEnd" } }],
        }),
      ]),
    );

    state = sessionReducer(state, endBattle());

    expect(state.initiativeTrackerRows).toEqual([]);
    expect(state.customEffectCatalog).toEqual([{ id: "fx-1", name: "Béni", description: "Avantage" }]);
  });

  it("edge: changing session code clears the catalog; same code keeps it", () => {
    let state = sessionReducer(undefined, setCurrentSession({ code: "AAAAAA", campaignId: "c1" }));
    state = sessionReducer(state, setCustomEffectCatalog([{ id: "fx-1", name: "Hex" }]));
    expect(state.customEffectCatalog).toHaveLength(1);

    state = sessionReducer(state, setCurrentSession({ code: "AAAAAA", campaignId: "c1" }));
    expect(state.customEffectCatalog).toHaveLength(1);

    state = sessionReducer(state, setCurrentSession({ code: "BBBBBB", campaignId: "c1" }));
    expect(state.customEffectCatalog).toEqual([]);
  });

  it("failure: ending the session clears the catalog", () => {
    let state = sessionReducer(
      undefined,
      setCustomEffectCatalog([{ id: "fx-1", name: "Hex" }]),
    );
    state = sessionReducer(state, clearCurrentSession());
    expect(state.customEffectCatalog).toEqual([]);
  });
});

describe("FR-tracker-custom-effects — duration tick", () => {
  it("edge: round wrap removes an expired custom effect without touching the catalog", () => {
    let state = sessionReducer(
      undefined,
      setCustomEffectCatalog([{ id: "fx-1", name: "Hex" }]),
    );
    state = sessionReducer(
      state,
      setInitiativeTrackerRows([
        buildRow({
          id: "g1:a",
          characterId: "a",
          initiative: 20,
          customEffects: [
            {
              effectId: "fx-1",
              name: "Hex",
              duration: { amount: 1, unit: "rounds" },
              remainingSeconds: ROUND_DURATION_SECONDS,
            },
          ],
        }),
        buildRow({ id: "g1:b", characterId: "b", initiative: 10 }),
      ]),
    );
    state = sessionReducer(state, startBattle());
    state = sessionReducer(state, nextBattleTurn());
    state = sessionReducer(state, nextBattleTurn());

    expect(state.currentRound).toBe(2);
    expect(state.initiativeTrackerRows.find((row) => row.characterId === "a")?.customEffects).toEqual([]);
    expect(state.customEffectCatalog).toEqual([{ id: "fx-1", name: "Hex" }]);
  });

  it("nominal: applying a custom effect replaces the previous instance on the same row", () => {
    let state = sessionReducer(
      undefined,
      setInitiativeTrackerRows([buildRow({ id: "g1:a", characterId: "a" })]),
    );
    state = sessionReducer(
      state,
      updateInitiativeTrackerRow({
        id: "g1:a",
        changes: {
          customEffects: [{ effectId: "fx-1", name: "Béni", duration: { amount: 2, unit: "rounds" } }],
        },
      }),
    );
    state = sessionReducer(
      state,
      updateInitiativeTrackerRow({
        id: "g1:a",
        changes: {
          customEffects: [{ effectId: "fx-1", name: "Béni", duration: { amount: 1, unit: "minutes" } }],
        },
      }),
    );

    expect(state.initiativeTrackerRows[0]?.customEffects).toHaveLength(1);
    expect(state.initiativeTrackerRows[0]?.customEffects?.[0]?.duration?.unit).toBe("minutes");
  });
});
