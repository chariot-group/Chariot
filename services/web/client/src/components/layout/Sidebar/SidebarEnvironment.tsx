"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setContextMode, selectIsGmMode } from "@/store/slices/environmentSlice";
import { selectSelectedCampaignId, setSelectedCampaign, setGroupToOpen } from "@/store/slices/campaignContextSlice";
import { useCampaigns } from "@/hooks/useCampaigns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Check, ChevronDown, Loader2, PlusCircleIcon, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { CreateCampaignDialog } from "@/components/dialogs/CreateCampaignDialog";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "react-redux";
import { RootState } from "@/store";
import NavigationService from "@/services/NavigationService";
import { cn } from "@/lib/utils";

export default function SidebarEnvironment() {
  const t = useTranslations("sidebar");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const isGmMode = useAppSelector(selectIsGmMode);
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const { campaigns, loading, hasMore, loadingMore, loadMoreCampaigns } = useCampaigns({ autoFetch: false, pageSize: 5 });

  const switchToPlayer = async () => {
    dispatch(setContextMode("player"));
    dispatch(setSelectedCampaign(null));

    const destination = await NavigationService.determinePlayerSpaceDestination(
      locale,
      dispatch,
      store.getState.bind(store),
    );
    router.push(destination.path);
    toast.info(t("environmentChanged", { space: t("playerSpace").toLocaleLowerCase() }));
  };

  const handleCampaignSelect = async (campaignId: string) => {
    dispatch(setSelectedCampaign(campaignId));
    dispatch(setContextMode("gm"));

    const destination = await NavigationService.determineSpaceDestination(campaignId, locale);
    if (destination.groupId) {
      dispatch(setGroupToOpen(destination.groupId));
    }
    router.push(destination.path);
  };

  const joueurActive = !isGmMode;

  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label={t("yourSpaces")}>
      {/* ── Joueur button — direct switch ── */}
      <button
        type="button"
        onClick={switchToPlayer}
        aria-pressed={joueurActive}
        aria-label={t("playerSpace")}
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[13px] border py-2 px-3 text-sm transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          joueurActive
            ? "border-white bg-white font-semibold text-black"
            : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
        )}>
        <User
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <span className="truncate">{t("playerSpaceShort")}</span>
      </button>

      {/* ── MJ button — opens campaign dropdown ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-pressed={isGmMode}
            aria-label={t("gmSpace")}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[13px] border py-2 px-3 text-sm transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              isGmMode
                ? "border-white bg-white font-semibold text-black"
                : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
            )}>
            <BookOpen
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{t("gmSpaceAbbr")}</span>
            <ChevronDown
              className="ml-auto h-3 w-3 shrink-0 transition-transform duration-150 [[data-state=open]_&]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-[--radix-dropdown-menu-trigger-width] rounded-[14px] border-white/12 bg-[#1f1f24] p-1.5">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2
                className="h-4 w-4 animate-spin text-white/50"
                aria-hidden
              />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="px-3 py-2 text-xs text-white/40">{t("noCampaigns")}</div>
          ) : (
            <>
              {campaigns.map((campaign) => {
                const isSelected = selectedCampaignId === campaign._id && isGmMode;
                return (
                  <DropdownMenuItem
                    key={campaign._id}
                    onSelect={() => handleCampaignSelect(campaign._id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-white",
                      "hover:bg-white/10 focus:bg-white/10 focus:text-white",
                      isSelected && "font-medium",
                    )}>
                    <BookOpen
                      className="h-4 w-4 shrink-0 text-white/40"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{campaign.label}</span>
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </DropdownMenuItem>
                );
              })}
              {hasMore && (
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => void loadMoreCampaigns()}
                  disabled={loadingMore}
                  className="flex cursor-pointer items-center justify-center rounded-[10px] px-3 py-2 text-xs text-white/50 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {loadingMore ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    t("loadMoreCampaigns")
                  )}
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator className="mx-1 bg-white/10" />

          <CreateCampaignDialog>
            <DropdownMenuItem
              asChild
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer rounded-[10px] px-3 py-2 text-sm text-white hover:bg-white/10 focus:bg-white/10">
              <button
                type="button"
                className="flex w-full items-center gap-2">
                <PlusCircleIcon
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {t("createCampaign")}
              </button>
            </DropdownMenuItem>
          </CreateCampaignDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
