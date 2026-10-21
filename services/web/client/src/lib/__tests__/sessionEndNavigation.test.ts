import { afterEach, describe, expect, it, vi } from "vitest";

const { determineSpaceDestination, determinePostLoginDestination } = vi.hoisted(() => ({
    determineSpaceDestination: vi.fn(),
    determinePostLoginDestination: vi.fn(),
}));

vi.mock("@/services/NavigationService", () => ({
    default: { determineSpaceDestination, determinePostLoginDestination },
}));

import {
    captureSessionEndContext,
    navigateAfterSessionEnd,
    resetSessionEndNavigationClaim,
    resolveSessionEndPath,
    shouldStayOnRouteAfterSessionEnd,
    type SessionEndContext,
} from "@/lib/sessionEndNavigation";
import type { AppDispatch, RootState } from "@/store";

const dispatch = vi.fn() as unknown as AppDispatch;
const getState = () => ({}) as RootState;

const gmContext = (pathname: string): SessionEndContext => ({
    locale: "fr",
    pathname,
    isGameMaster: true,
    campaignId: "camp-1",
});

const playerContext = (pathname: string): SessionEndContext => ({
    locale: "fr",
    pathname,
    isGameMaster: false,
    campaignId: "camp-1",
});

describe("sessionEndNavigation (FR-session-end-navigation)", () => {
    afterEach(() => {
        resetSessionEndNavigationClaim();
        vi.clearAllMocks();
    });

    it("nominal: MJ sur une page de la campagne de session reste sur place", async () => {
        const context = gmContext("/fr/campaigns/camp-1/groups/g1/characters/c1");
        expect(shouldStayOnRouteAfterSessionEnd(context)).toBe(true);
        await expect(resolveSessionEndPath(context, dispatch, getState)).resolves.toBeNull();
        expect(determineSpaceDestination).not.toHaveBeenCalled();
    });

    it("nominal: joueur sur une route de campagne est renvoyé vers sa destination post-auth", async () => {
        determinePostLoginDestination.mockResolvedValue({ path: "/fr/characters/mine", reason: "character-without-group" });
        const path = await resolveSessionEndPath(playerContext("/fr/campaigns/camp-1/groups/g1/characters/c1"), dispatch, getState);
        expect(path).toBe("/fr/characters/mine");
        expect(determineSpaceDestination).not.toHaveBeenCalled();
    });

    it("nominal: joueur sur son personnage sans groupe reste sur place", () => {
        expect(shouldStayOnRouteAfterSessionEnd(playerContext("/fr/characters/mine"))).toBe(true);
    });

    it("edge: MJ hors campagne va sur l'espace de la campagne", async () => {
        determineSpaceDestination.mockResolvedValue({ path: "/fr/campaigns/camp-1/groups/g2/characters/c9", reason: "character-in-space" });
        const path = await resolveSessionEndPath(gmContext("/fr/profile"), dispatch, getState);
        expect(path).toBe("/fr/campaigns/camp-1/groups/g2/characters/c9");
    });

    it("edge: MJ sur une autre campagne n'y reste pas", () => {
        expect(shouldStayOnRouteAfterSessionEnd(gmContext("/fr/campaigns/other/groups/g/characters/c"))).toBe(false);
    });

    it("edge: campagne sans personnage → repli sur la destination post-auth, pas welcome", async () => {
        determineSpaceDestination.mockResolvedValue({ path: "/fr/welcome", reason: "no-characters" });
        determinePostLoginDestination.mockResolvedValue({ path: "/fr/characters/mine", reason: "character-without-group" });
        const path = await resolveSessionEndPath(gmContext("/fr/welcome"), dispatch, getState);
        expect(path).toBe("/fr/characters/mine");
    });

    it("edge: plusieurs abonnés observent la fin → une seule navigation", async () => {
        determinePostLoginDestination.mockResolvedValue({ path: "/fr/characters/mine", reason: "character-without-group" });
        const router = { push: vi.fn() };
        const params = { sessionCode: "ABC123", context: playerContext("/fr/profile"), router, dispatch, getState };
        await Promise.all([navigateAfterSessionEnd(params), navigateAfterSessionEnd(params)]);
        expect(router.push).toHaveBeenCalledTimes(1);
        expect(router.push).toHaveBeenCalledWith("/fr/characters/mine");
    });

    it("failure: une erreur de résolution retombe sur welcome", async () => {
        determinePostLoginDestination.mockRejectedValue(new Error("network"));
        const path = await resolveSessionEndPath(playerContext("/fr/profile"), dispatch, getState);
        expect(path).toBe("/fr/welcome");
    });

    it("captureSessionEndContext détecte le statut MJ avant le nettoyage du roster", () => {
        const state = {
            user: { user: { keycloakId: "gm-1" } },
            session: {
                campaignId: "camp-1",
                participants: [{ userId: "gm-1", status: "gameMaster" }],
            },
        } as unknown as RootState;
        expect(captureSessionEndContext(state, "/en/campaigns/camp-1")).toEqual({
            locale: "en",
            pathname: "/en/campaigns/camp-1",
            isGameMaster: true,
            campaignId: "camp-1",
        });
    });
});
