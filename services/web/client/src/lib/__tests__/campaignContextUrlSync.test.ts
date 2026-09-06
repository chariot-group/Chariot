import { describe, expect, it } from "vitest";
import {
  extractCampaignIdFromPathname,
  extractGroupIdFromPathname,
  resolveCampaignContextUrlSync,
  resolveCampaignIdToSync,
  shouldApplyCampaignIdFromPlan,
} from "@/lib/campaignContextUrlSync";

/** @see FR-campaign-context-url-sync: Cohérence campagne URL / Redux et historique navigateur */
describe("FR-campaign-context-url-sync — campaign URL → Redux sync helpers", () => {
  describe("extractCampaignIdFromPathname", () => {
    it("nominal: extracts campaignId from character sheet route", () => {
      expect(
        extractCampaignIdFromPathname(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
        ),
      ).toBe("camp-a");
    });

    it("nominal: extracts campaignId from session route under campaign", () => {
      expect(extractCampaignIdFromPathname("/en/campaigns/camp-b/session/ABCD12")).toBe(
        "camp-b",
      );
    });

    it("edge: returns null outside /campaigns/…", () => {
      expect(extractCampaignIdFromPathname("/fr/characters/char-x")).toBeNull();
      expect(extractCampaignIdFromPathname("/fr/welcome")).toBeNull();
      expect(extractCampaignIdFromPathname("/fr")).toBeNull();
      expect(extractCampaignIdFromPathname(null)).toBeNull();
      expect(extractCampaignIdFromPathname("")).toBeNull();
    });
  });

  describe("extractGroupIdFromPathname", () => {
    it("nominal: extracts groupId from character sheet route", () => {
      expect(
        extractGroupIdFromPathname("/fr/campaigns/camp-a/groups/g1/characters/char-x"),
      ).toBe("g1");
    });

    it("edge: returns null when no group segment", () => {
      expect(extractGroupIdFromPathname("/fr/campaigns/camp-a/session/ABCD12")).toBeNull();
      expect(extractGroupIdFromPathname("/fr/characters/char-x")).toBeNull();
    });
  });

  describe("resolveCampaignIdToSync", () => {
    it("nominal: back from B to A while Redux still on B → sync to A", () => {
      expect(
        resolveCampaignIdToSync(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
          "camp-b",
        ),
      ).toBe("camp-a");
    });

    it("edge: already aligned → no sync", () => {
      expect(
        resolveCampaignIdToSync(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
          "camp-a",
        ),
      ).toBeNull();
    });

    it("edge: deep link with Redux on another campaign → sync", () => {
      expect(
        resolveCampaignIdToSync(
          "/fr/campaigns/camp-b/groups/g2/characters/char-y",
          "camp-a",
        ),
      ).toBe("camp-b");
    });

    it("failure / guard: player-space path does not force or clear campaign", () => {
      expect(resolveCampaignIdToSync("/fr/characters/char-x", "camp-b")).toBeNull();
      expect(resolveCampaignIdToSync("/fr/welcome", null)).toBeNull();
    });
  });

  describe("resolveCampaignContextUrlSync", () => {
    it("nominal: campaign switch queues group expand from focused character URL", () => {
      expect(
        resolveCampaignContextUrlSync(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
          "camp-b",
          ["g-from-b"],
        ),
      ).toEqual({
        campaignId: "camp-a",
        groupIdToOpen: "g1",
      });
    });

    it("edge: same campaign with closed group → only queue group expand", () => {
      expect(
        resolveCampaignContextUrlSync(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
          "camp-a",
          [],
        ),
      ).toEqual({
        campaignId: null,
        groupIdToOpen: "g1",
      });
    });

    it("edge: campaign + group already open → no plan", () => {
      expect(
        resolveCampaignContextUrlSync(
          "/fr/campaigns/camp-a/groups/g1/characters/char-x",
          "camp-a",
          ["g1"],
        ),
      ).toBeNull();
    });

    it("failure / guard: session route under campaign syncs campaign without group", () => {
      expect(
        resolveCampaignContextUrlSync("/fr/campaigns/camp-a/session/ABCD12", "camp-b", []),
      ).toEqual({
        campaignId: "camp-a",
        groupIdToOpen: null,
      });
    });
  });

  describe("shouldApplyCampaignIdFromPlan", () => {
    it("nominal: applies campaign sync only when pathname changed", () => {
      const plan = {
        campaignId: "camp-a",
        groupIdToOpen: "g1" as string | null,
      };
      expect(shouldApplyCampaignIdFromPlan(plan, true)).toBe(true);
      expect(shouldApplyCampaignIdFromPlan(plan, false)).toBe(false);
    });

    it("guard: Redux-ahead-of-URL (sidebar click) must not apply campaign from stale path", () => {
      expect(
        shouldApplyCampaignIdFromPlan(
          { campaignId: "camp-a", groupIdToOpen: "g1" },
          false,
        ),
      ).toBe(false);
    });
  });
});
