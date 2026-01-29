"use client";
import Choice, { ChoiceProps } from "@/components/layout/Welcome/Choice";
import { useTranslations } from "use-intl/react";

import Campaign from "@public/welcome/campaign.svg";
import Session from "@public/welcome/session.svg";
import Character from "@public/welcome/character.svg";

export default function WelcomePage() {
  const t = useTranslations("welcome");

  const choices: ChoiceProps[] = [
    {
      image: Campaign,
      realm: "campaign",
      link: "#",
    },
    {
      image: Session,
      realm: "session",
      link: "#",
    },
    {
      image: Character,
      realm: "character",
      link: "#",
    },
  ];

  return (
    <div className="flex flex-col items-center pt-8 md:pt-16 lg:pt-25 h-full px-4 sm:px-6 md:px-8">
      <h1 className="text-base sm:text-lg md:text-xl">{t("title")}</h1>
      <h2 className="mb-4 sm:mb-6 md:mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-center">{t("subTitle")}</h2>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 py-4 md:py-8">
        {choices.map((choice, index) => (
          <Choice
            key={index}
            image={choice.image}
            realm={choice.realm}
            link={choice.link}
          />
        ))}
      </div>
    </div>
  );
}
