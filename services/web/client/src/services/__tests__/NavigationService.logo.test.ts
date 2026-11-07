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

/** Campaign data: id → character id held by its single group (null = empty group). */
type Campaigns = Record<string, string | null>;

function setup(playerCharacter: string | null, campaigns: Campaigns) {
    getPlayersWithoutGroup.mockResolvedValue({
        data: playerCharacter ? [{ _id: playerCharacter }] : [],
        pagination: { totalItems: playerCharacter ? 1 : 0 },
    });
    getCharacterById.mockResolvedValue({});
    getCampaigns.mockResolvedValue({
        data: Object.keys(campaigns).map((id) => ({ _id: id, groups: { active: [`g-${id}`] } })),
        totalItems: Object.keys(campaigns).length,
    });
    const groupOf = (id: string) => ({ _id: `g-${id}`, characters: campaigns[id] ? [{ _id: campaigns[id] }] : [] });
    getCampaignById.mockImplementation(async (id: string) => ({ _id: id, groups: { active: [groupOf(id)] } }));
    getAllGroupsByCampaign.mockImplementation(async (id: string) => [groupOf(id)]);
    const store = configureStore({ reducer: { character: characterReducer, campaign: campaignReducer } });
    return { dispatch: store.dispatch as unknown as AppDispatch, getState: () => store.getState() as unknown as RootState };
}

const sheet = (campaign: string, character: string) => `/fr/campaigns/${campaign}/groups/g-${campaign}/characters/${character}`;

interface Case {
    name: string;
    mode: "player" | "gm" | null;
    campaignId: string | null;
    player: string | null;
    campaigns: Campaigns;
    expected: string;
}

const cases: Case[] = [
    // Player space
    { name: "player space, player char", mode: "player", campaignId: null, player: "p1", campaigns: { A: "a1" }, expected: "/fr/characters/p1" },
    { name: "player space, no char, one empty campaign → player fallback", mode: "player", campaignId: null, player: null, campaigns: { A: null }, expected: "/fr/characters" },
    { name: "player space, no char, campaign with char → that char", mode: "player", campaignId: null, player: null, campaigns: { A: "a1" }, expected: sheet("A", "a1") },
    { name: "player space, no char, no campaign → welcome", mode: "player", campaignId: null, player: null, campaigns: {}, expected: "/fr/welcome" },
    // Campaign space (current = A)
    { name: "campaign space, current has char", mode: "gm", campaignId: "A", player: "p1", campaigns: { A: "a1" }, expected: sheet("A", "a1") },
    { name: "campaign space, current empty, player char → player char", mode: "gm", campaignId: "A", player: "p1", campaigns: { A: null }, expected: "/fr/characters/p1" },
    { name: "campaign space, current empty, no player char → campaign fallback", mode: "gm", campaignId: "A", player: null, campaigns: { A: null }, expected: "/fr/campaigns/A" },
    { name: "campaign space, current empty, other campaign has char → that char", mode: "gm", campaignId: "A", player: null, campaigns: { A: null, B: "b1" }, expected: sheet("B", "b1") },
    { name: "campaign space, current empty, other empty → current fallback", mode: "gm", campaignId: "A", player: null, campaigns: { A: null, B: null }, expected: "/fr/campaigns/A" },
    // No context
    { name: "no context, player char", mode: null, campaignId: null, player: "p1", campaigns: {}, expected: "/fr/characters/p1" },
    { name: "no context, empty campaign → its fallback", mode: null, campaignId: null, player: null, campaigns: { A: null }, expected: "/fr/campaigns/A" },
    { name: "no context, nothing → welcome", mode: null, campaignId: null, player: null, campaigns: {}, expected: "/fr/welcome" },
    // Anomaly guards
    { name: "gm mode without selected campaign falls back to post-login", mode: "gm", campaignId: null, player: "p1", campaigns: {}, expected: "/fr/characters/p1" },
];

describe("NavigationService.determineLogoDestination matrix (FR-welcome-onboarding-fallbacks)", () => {
    afterEach(() => vi.clearAllMocks());

    it.each(cases)("$name", async ({ mode, campaignId, player, campaigns, expected }) => {
        const { dispatch, getState } = setup(player, campaigns);
        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: mode,
            campaignId,
        });
        expect(destination.path).toBe(expected);
    });

    it("anomaly: welcome is never returned when a campaign or a player character exists", async () => {
        for (const c of cases.filter((x) => x.player || Object.keys(x.campaigns).length > 0)) {
            const { dispatch, getState } = setup(c.player, c.campaigns);
            const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
                contextMode: c.mode,
                campaignId: c.campaignId,
            });
            expect(destination.path, c.name).not.toBe("/fr/welcome");
        }
    });

    it("failure: current campaign unavailable (deleted) → post-login resolution, not welcome when data exists", async () => {
        const { dispatch, getState } = setup("p1", { B: "b1" });
        getAllGroupsByCampaign.mockRejectedValue(new Error("404"));
        getCampaignById.mockRejectedValueOnce(new Error("404"));
        const destination = await NavigationService.determineLogoDestination("fr", dispatch, getState, {
            contextMode: "gm",
            campaignId: "GONE",
        });
        expect(destination.path).toBe("/fr/characters/p1");
    });
});
