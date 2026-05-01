"use client";
import Choice, { ChoiceProps } from "@/components/layout/Welcome/Choice";
import { useTranslations } from "use-intl/react";
import { useState } from "react";
import { CreateCampaignDialog } from "@/components/dialogs/CreateCampaignDialog";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setContextMode } from "@/store/slices/environmentSlice";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";

import Campaign from "@public/welcome/campaign.webp";
import Session from "@public/welcome/session.webp";
import Character from "@public/welcome/character.webp";

export default function WelcomePage() {
  const t = useTranslations("welcome");
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isJoinSessionOpen, setIsJoinSessionOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

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
      image: Session,
      realm: "session",
      onClick: () => setIsJoinSessionOpen(true),
    },
    {
      image: Character,
      realm: "character",
      onClick: handleCharacterClick,
    },
  ];

  return (
    <main className="flex flex-col items-center pt-8 md:pt-16 lg:pt-25 h-full px-4 sm:px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
      <h1 className="text-base sm:text-lg md:text-xl">{t("title")}</h1>
      <h2 className="mb-4 sm:mb-6 md:mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-center">{t("subTitle")}</h2>

      <div
        className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-3 xl:gap-6 py-4 md:py-8"
        role="list"
        aria-label={t("choices-list")}>
        {choices.map((choice) => (
          <Choice
            key={choice.realm}
            image={choice.image}
            realm={choice.realm}
            link={choice.link}
            onClick={choice.onClick}
            disabled={choice.disabled}
            tooltip={choice.tooltip}
          />
        ))}
      </div>

      <CreateCampaignDialog
        open={isCreateCampaignOpen}
        onOpenChange={setIsCreateCampaignOpen}
      />
      <JoinSessionDialog
        open={isJoinSessionOpen}
        onOpenChange={setIsJoinSessionOpen}
      />
    </main>
  );
}
