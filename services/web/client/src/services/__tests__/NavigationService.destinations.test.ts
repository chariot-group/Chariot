import { afterEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

const { getPlayersWithoutGroup, getCharacterById, getCampaigns, getCampaignById, getAllGroupsByCampaign } = vi.hoisted(() => ({
    getPlayersWithoutGroup: vi.fn(),
    getCharacterById: vi.fn(),
    getCampaigns: vi.fn(),
    getCampaignById: vi.fn(),
    getAllGroupsByCampaign: vi.fn(),
}));

vi.mock("@/services/CharacterService", () => ({ default: { getPlayersWithoutGroup, getCharacterById } }));
vi.mock("@/services/CampaignService", () => ({ default: { getCampaigns, getCampaignById } }));
vi.mock("@/services/GroupService", () => ({ default: { getAllGroupsByCampaign } }));
vi.mock("@/logger/reportClientIssue", () => ({ reportClientIssue: vi.fn() }));

import NavigationService from "@/services/NavigationService";
import characterReducer from "@/store/slices/characterSlice";
import campaignReducer from "@/store/slices/campaignSlice";
import type { AppDispatch, RootState } from "@/store";

function makeStore() {
    const store = configureStore({ reducer: { character: characterReducer, campaign: campaignReducer } });
    return {
        dispatch: store.dispatch as unknown as AppDispatch,
        getState: () => store.getState() as unknown as RootState,
    };
}

describe("NavigationService destinations (FR-session-end-navigation)", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("nominal: premier groupe vide → personnage du second groupe, pas welcome", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        getCampaigns.mockResolvedValue({ data: [{ _id: "camp-1", groups: { active: ["g1", "g2"] } }], totalItems: 1 });
        getCampaignById.mockResolvedValue({
            _id: "camp-1",
            groups: { active: [{ _id: "g1", characters: [] }, { _id: "g2", characters: [{ _id: "c2" }] }] },
        });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determinePostLoginDestination("fr", dispatch, getState);

        expect(destination).toEqual({
            path: "/fr/campaigns/camp-1/groups/g2/characters/c2",
            reason: "character-in-campaign",
        });
    });

    it("edge: campagne sans liste d'archives → personnage du groupe actif", async () => {
        getAllGroupsByCampaign.mockResolvedValue([{ _id: "g1", characters: [{ _id: "c1" }] }]);
        getCampaignById.mockResolvedValue({ _id: "camp-1", groups: { active: ["g1"] } });

        const destination = await NavigationService.determineSpaceDestination("camp-1", "fr");

        expect(destination.path).toBe("/fr/campaigns/camp-1/groups/g1/characters/c1");
    });

    it("failure: aucun personnage nulle part → welcome", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        getCampaigns.mockResolvedValue({ data: [], totalItems: 0 });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determinePostLoginDestination("fr", dispatch, getState);

        expect(destination).toEqual({ path: "/fr/welcome", reason: "no-characters" });
    });

    it("nominal: campagne sans personnage → fallback de la campagne (FR-welcome-onboarding-fallbacks)", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        getCampaigns.mockResolvedValue({ data: [{ _id: "camp-1", groups: { active: ["g1"] } }], totalItems: 1 });
        getCampaignById.mockResolvedValue({
            _id: "camp-1",
            groups: { active: [{ _id: "g1", characters: [] }] },
        });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determinePostLoginDestination("fr", dispatch, getState);

        expect(destination).toEqual({ path: "/fr/campaigns/camp-1", reason: "no-characters-campaign" });
    });

    it("edge: espace de campagne vide → fallback de cette campagne, pas welcome", async () => {
        getAllGroupsByCampaign.mockResolvedValue([{ _id: "g1", characters: [] }]);
        getCampaignById.mockResolvedValue({ _id: "camp-1", groups: { active: ["g1"] } });

        const destination = await NavigationService.determineSpaceDestination("camp-1", "fr");

        expect(destination).toEqual({ path: "/fr/campaigns/camp-1", reason: "no-characters-campaign" });
    });

    it("edge: espace joueur vide (avec ou sans campagne) → fallback espace joueur", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determinePlayerSpaceDestination("fr", dispatch, getState);

        expect(destination).toEqual({ path: "/fr/characters", reason: "no-characters-player-space" });
    });

    it("failure: erreur de résolution de l'espace → welcome", async () => {
        getAllGroupsByCampaign.mockRejectedValue(new Error("boom"));

        const destination = await NavigationService.determineSpaceDestination("camp-1", "fr");

        expect(destination).toEqual({ path: "/fr/welcome", reason: "no-characters" });
    });

    it("logo nominal: espace joueur prioritaire avec personnage → sa fiche", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [{ _id: "p1" }], pagination: { totalItems: 1 } });
        getCharacterById.mockResolvedValue({});
        getCampaigns.mockResolvedValue({ data: [], totalItems: 0 });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "player",
            campaignId: null,
        });

        expect(destination.path).toBe("/fr/characters/p1");
    });

    it("logo edge: campagne courante vide mais personnage joueur → fiche joueur, pas welcome", async () => {
        getAllGroupsByCampaign.mockResolvedValue([{ _id: "g1", characters: [] }]);
        getCampaignById.mockResolvedValue({ _id: "camp-1", groups: { active: ["g1"] } });
        getPlayersWithoutGroup.mockResolvedValue({ data: [{ _id: "p1" }], pagination: { totalItems: 1 } });
        getCharacterById.mockResolvedValue({});
        getCampaigns.mockResolvedValue({ data: [], totalItems: 0 });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "gm",
            campaignId: "camp-1",
        });

        expect(destination.path).toBe("/fr/characters/p1");
    });

    it("logo edge: campagne courante avec personnage → prioritaire sur l'espace joueur", async () => {
        getAllGroupsByCampaign.mockResolvedValue([{ _id: "g1", characters: [{ _id: "c1" }] }]);
        getCampaignById.mockResolvedValue({ _id: "camp-1", groups: { active: ["g1"] } });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "gm",
            campaignId: "camp-1",
        });

        expect(destination.path).toBe("/fr/campaigns/camp-1/groups/g1/characters/c1");
    });

    it("logo edge: campagne vide et espace joueur vide → fallback campagne, jamais welcome", async () => {
        getAllGroupsByCampaign.mockResolvedValue([{ _id: "g1", characters: [] }]);
        getCampaignById.mockResolvedValue({ _id: "camp-1", groups: { active: ["g1"] } });
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        getCampaigns.mockResolvedValue({ data: [{ _id: "camp-1", groups: { active: ["g1"] } }], totalItems: 1 });
        const { dispatch, getState } = makeStore();

        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "gm",
            campaignId: "camp-1",
        });

        expect(destination).toEqual({ path: "/fr/campaigns/camp-1", reason: "no-characters-campaign" });
    });

    it("logo failure/guard: aucune campagne ni personnage, ou erreur → welcome", async () => {
        getPlayersWithoutGroup.mockResolvedValue({ data: [], pagination: { totalItems: 0 } });
        getCampaigns.mockResolvedValue({ data: [], totalItems: 0 });
        const { dispatch, getState } = makeStore();

        const empty = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "player",
            campaignId: null,
        });
        expect(empty).toEqual({ path: "/fr/welcome", reason: "no-characters" });

        getAllGroupsByCampaign.mockRejectedValue(new Error("boom"));
        getPlayersWithoutGroup.mockRejectedValue(new Error("boom"));
        const failed = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "gm",
            campaignId: "camp-1",
        });
        expect(failed.path).toBe("/fr/welcome");
    });
});
