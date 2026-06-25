import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import sessionReducer, {
  openSessionLobby,
  selectBattleStateSnapshot,
  setInitiativeTrackerRows,
  startBattle,
} from "@/store/slices/sessionSlice";
import userReducer from "@/store/slices/userSlice";
import { defaultPlayerFieldVisibilityForKind } from "@/store/slices/sessionSlice";

describe("selectBattleStateSnapshot", () => {
  it("nominal: returns the same object reference when unrelated session fields change", () => {
    const store = configureStore({
      reducer: {
        session: sessionReducer,
        user: userReducer,
      },
    });

    const first = selectBattleStateSnapshot(store.getState());
    store.dispatch(openSessionLobby());
    const second = selectBattleStateSnapshot(store.getState());

    expect(second).toBe(first);
  });

  it("edge: returns a new snapshot when battle state changes", () => {
    const store = configureStore({
      reducer: {
        session: sessionReducer,
        user: userReducer,
      },
    });

    store.dispatch(
      setInitiativeTrackerRows([
        {
          id: "row-1",
          characterId: "char-1",
          firstname: "A",
          lastname: "",
          surname: "",
          avatar: "",
          initiative: 10,
          hitPoints: 10,
          maxHitPoints: 10,
          tempHitPoints: 0,
          armorClass: 12,
          conditions: [],
          groupId: "g1",
          groupLabel: "Group",
          visible: true,
          playerDisplayName: "",
          playerFieldVisibility: defaultPlayerFieldVisibilityForKind("player"),
          kind: "player",
          deathSavesFailures: 0,
        },
      ]),
    );

    const first = selectBattleStateSnapshot(store.getState());
    store.dispatch(startBattle());
    const second = selectBattleStateSnapshot(store.getState());

    expect(second).not.toBe(first);
    expect(second.battleStarted).toBe(true);
  });
});
