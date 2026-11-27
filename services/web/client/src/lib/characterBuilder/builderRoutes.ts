import type { CampaignCreateContext } from "@/lib/codexCharacterCreate";

/**
 * Routes of the character builder: its session scope, the Player form opened at the end (`?fromBuilder=1`),
 * the manual form (empty state) and the « Cancel » destination, in Player space or in a campaign group.
 * @see FR-ruleset-character-builder — Web builder UI (Entry point and routes)
 */
export function buildCharacterBuilderRoutes(context?: CampaignCreateContext) {
  if (context) {
    const base = `/campaigns/${context.campaignId}/groups/${context.groupId}/characters/new`;
    return {
      scope: `group:${context.groupId}`,
      campaignId: context.campaignId,
      groupId: context.groupId,
      formPath: `${base}/players?fromBuilder=1`,
      manualFormPath: `${base}/players`,
      cancelPath: `/campaigns/${context.campaignId}`,
    };
  }
  return {
    scope: "player-space",
    campaignId: null,
    groupId: null,
    formPath: "/characters/new/players?fromBuilder=1",
    manualFormPath: "/characters/new/players",
    cancelPath: "/characters",
  };
}
