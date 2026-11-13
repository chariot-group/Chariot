import type { QuickLink } from "@/types/quickLink";

/**
 * A link is shared ("commun") when it is visible in more than one space.
 * @see FR-sidebar-quick-links
 */
export function isSharedQuickLink(link: QuickLink): boolean {
  return link.visibleInAllCampaigns === true || (link.campaignId !== null && link.visibleInPlayerSpace === true);
}

/** Splits the links of a space into its own links and the shared ones, keeping their order. */
export function splitQuickLinks(links: QuickLink[]): { own: QuickLink[]; shared: QuickLink[] } {
  const own: QuickLink[] = [];
  const shared: QuickLink[] = [];
  for (const link of links) {
    (isSharedQuickLink(link) ? shared : own).push(link);
  }
  return { own, shared };
}

/**
 * Whether a link is listed in a space: a campaign id, `null` for the player space,
 * or `undefined` when no space filter applies.
 */
export function isQuickLinkVisibleIn(link: QuickLink, campaignId: string | null | undefined): boolean {
  if (campaignId === undefined) return true;
  if (campaignId === null) return link.campaignId === null || link.visibleInPlayerSpace === true;
  return link.campaignId === campaignId || link.visibleInAllCampaigns === true;
}
