import { describe, expect, it } from "vitest";
import sessionReducer, {
  addGmGuestCharacterToSession,
  removeGmGuestCharacterFromSession,
  clearCurrentSession,
  applyPlayerRowVisibilityRules,
  appendInitiativeTrackerRows,
  createInitiativeTrackerRow,
  type InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";

const initialState = sessionReducer(undefined, { type: "@@INIT" });

const buildGuestRow = (characterId = "char-1"): InitiativeTrackerRow => ({
  ...createInitiativeTrackerRow({
    groupId: SESSION_PARTICIPANTS_GROUP_ID,
    groupLabel: "Participants session",
    characterId,
    firstname: "Drax",
    lastname: "",
    surname: "",
    hitPoints: 30,
    maxHitPoints: 30,
    armorClass: 15,
    kind: "player",
  }),
  isGmGuest: true,
});

describe("FR-session-gm-guest-character — GM guest character", () => {
  describe("addGmGuestCharacterToSession", () => {
    it("nominal: ajoute un characterId à gmGuestCharacterIds", () => {
      const next = sessionReducer(initialState, addGmGuestCharacterToSession("char-1"));
      expect(next.gmGuestCharacterIds).toContain("char-1");
    });

    it("edge: n'ajoute pas un ID déjà présent (dédoublonnage)", () => {
      let state = sessionReducer(initialState, addGmGuestCharacterToSession("char-1"));
      state = sessionReducer(state, addGmGuestCharacterToSession("char-1"));
      expect(state.gmGuestCharacterIds.filter((id) => id === "char-1")).toHaveLength(1);
    });

    it("edge: ignore un ID vide", () => {
      const next = sessionReducer(initialState, addGmGuestCharacterToSession(""));
      expect(next.gmGuestCharacterIds).toHaveLength(0);
    });
  });

  describe("removeGmGuestCharacterFromSession", () => {
    it("nominal: retire un characterId existant", () => {
      let state = sessionReducer(initialState, addGmGuestCharacterToSession("char-1"));
      state = sessionReducer(state, removeGmGuestCharacterFromSession("char-1"));
      expect(state.gmGuestCharacterIds).not.toContain("char-1");
    });

    it("edge: ne plante pas si l'ID n'existe pas", () => {
      const next = sessionReducer(initialState, removeGmGuestCharacterFromSession("unknown"));
      expect(next.gmGuestCharacterIds).toHaveLength(0);
    });
  });

  describe("clearCurrentSession", () => {
    it("nominal: vide gmGuestCharacterIds à la fin de session", () => {
      let state = sessionReducer(initialState, addGmGuestCharacterToSession("char-1"));
      state = sessionReducer(state, addGmGuestCharacterToSession("char-2"));
      state = sessionReducer(state, clearCurrentSession());
      expect(state.gmGuestCharacterIds).toHaveLength(0);
    });
  });

  describe("applyPlayerRowVisibilityRules — rows isGmGuest", () => {
    it("edge: une row isGmGuest=true NE doit PAS être verrouillée en full visibility", () => {
      const row = buildGuestRow();
      row.visible = false;
      row.playerFieldVisibility = {
        initiative: false,
        name: false,
        hitPoints: false,
        lifeStatus: false,
        armorClass: false,
        conditions: false,
        groupLabel: false,
      };

      const result = applyPlayerRowVisibilityRules(row);
      expect(result.visible).toBe(false);
      expect(result.playerFieldVisibility.name).toBe(false);
    });

    it("nominal: une row participant normal (non-guest) est verrouillée en full visibility", () => {
      const row = createInitiativeTrackerRow({
        groupId: SESSION_PARTICIPANTS_GROUP_ID,
        groupLabel: "Participants session",
        characterId: "player-1",
        firstname: "Alice",
        lastname: "",
        surname: "",
        hitPoints: 20,
        maxHitPoints: 20,
        armorClass: 12,
        kind: "player",
      });
      row.visible = false;

      const result = applyPlayerRowVisibilityRules(row);
      expect(result.visible).toBe(true);
      expect(result.playerFieldVisibility.name).toBe(true);
    });

    it("error: une row NPC normale hors session n'est pas affectée", () => {
      const row = createInitiativeTrackerRow({
        groupId: "some-group",
        groupLabel: "Monstres",
        characterId: "npc-1",
        firstname: "Goblin",
        lastname: "",
        surname: "",
        hitPoints: 5,
        maxHitPoints: 5,
        armorClass: 10,
        kind: "npc",
      });
      const result = applyPlayerRowVisibilityRules(row);
      expect(result).toEqual(row);
    });
  });

  describe("integration: appendInitiativeTrackerRows avec isGmGuest", () => {
    it("nominal: la row GM guest est ajoutée au tracker et garde isGmGuest=true", () => {
      const guestRow = buildGuestRow("char-99");
      const state = sessionReducer(initialState, appendInitiativeTrackerRows([guestRow]));
      const added = state.initiativeTrackerRows.find((r) => r.characterId === "char-99");
      expect(added).toBeDefined();
      expect(added?.isGmGuest).toBe(true);
    });

    it("edge: la row GM guest n'a pas ses champs visibility forcés (configurable)", () => {
      const guestRow = buildGuestRow("char-99");
      guestRow.visible = false;
      const state = sessionReducer(initialState, appendInitiativeTrackerRows([guestRow]));
      const added = state.initiativeTrackerRows.find((r) => r.characterId === "char-99");
      expect(added?.visible).toBe(false);
    });
  });
});
