"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectSelectedCampaignId,
  setGroupToOpen,
  setSelectedCampaign,
} from "@/store/slices/campaignContextSlice";
import { selectOpenGroupId } from "@/store/slices/groupSlice";
import {
  resolveCampaignContextUrlSync,
  shouldApplyCampaignIdFromPlan,
  shouldApplyGroupRepairFromPlan,
} from "@/lib/campaignContextUrlSync";

/**
 * Aligns `campaignContext.selectedCampaignId` with `/campaigns/{id}/...` URLs
 * (including browser back/forward) and re-expands the group of the focused character.
 * Groups reload via `useGroups` when the campaign id changes.
 * @see FR-campaign-context-url-sync
 */
export default function CampaignContextUrlSync() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const openGroupId = useAppSelector(selectOpenGroupId);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    const plan = resolveCampaignContextUrlSync(pathname, selectedCampaignId, openGroupId);
    if (!plan) return;

    if (shouldApplyCampaignIdFromPlan(plan, pathnameChanged)) {
      dispatch(setSelectedCampaign(plan.campaignId as string));
      if (plan.groupIdToOpen !== undefined) {
        dispatch(setGroupToOpen(plan.groupIdToOpen));
      }
      return;
    }

    // Group-only expand on navigation — never fight an in-flight campaign select, and never
    // re-open a group the user just collapsed while the URL did not change.
    if (shouldApplyGroupRepairFromPlan(plan, pathnameChanged)) {
      dispatch(setGroupToOpen(plan.groupIdToOpen as string | null));
    }
  }, [dispatch, pathname, selectedCampaignId, openGroupId]);

  return null;
}
