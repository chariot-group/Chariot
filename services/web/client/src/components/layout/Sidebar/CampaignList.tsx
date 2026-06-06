"use client";

import { useCampaigns } from "@/hooks/useCampaigns";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setContextMode } from "@/store/slices/environmentSlice";
import { selectSelectedCampaignId, setSelectedCampaign, setGroupToOpen } from "@/store/slices/campaignContextSlice";
import { setOpenActiveGroups } from "@/store/slices/sidebarSlice";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import NavigationService from "@/services/NavigationService";

/**
 * Liste des campagnes : zone à hauteur max fixe, tout le contenu (y compris « Charger plus ») défile ensemble.
 */
export default function CampaignList() {
  const t = useTranslations("sidebar");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const { campaigns, loading, loadingMore, hasMore, loadMoreCampaigns, error } = useCampaigns({
    autoFetch: false,
    pageSize: 5,
  });

  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const dispatch = useAppDispatch();

  const handleCampaignClick = async (campaignId: string) => {
    dispatch(setSelectedCampaign(campaignId));
    dispatch(setContextMode("gm"));
    dispatch(setOpenActiveGroups(true));

    const destination = await NavigationService.determineSpaceDestination(campaignId, locale);

    if (destination.groupId) {
      dispatch(setGroupToOpen(destination.groupId));
    }

    router.push(destination.path);
  };

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
    <div className="mt-1 flex min-h-0 w-full max-h-52 flex-col overflow-y-auto overflow-x-hidden gap-2 overscroll-contain py-0.5 pr-0.5">
      {campaigns.map((campaign) => {
        const isSelected = selectedCampaignId === campaign._id;
        return (
          <button
            type="button"
            key={campaign._id}
            onClick={() => handleCampaignClick(campaign._id)}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? t("selectedCampaign") : t("selectCampaign")} ${campaign.label}`}
            className={`text-sm cursor-pointer rounded-[12px] py-1.5 px-3 text-white text-left transition-all duration-100 w-full shrink-0 focus-visible:border truncate ${
              isSelected ? "bg-card font-bold" : "hover:bg-card"
            }`}>
            {campaign.label}
          </button>
        );
      })}

      {hasMore && (
        <button
          type="button"
          key="campaign-list-load-more"
          onClick={() => void loadMoreCampaigns()}
          disabled={loadingMore}
          aria-busy={loadingMore}
          aria-label={t("loadMoreCampaignsAria")}
          className="text-xs shrink-0 cursor-pointer rounded-[12px] py-1.5 px-3 text-white/90 text-center transition-all duration-100 w-full border border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border">
          {loadingMore ? (
            <Loader2
              className="w-4 h-4 animate-spin mx-auto"
              aria-hidden
            />
          ) : (
            t("loadMoreCampaigns")
          )}
        </button>
      )}
    </div>
  );
}
