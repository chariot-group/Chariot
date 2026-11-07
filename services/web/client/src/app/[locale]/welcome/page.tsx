"use client";
import Choice, { ChoiceProps } from "@/components/layout/Welcome/Choice";
import { useTranslations } from "use-intl/react";
import { useEffect, useState } from "react";
import { useLocale } from "use-intl";
import { useStore } from "react-redux";
import { CreateCampaignDialog } from "@/components/dialogs/CreateCampaignDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import type { RootState } from "@/store";
import { setContextMode } from "@/store/slices/environmentSlice";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import NavigationService from "@/services/NavigationService";

import Campaign from "@public/welcome/campaign.webp";
import Character from "@public/welcome/character.webp";

export default function WelcomePage() {
  const t = useTranslations("welcome");
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const hasJoinCode = Boolean(searchParams.get("join"));

  // FR-welcome-onboarding-fallbacks: welcome is only for users with no campaign and no player-space character.
  useEffect(() => {
    if (hasJoinCode) return;
    let cancelled = false;
    void NavigationService.determinePostLoginDestination(locale, dispatch, store.getState).then((destination) => {
      if (!cancelled && destination.reason !== "no-characters") router.replace(destination.path);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, hasJoinCode, locale, router, store]);

  const handleCampaignClick = () => {
    setIsCreateCampaignOpen(true);
  };

  const handleCharacterClick = () => {
    dispatch(setContextMode("player"));
    dispatch(clearSelectedCampaign());
    router.push("/characters/new/players");
  };

  const choices: ChoiceProps[] = [
    {
      image: Campaign,
      realm: "campaign",
      onClick: handleCampaignClick,
    },
    {
      image: Character,
      realm: "character",
      onClick: handleCharacterClick,
    },
  ];

  return (
    <main className="flex flex-col items-center pt-8 md:pt-16 lg:pt-25 h-full px-4 sm:px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-thumb]:rounded-full">
      <h1 className="text-base sm:text-lg md:text-xl">{t("title")}</h1>
      <h2 className="mb-4 sm:mb-6 md:mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-center">{t("subTitle")}</h2>

      <div
        className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-2 xl:gap-6 py-4 md:py-8"
        role="list"
        aria-label={t("choices-list")}>
        {choices.map((choice) => (
          <Choice
            key={choice.realm}
            image={choice.image}
            realm={choice.realm}
            link={choice.link}
            onClick={choice.onClick}
          />
        ))}
      </div>

      <CreateCampaignDialog
        open={isCreateCampaignOpen}
        onOpenChange={setIsCreateCampaignOpen}
        onCreated={(campaignId) => router.push(`/campaigns/${campaignId}`)}
      />
    </main>
  );
}
