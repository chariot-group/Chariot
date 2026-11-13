import { afterEach, describe, expect, it, vi } from "vitest";

const { determineSpaceDestination, determinePostLoginDestination } = vi.hoisted(() => ({
    determineSpaceDestination: vi.fn(),
    determinePostLoginDestination: vi.fn(),
}));

vi.mock("@/services/NavigationService", () => ({
    default: { determineSpaceDestination, determinePostLoginDestination },
}));

import { localeFromPathname, resolveCampaignDeleteDestination } from "@/lib/campaignDeleteNavigation";

describe("resolveCampaignDeleteDestination (FR-welcome-onboarding-fallbacks §3)", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("returns the Campaign fallback when the campaign has no character left", async () => {
        determineSpaceDestination.mockResolvedValue({ path: "/fr/campaigns/camp-1", reason: "no-characters-campaign" });

        await expect(resolveCampaignDeleteDestination("camp-1", "fr")).resolves.toBe("/fr/campaigns/camp-1");
        expect(determineSpaceDestination).toHaveBeenCalledWith("camp-1", "fr");
    });

    it("returns a character of another group of the same campaign, never the Player space", async () => {
        determineSpaceDestination.mockResolvedValue({
            path: "/fr/campaigns/camp-1/groups/g-2/characters/c-9",
            reason: "character-in-space",
        });

        await expect(resolveCampaignDeleteDestination("camp-1", "fr")).resolves.toBe(
            "/fr/campaigns/camp-1/groups/g-2/characters/c-9",
        );
        expect(determinePostLoginDestination).not.toHaveBeenCalled();
    });

    it("falls back to welcome when resolution throws", async () => {
        determineSpaceDestination.mockRejectedValue(new Error("network"));

        await expect(resolveCampaignDeleteDestination("camp-1", "en")).resolves.toBe("/en/welcome");
    });
});

describe("localeFromPathname", () => {
    it("reads the locale segment and defaults to fr", () => {
        expect(localeFromPathname("/en/campaigns/camp-1")).toBe("en");
        expect(localeFromPathname(null)).toBe("fr");
        expect(localeFromPathname("/")).toBe("fr");
    });
});
