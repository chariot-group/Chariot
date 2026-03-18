"use client";

import { useCampaigns } from "@/hooks/useCampaigns";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setContextMode } from "@/store/slices/environmentSlice";
import { selectSelectedCampaignId, setSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { useTranslations } from "next-intl";

/**
 * Campaign list component with infinite scroll
 * Displays user's campaigns and allows selection
 * Auto-loads more campaigns when scrolling to bottom
 *
 * autoFetch=false: NavigationService loads campaigns at login; hook respects 3s cooldown
 */
export default function CampaignList() {
  const t = useTranslations("sidebar");
  const { campaigns, loading, loadingMore, hasMore, loadMoreCampaigns, error } = useCampaigns({
    autoFetch: false,
    pageSize: 5,
  });

  const observerTarget = useRef<HTMLDivElement>(null);
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const dispatch = useAppDispatch();

  /**
   * Handle campaign selection
   * Switches to GM mode and sets selected campaign
   */
  const handleCampaignClick = (campaignId: string) => {
    dispatch(setSelectedCampaign(campaignId));
    dispatch(setContextMode("gm"));
  };

  /**
   * Intersection Observer callback for infinite scroll
   * Loads more campaigns when user scrolls to bottom
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loadingMore) {
        loadMoreCampaigns();
      }
    },
    [hasMore, loadingMore, loadMoreCampaigns],
  );

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleObserver]);

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-black" />
      </div>
    );
  }

  if (error || campaigns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 max-h-75 overflow-y-auto mt-1">
      {campaigns.map((campaign) => {
        const isSelected = selectedCampaignId === campaign._id;
        return (
          <button
            type="button"
            key={campaign._id}
            onClick={() => handleCampaignClick(campaign._id)}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? t("selectedCampaign") : t("selectCampaign")} ${campaign.label}`}
            className={`text-sm cursor-pointer rounded-[12px] py-1.5 px-3 text-white text-left transition-all duration-100 w-full focus-visible:border truncate ${
              isSelected ? "bg-card font-bold" : "hover:bg-card hover:font-bold"
            }`}>
            {campaign.label}
          </button>
        );
      })}

      {/* Intersection Observer target for infinite scroll */}
      <div
        ref={observerTarget}
        className="h-1"
      />

      {/* Loading indicator for pagination */}
      {loadingMore && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
