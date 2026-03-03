"use client";

import { User, SquarePen, X, Save } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import CharacterInventoryTabContent from "@/components/character/tabContents/inventory/CharacterInventoryTabContent";
import React, { useState, useEffect } from "react";
import CharacterHistoryTabContent from "@/components/character/tabContents/history/CharacterHistoryTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import CharacterMagicTabContent from "@/components/character/tabContents/magic/CharacterMagicTabContent";
import CharacterTabs, { CharacterTab, TAB_COLORS, CHARACTER_TABS } from "@/components/character/CharacterTabs";
import { isPlayer } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";
import { useCharacterForm, CharacterType } from "@/hooks/useCharacterForm";
import { useSearchParams, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CharacterDetailViewProps {
  character: Player | NPC;
  onCharacterUpdate?: () => void; // Callback pour rafraîchir les données du parent
}

export default function CharacterDetailView({ character, onCharacterUpdate }: CharacterDetailViewProps) {
  const t = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
  const tPlaceholder = useTranslations("characterDetail.placeholder");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lire l'onglet actif depuis l'URL (ou "general" par défaut)
  const tabFromUrl = (searchParams.get("tab") as CharacterTab) || "general";
  const [activeTab, setActiveTab] = useState<CharacterTab>(tabFromUrl);

  // Synchroniser l'état local avec l'URL au chargement
  useEffect(() => {
    const currentTab = (searchParams.get("tab") as CharacterTab) || "general";
    setActiveTab(currentTab);
  }, [searchParams]);

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = (newTab: string) => {
    const tab = newTab as CharacterTab;
    setActiveTab(tab);
    // Mettre à jour l'URL sans recharger la page
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Déterminer le type de personnage
  const characterType: CharacterType = isPlayer(character) ? "players" : "npcs";

  // Initialiser le formulaire avec useCharacterForm
  const { form, onUpdate, onCancel, isEditing, setIsEditing, isSaving } = useCharacterForm({
    characterId: character._id,
    type: characterType,
    onSuccess: () => {
      // Rafraîchir les données du parent après la mise à jour
      if (onCharacterUpdate) {
        onCharacterUpdate();
      }
    },
  });

  // Si on arrive avec mode=edit (création depuis la sidebar, ou autre lien), ouvrir directement en édition
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "edit") {
      setIsEditing(true);
    }
  }, [searchParams, setIsEditing]);

  return (
    <main className="flex flex-col h-full overflow-hidden">
      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header avec onglets et infos du personnage */}
        <div className="shrink-0">
          <div className="mx-auto sm:px-6 md:px-8 px-2">
            <div className="justify-between w-full">
              {/* Infos du personnage */}
              <div className="flex flex-row items-end justify-between gap-4 xl:mb-0 mb-2">
                <div className="flex flex-col items-start xl:items-end text-left xl:text-right xl:max-w-full lg:max-w-3/4 md:max-w-2/3 w-full">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help w-full">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white text-start xl:text-end truncate">
                        {character.firstname} {character.lastname}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent>
                      {character.firstname} {character.lastname}
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-sm sm:text-base text-gray-light italic truncate">{character.surname}</h2>
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
                        {(() => {
                          const challengeRating = character.challenge?.challengeRating ?? 0;
                          const experiencePoints = character.challenge?.experiencePoints ?? 0;

                          const displayChallengeRating =
                            challengeRating < 1
                              ? challengeRating === 0.125
                                ? "1/8"
                                : challengeRating === 0.25
                                  ? "1/4"
                                  : challengeRating === 0.5
                                    ? "1/2"
                                    : challengeRating
                              : challengeRating;

                          return (
                            <p className="text-sm sm:text-base text-white font-semibold">
                              <abbr
                                title={t("npc.challengeRating")}
                                className="no-underline cursor-help">
                                {t("npc.challengeRatingAbbr")}
                              </abbr>{" "}
                              {displayChallengeRating} ({experiencePoints} XP)
                            </p>
                          );
                        })()}
                      </React.Fragment>
                    )}
                    {character.groups && character.groups.length > 0 && (
                      <p className="text-xs sm:text-sm text-white">
                        {t("group")} : {character.groups[0].label}
                      </p>
                    )}
                  </div>
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

              {/* Onglets */}
              <CharacterTabs
                activeTab={activeTab}
                listClassName="gap-1 flex-wrap justify-start self-start xl:self-end"
                triggerClassName="grow-0"
              />
            </div>
          </div>
        </div>

        {/* Contenu des onglets - scrollable */}
        <div className="flex-1 overflow-y-auto w-full mx-auto px-4 sm:px-6 md:px-8 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
          {CHARACTER_TABS.map((tab) => (
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
                        form={form}
                        isEditing={isEditing}
                      />
                    );
                  case "battle":
                    return (
                      <CharacterBattleTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={isEditing}
                      />
                    );
                  case "magic":
                    return (
                      <CharacterMagicTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={isEditing}
                      />
                    );
                  case "inventory":
                    return (
                      <CharacterInventoryTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={isEditing}
                      />
                    );
                  case "history":
                    return (
                      <CharacterHistoryTabContent
                        character={character}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={isEditing}
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

      {/* Footer avec boutons - fixe en bas */}
      <div className="shrink-0 w-full px-2 sm:px-6 md:px-10 py-5 border-t border-transparent">
        <div className="w-full mx-auto flex flex-row-reverse gap-4">
          {isEditing ? (
            <>
              {/* Mode édition : boutons Annuler et Sauvegarder */}
              <Button
                type="button"
                onClick={() => onUpdate(form.getValues())}
                disabled={isSaving || !form.formState.isDirty}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onUpdate(form.getValues());
                  }
                }}
                className={`
                  text-lg font-semibold py-5.5
                  ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
                  ${activeTab === "battle" ? "bg-red hover:bg-red/90 text-white" : ""}
                  ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
                  ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
                  ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
                `}
                aria-label={t("saveChanges")}
                aria-busy={isSaving}>
                <Save
                  className="size-5"
                  aria-hidden="true"
                />
                {isSaving ? t("saving") : t("saveChanges")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onCancel();
                  setIsEditing(false);
                }}
                disabled={isSaving}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCancel();
                    setIsEditing(false);
                  }
                }}
                className="text-lg font-semibold py-5.5"
                aria-label={t("cancel")}>
                <X
                  className="size-5"
                  aria-hidden="true"
                />
                {t("cancel")}
              </Button>
            </>
          ) : (
            /* Mode lecture : bouton Modifier */
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsEditing(true);
                }
              }}
              className={`
                text-lg font-semibold py-5.5
                ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
                ${activeTab === "battle" ? "bg-red hover:bg-red/90 text-white" : ""}
                ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
                ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
                ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
              `}
              aria-label={t("editCharacter")}>
              <SquarePen
                className="size-5"
                aria-hidden="true"
              />
              {t("editCharacter")}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
