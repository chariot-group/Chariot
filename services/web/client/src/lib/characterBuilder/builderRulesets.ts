import type { RulesetSummary } from "@/services/RulesetService";
import type { Campaign } from "@/types/campaign";

export type BuilderRulesetSources = {
  listRulesets: () => Promise<RulesetSummary[]>;
  getCampaign: (id: string) => Promise<Pick<Campaign, "rulesetId" | "gameSystem">>;
  resolveRuleset: (reference: { rulesetId?: string | null; gameSystem?: string }) => Promise<RulesetSummary | null>;
};

/**
 * Rulesets offered by the builder. In a campaign: only the campaign ruleset (its `rulesetId`, the published version of
 * its key when archived, or the published ruleset of its game system), so the builder starts on it directly; when none
 * resolves (or the campaign cannot be read), every published ruleset, as in Player space.
 * @see FR-ruleset-character-builder — Web builder UI (Entry point and routes)
 */
export async function loadBuilderRulesets(
  campaignId: string | null | undefined,
  sources: BuilderRulesetSources,
): Promise<RulesetSummary[]> {
  if (campaignId) {
    try {
      const campaign = await sources.getCampaign(campaignId);
      const resolved = await sources.resolveRuleset({
        rulesetId: campaign.rulesetId,
        gameSystem: campaign.gameSystem,
      });
      if (resolved) return [resolved];
    } catch {
      // Falls back to the published rulesets below.
    }
  }
  return sources.listRulesets();
}
