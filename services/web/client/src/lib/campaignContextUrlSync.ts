/**
 * Keep Redux campaign context aligned with campaign-scoped URLs (browser history).
 * @see FR-campaign-context-url-sync
 */

const CAMPAIGN_PATH_RE = /\/campaigns\/([^/?#]+)/;
const GROUP_PATH_RE = /\/campaigns\/[^/?#]+\/groups\/([^/?#]+)/;

export type CampaignContextUrlSyncPlan = {
  /** When set, dispatch `setSelectedCampaign` with this id. */
  campaignId: string | null;
  /**
   * When set (including `null`), dispatch `setGroupToOpen`.
   * `undefined` means leave `groupToOpen` untouched.
   */
  groupIdToOpen: string | null | undefined;
};

/**
 * Returns the campaignId segment from a pathname, or null when outside `/campaigns/...`.
 */
export function extractCampaignIdFromPathname(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const match = pathname.match(CAMPAIGN_PATH_RE);
  const id = match?.[1]?.trim();
  return id || null;
}

/**
 * Returns the groupId segment from a campaign group route, or null when absent.
 */
export function extractGroupIdFromPathname(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const match = pathname.match(GROUP_PATH_RE);
  const id = match?.[1]?.trim();
  return id || null;
}

/**
 * Returns the campaignId that should be written to Redux, or null when no campaign sync is needed.
 * Does not clear selection on non-campaign routes (player space / welcome / etc.).
 */
export function resolveCampaignIdToSync(
  pathname: string | null | undefined,
  selectedCampaignId: string | null | undefined,
): string | null {
  const fromUrl = extractCampaignIdFromPathname(pathname);
  if (!fromUrl) return null;
  if (fromUrl === selectedCampaignId) return null;
  return fromUrl;
}

/**
 * Full sync plan: campaign id + group to expand for the focused character route.
 * After a campaign switch, `clearGroups` wipes `openGroupId` — `groupIdToOpen` restores expand.
 */
export function resolveCampaignContextUrlSync(
  pathname: string | null | undefined,
  selectedCampaignId: string | null | undefined,
  openGroupIds: string[] | null | undefined,
): CampaignContextUrlSyncPlan | null {
  const campaignIdFromUrl = extractCampaignIdFromPathname(pathname);
  if (!campaignIdFromUrl) return null;

  const groupIdFromUrl = extractGroupIdFromPathname(pathname);
  const open = Array.isArray(openGroupIds) ? openGroupIds : [];
  const needsCampaignSync = campaignIdFromUrl !== selectedCampaignId;

  if (needsCampaignSync) {
    return {
      campaignId: campaignIdFromUrl,
      // Always (re)queue expand from URL; openGroupId will be cleared with the campaign cache.
      groupIdToOpen: groupIdFromUrl,
    };
  }

  if (groupIdFromUrl && !open.includes(groupIdFromUrl)) {
    return {
      campaignId: null,
      groupIdToOpen: groupIdFromUrl,
    };
  }

  return null;
}

/**
 * Campaign id from the URL must only be applied when the pathname changed.
 * Otherwise a sidebar campaign click (Redux updated before `router.push`) would be
 * reverted to the still-visible previous URL.
 */
export function shouldApplyCampaignIdFromPlan(
  plan: CampaignContextUrlSyncPlan | null,
  pathnameChanged: boolean,
): boolean {
  return Boolean(plan?.campaignId) && pathnameChanged;
}
