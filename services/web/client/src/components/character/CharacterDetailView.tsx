"use client";

import { SquarePen, X, Save } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import CharacterTabs, { CharacterTab } from "@/components/character/CharacterTabs";
import CharacterTabPanels from "@/components/character/CharacterTabPanels";
import { isPlayer } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";
import { useCharacterForm, CharacterType } from "@/hooks/useCharacterForm";
import { useSearchParams, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isEnterWithModifiers, isEnterWithoutModifiers, isTypingInInputElement } from "@/utils/keyboard.utils";
import { formatChallengeRating } from "@/utils/challengeRating.utils";

interface CharacterDetailViewProps {
  character: Player | NPC;
  onCharacterUpdate?: () => void; // Callback pour rafraîchir les données du parent
}

export default function CharacterDetailView({ character, onCharacterUpdate }: CharacterDetailViewProps) {
  const t = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
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

  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isEditing) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        setIsEditing(false);
        return;
      }

      if (!isEditing || !isEnterWithoutModifiers(event) || isTypingInInputElement(event.target)) return;
      if (!form.formState.isDirty) return;

      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit(onUpdate)();
    };

    window.addEventListener("keydown", handleGlobalShortcuts, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts, true);
    };
  }, [form, isEditing, onCancel, onUpdate, setIsEditing]);

  return (
    <main className="flex flex-col h-dvh overflow-hidden">
      <form
        id="character-update-form"
        className="flex flex-col flex-1 min-h-0"
        onSubmit={form.handleSubmit(onUpdate)}
        onKeyDown={(event) => {
          if (isEnterWithModifiers(event)) {
            event.preventDefault();
          }
        }}>
        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header avec onglets et infos du personnage */}
          <div className="shrink-0">
            <div className="mx-auto sm:px-6 md:px-8 px-2">
              <div className="w-full flex flex-col lg:flex-row-reverse lg:justify-between gap-2">
                {/* Infos du personnage - À droite sur lg, au-dessus sur mobile */}
                <div className="flex flex-col gap-1 min-w-0 lg:max-w-[50%]">
                  {/* Ligne 1: Nom du personnage */}
                  <div className="min-w-0 justify-start lg:justify-end flex">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help truncate flex flex-row items-end gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                          {character.firstname?.trim()} {character.lastname?.trim()}{" "}
                        </h1>
                        {character.surname && (
                          <span className="ml-auto text-gray-light italic lg:text-md text-sm">
                            ({character.surname?.trim()})
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {character.firstname} {character.lastname} {character.surname && `(${character.surname})`}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Ligne 2: Surnom + Classe/CR + Groupe */}
                  <div className="flex flex-col gap-2 text-sm items-start lg:items-end justify-end">
                    {isPlayer(character) ? (
                      <div className="text-white font-semibold">
                        {character.class.map((cls: { name: string; level: number }, index: number) => (
                          <span key={index}>
                            {tClass(cls.name)} Niv {cls.level}
                            {index < character.class.length - 1 && " / "}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white font-semibold">
                        {(() => {
                          const challengeRating = character.challenge?.challengeRating ?? 0;
                          const experiencePoints = character.challenge?.experiencePoints ?? 0;
                          const displayChallengeRating = formatChallengeRating(challengeRating);

                          return (
                            <React.Fragment>
                              <abbr
                                title={t("npc.challengeRating")}
                                className="no-underline cursor-help">
                                {t("npc.challengeRatingAbbr")}
                              </abbr>{" "}
                              {displayChallengeRating} ({experiencePoints} XP)
                            </React.Fragment>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Onglets - À gauche sur lg, en dessous sur mobile */}
                <div className="flex flex-col gap-2 min-w-0 lg:max-w-[50%] lg:self-end overflow-x-auto lg:overflow-x-visible overflow-y-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
                  <CharacterTabs
                    activeTab={activeTab}
                    listClassName="gap-1 lg:flex-wrap"
                    triggerClassName="grow-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenu des onglets - scrollable */}
          <div className="flex-1 overflow-y-auto w-full mx-auto px-4 sm:px-6 md:px-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
            <CharacterTabPanels
              character={character}
              form={form}
              isEditing={isEditing}
            />
          </div>
        </Tabs>

        {/* Footer avec boutons - fixe en bas */}
        <div className="shrink-0 w-full px-2 sm:px-6 md:px-10 lg:py-3 py-2 border-t border-transparent">
          <div className="w-full mx-auto flex flex-row-reverse gap-2">
            {isEditing ? (
              <React.Fragment>
                {/* Mode édition : boutons Annuler et Sauvegarder */}
                <Button
                  type="submit"
                  form="character-update-form"
                  disabled={isSaving || !form.formState.isDirty}
                  tabIndex={0}
                  className={`
                  lg:text-sm text-xs font-semibold
                  ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
                  ${activeTab === "battle" ? "bg-red hover:bg-red/90 text-white" : ""}
                  ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
                  ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
                  ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
                `}
                  aria-label={t("saveChanges")}
                  aria-busy={isSaving}>
                  <Save
                    className="lg:size-5 size-4"
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
                  className="lg:text-sm text-xs font-semibold"
                  aria-label={t("cancel")}>
                  <X
                    className="lg:size-5 size-4"
                    aria-hidden="true"
                  />
                  {t("cancel")}
                </Button>
              </React.Fragment>
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
                lg:text-sm text-xs font-semibold
                ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
                ${activeTab === "battle" ? "bg-red hover:bg-red/90 text-white" : ""}
                ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
                ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
                ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
              `}
                aria-label={t("editCharacter")}>
                <SquarePen
                  className="lg:size-5 size-4"
                  aria-hidden="true"
                />
                {t("editCharacter")}
              </Button>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
