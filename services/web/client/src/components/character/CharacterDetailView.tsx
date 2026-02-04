"use client";

import { User } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContentPlaceholder from "@/components/character/TabContentPlaceholder";
import React, { useState } from "react";
import CharacterHistoryTabContent from "@/components/character/tabContents/CharacterHistoryTabContent";

export type CharacterTab = "general" | "combat" | "magic" | "inventory" | "history";

const TAB_COLORS: Record<CharacterTab, string> = {
  general: "blue",
  combat: "red",
  magic: "pink",
  inventory: "yellow",
  history: "green",
};

function isPlayer(character: Player | NPC): character is Player {
  return "progression" in character;
}

interface CharacterDetailViewProps {
  character: Player | NPC;
}

export default function CharacterDetailView({ character }: CharacterDetailViewProps) {
  const t = useTranslations("characterDetail");
  const [activeTab, setActiveTab] = useState<CharacterTab>("general");

  return (
    <div className="min-h-screen">
      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as CharacterTab)}
        className="w-full">
        {/* Header avec onglets et infos du personnage */}
        <div>
          <div className="mx-auto px-4 sm:px-6 md:px-8 py-4">
            <div className="flex flex-col-reverse xl:flex-row items-start xl:items-end xl:justify-between gap-4 xl:gap-8">
              {/* Onglets */}
              <TabsList
                className="bg-transparent gap-1 sm:gap-3 md:gap-4 flex-wrap justify-start self-start xl:self-end"
                role="tablist"
                aria-label={t("tabs.general")}>
                {(["general", "combat", "magic", "inventory", "history"] as CharacterTab[]).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`${tab}-content`}
                    className={`
                                            flex-none py-4 text-sm sm:text-base font-medium rounded-[13px] transition-all whitespace-nowrap
                                            focus:outline-none focus:ring focus:ring-offset-gray-dark focus:ring-white
                                            ${
                                              activeTab === tab
                                                ? `bg-${TAB_COLORS[tab]} ${tab === "combat" ? "text-white" : "text-black"}`
                                                : `text-white bg-gray hover:bg-gray-middle`
                                            }
                                        `}>
                    {t(`tabs.${tab}`)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Infos du personnage */}
              <div className="flex flex-row items-end gap-3 sm:gap-4 md:gap-5 shrink-0 w-full xl:w-auto">
                <div className="text-left xl:text-right mb-2 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{character.name}</h1>
                  {isPlayer(character) ? (
                    <React.Fragment>
                      <p className="text-sm sm:text-base text-white font-semibold">
                        {character.class.map((cls: { name: string; level: number }, index: number) => (
                          <span key={index}>
                            {cls.name} Niv {cls.level}
                            {index < character.class.length - 1 && " / "}
                          </span>
                        ))}
                      </p>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <p className="text-sm sm:text-base text-white font-semibold">
                        <abbr
                          title={t("npc.challengeRating")}
                          className="no-underline cursor-help">
                          {t("npc.challengeRatingAbbr")}
                        </abbr>{" "}
                        {character.challenge.challengeRating < 1
                          ? character.challenge.challengeRating === 0.125
                            ? "1/8"
                            : character.challenge.challengeRating === 0.25
                              ? "1/4"
                              : character.challenge.challengeRating === 0.5
                                ? "1/2"
                                : character.challenge.challengeRating
                          : character.challenge.challengeRating}{" "}
                        ({character.challenge.experiencePoints} XP)
                      </p>
                    </React.Fragment>
                  )}
                  {character.groups && character.groups.length > 0 && (
                    <p className="text-xs sm:text-sm text-white">Groupe : {character.groups[0].label}</p>
                  )}
                </div>

                {/* Photo de profil */}
                <div
                  className="w-28 h-20 sm:w-20 sm:h-24 md:w-40 md:h-28 rounded-[18px] bg-gray flex items-center justify-center overflow-hidden shrink-0"
                  role="img"
                  aria-label={t("placeholder.noImage")}>
                  <User
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-middle-light"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-10 lg:py-4">
          {(["general", "combat", "magic", "inventory", "history"] as CharacterTab[]).map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-0 focus:outline-none"
              role="tabpanel"
              id={`${tab}-content`}
              aria-labelledby={tab}
              tabIndex={0}>
              {(() => {
                switch (tab) {
                  case "general":
                    return (
                      <TabContentPlaceholder
                        tab={tab}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "combat":
                    return (
                      <TabContentPlaceholder
                        tab={tab}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "magic":
                    return (
                      <TabContentPlaceholder
                        tab={tab}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "inventory":
                    return (
                      <TabContentPlaceholder
                        tab={tab}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "history":
                    return (
                      <CharacterHistoryTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
