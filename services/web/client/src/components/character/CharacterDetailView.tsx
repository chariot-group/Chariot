"use client";

import { User, SquarePen } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContentPlaceholder from "@/components/character/TabContentPlaceholder";
import CharacterInventoryTabContent from "@/components/character/tabContents/CharacterInventoryTabContent";
import React, { useState } from "react";
import CharacterHistoryTabContent from "@/components/character/tabContents/CharacterHistoryTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import Image from "next/image";
import CharacterMagicTabContent from "@/components/character/tabContents/CharacterMagicTabContent";
import { isPlayer } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";

export type CharacterTab = "general" | "combat" | "magic" | "inventory" | "history";

const TAB_COLORS: Record<CharacterTab, string> = {
  general: "blue",
  combat: "red",
  magic: "pink",
  inventory: "yellow",
  history: "green",
};

interface CharacterDetailViewProps {
  character: Player | NPC;
}

export default function CharacterDetailView({ character }: CharacterDetailViewProps) {
  const t = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
  const tPlaceholder = useTranslations("characterDetail.placeholder");
  const [activeTab, setActiveTab] = useState<CharacterTab>("general");

  return (
    <main className="flex flex-col h-full overflow-hidden">
      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as CharacterTab)}
        className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header avec onglets et infos du personnage */}
        <div className="shrink-0">
          <div className="mx-auto sm:px-6 md:px-8 px-2">
            <div className="flex flex-col-reverse xl:flex-row items-start xl:items-end xl:justify-between gap-0 xl:gap-8">
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
                                            flex-none p-2 md:p-4 text-sm sm:text-base font-medium rounded-[13px] transition-all whitespace-nowrap
                                            focus:outline-none focus:ring focus:ring-offset-gray-dark focus:ring-white
                                            ${activeTab === tab
                        ? `bg-${TAB_COLORS[tab]} ${tab === "combat" ? "text-white" : "text-black"}`
                        : `text-white bg-gray hover:bg-gray-middle`
                      }
                                        `}>
                    {t(`tabs.${tab}`)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Infos du personnage */}
              <div className="flex flex-row items-end gap-3 px-1.5 sm:px-0 sm:gap-4 md:gap-5 shrink-0 w-full xl:w-auto">
                <div className="text-left xl:text-right mb-2 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {character.firstname} {character.lastname}
                  </h1>
                  {isPlayer(character) ? (
                    <React.Fragment>
                      <p className="text-sm sm:text-base text-white font-semibold">
                        {character.class.map((cls: { name: string; level: number }, index: number) => (
                          <span key={index}>
                            {tClass(cls.name)} Niv {cls.level}
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
                    <p className="text-xs sm:text-sm text-white">
                      {t("group")} : {character.groups[0].label}
                    </p>
                  )}
                </div>

                {/* Photo de profil */}
                <div
                  className="max-[425px]:hidden w-28 h-20 sm:w-20 sm:h-24 md:w-40 md:h-28 rounded-[15px] bg-gray flex items-center justify-center overflow-hidden shrink-0"
                  role="img"
                  aria-label={tPlaceholder("noImage")}>
                  <User
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-middle-light"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu des onglets - scrollable */}
        <div className="flex-1 overflow-y-auto w-full mx-auto px-4 sm:px-6 md:px-8 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
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
                      <CharacterGeneralTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "combat":
                    return (
                      <CharacterBattleTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "magic":
                    return (
                      <CharacterMagicTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                      />
                    );
                  case "inventory":
                    return (
                      <CharacterInventoryTabContent
                        character={character}
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

      {/* Footer avec bouton - fixe en bas */}
      <div className="shrink-0 w-full px-4 sm:px-6 md:px-10 py-5 border-t border-transparent">
        <div className="w-full mx-auto flex flex-row-reverse">
          <Button
            type="button"
            onClick={() => {
              // Pour le moment, ne fait rien
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                // Pour le moment, ne fait rien
              }
            }}
            className={`
              text-lg font-semibold py-5.5
              ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
              ${activeTab === "combat" ? "bg-red hover:bg-red/90 text-white" : ""}
              ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
              ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
              ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
            `}
            aria-label={t("editCharacter")}>
            <SquarePen className="size-5" aria-hidden="true" />
            {t("editCharacter")}
          </Button>
        </div>
      </div>
    </main>
  );
}
