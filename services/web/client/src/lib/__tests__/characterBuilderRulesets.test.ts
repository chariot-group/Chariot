import { describe, expect, it, vi } from "vitest";
import { loadBuilderRulesets, type BuilderRulesetSources } from "@/lib/characterBuilder/builderRulesets";
import { buildCharacterBuilderRoutes } from "@/lib/characterBuilder/builderRoutes";
import { buildPlayerDraftFromSheet } from "@/lib/characterBuilder/builderDraft";
import type { RulesetSummary } from "@/services/RulesetService";

/** @see FR-ruleset-character-builder — Entry point and routes; FR-game-system — Ruleset reference */
const ruleset = (id: string) => ({ _id: id, key: "dnd5e-2014", status: "published" }) as RulesetSummary;

const sources = (overrides: Partial<BuilderRulesetSources> = {}): BuilderRulesetSources => ({
  listRulesets: vi.fn().mockResolvedValue([ruleset("a"), ruleset("b")]),
  getCampaign: vi.fn().mockResolvedValue({ rulesetId: "v4", gameSystem: "DND_5E" }),
  resolveRuleset: vi.fn().mockResolvedValue(ruleset("v5")),
  ...overrides,
});

describe("loadBuilderRulesets", () => {
  it("nominal: in a campaign, only the campaign ruleset is offered (the builder starts on it)", async () => {
    const s = sources();

    await expect(loadBuilderRulesets("c1", s)).resolves.toEqual([ruleset("v5")]);
    expect(s.getCampaign).toHaveBeenCalledWith("c1");
    expect(s.resolveRuleset).toHaveBeenCalledWith({ rulesetId: "v4", gameSystem: "DND_5E" });
    expect(s.listRulesets).not.toHaveBeenCalled();
  });

  it("edge: in Player space, every published ruleset is offered", async () => {
    const s = sources();

    await expect(loadBuilderRulesets(null, s)).resolves.toHaveLength(2);
    expect(s.getCampaign).not.toHaveBeenCalled();
  });

  it("edge: nothing resolves for the campaign → back to the published rulesets", async () => {
    const s = sources({ resolveRuleset: vi.fn().mockResolvedValue(null) });

    await expect(loadBuilderRulesets("c1", s)).resolves.toHaveLength(2);
  });

  it("failure: the campaign cannot be read → back to the published rulesets", async () => {
    const s = sources({ getCampaign: vi.fn().mockRejectedValue(new Error("403")) });

    await expect(loadBuilderRulesets("c1", s)).resolves.toHaveLength(2);
    expect(s.resolveRuleset).not.toHaveBeenCalled();
  });

  it("failure: the published rulesets cannot be listed → the error reaches the builder (error state)", async () => {
    const s = sources({ listRulesets: vi.fn().mockRejectedValue(new Error("down")) });

    await expect(loadBuilderRulesets(null, s)).rejects.toThrow("down");
  });
});

describe("builder routes and draft", () => {
  it("nominal: the campaign route carries its campaign, the Player space none", () => {
    expect(buildCharacterBuilderRoutes({ campaignId: "c1", groupId: "g1" }).campaignId).toBe("c1");
    expect(buildCharacterBuilderRoutes().campaignId).toBeNull();
  });

  it("nominal: the draft keeps the ruleset used; none given → no rulesetId", () => {
    expect(buildPlayerDraftFromSheet({}, "g1", "v5")).toMatchObject({ rulesetId: "v5", groups: ["g1"] });
    expect(buildPlayerDraftFromSheet({}, null, null)).not.toHaveProperty("rulesetId");
  });
});
