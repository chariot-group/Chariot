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
});
