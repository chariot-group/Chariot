"use client";

import { SquarePen, X, Save } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/tabs";
import React, { useEffect, useMemo, useState } from "react";
import CharacterTabs, { CharacterTab } from "@/components/character/CharacterTabs";
import CharacterTabPanels from "@/components/character/CharacterTabPanels";
import { isPlayer } from "@/utils/global.utils";
import { useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectIsInSession, selectSessionCode } from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";
import UserService from "@/services/UserService";
import { formatSessionParticipantUserLabel } from "@/lib/formatSessionParticipantUserLabel";
import { Button } from "@/components/ui/button";
import { useCharacterForm, CharacterType } from "@/hooks/useCharacterForm";
import { useSearchParams, useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isEnterWithModifiers, isEnterWithoutModifiers, isTypingInInputElement } from "@/utils/keyboard.utils";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import { useToast } from "@/hooks/useToast";
import { useFormState } from "react-hook-form";
import { getCharacterTabsWithErrors, getFirstCharacterTabWithError } from "@/components/character/characterFormErrors";
import { CombatBanner } from "@/components/character/CombatBanner";

interface CharacterDetailViewProps {
  character: Player | NPC;
  /** GET personnage (même source que la page) pour resync après sauvegarde si besoin. */
  refetchCharacter?: () => Promise<void>;
  /** Sans argument : rechargement complet (ex. après sauvegarde). Avec personnage : mise à jour locale sans recharger toute la page. */
  onCharacterUpdate?: (updated?: Player | NPC) => void;
}

export default function CharacterDetailView({
  character,
  refetchCharacter,
  onCharacterUpdate,
}: CharacterDetailViewProps) {
  const t = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInSession = useAppSelector(selectIsInSession);
  const contextMode = useAppSelector(selectContextMode);
  const currentUser = useAppSelector(selectUser);
  const sessionCodeRedux = useAppSelector(selectSessionCode);
  const sessionCodeFromUrl = searchParams.get("sessionCode");
  const currentUserKeycloakId = currentUser?.keycloakId ?? null;

  const isGmViewingPlayerSheet =
    contextMode === "gm" &&
    isPlayer(character) &&
    currentUserKeycloakId != null &&
    character.createdBy != null &&
    character.createdBy !== currentUserKeycloakId;

  const playedBySubjectId = isGmViewingPlayerSheet && character.createdBy != null ? String(character.createdBy) : null;

  const [resolvedPlayedBy, setResolvedPlayedBy] = useState<{
    createdByKey: string;
    label: string;
  } | null>(null);

  const playedByLabel =
    playedBySubjectId != null && resolvedPlayedBy != null && resolvedPlayedBy.createdByKey === playedBySubjectId
      ? resolvedPlayedBy.label
      : null;

  const canEditAsGm = useMemo(
    () => isGmViewingPlayerSheet && isInSession && !!sessionCodeFromUrl && sessionCodeFromUrl === sessionCodeRedux,
    [isGmViewingPlayerSheet, isInSession, sessionCodeFromUrl, sessionCodeRedux],
  );

  const showEditControls = !isGmViewingPlayerSheet || canEditAsGm;

  // Lire l'onglet actif depuis l'URL (ou "general" par défaut)
  const activeTab = (searchParams.get("tab") as CharacterTab) || "general";

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = React.useCallback((newTab: string) => {
    const tab = newTab as CharacterTab;
    // Mettre à jour l'URL sans recharger la page
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Déterminer le type de personnage
  const characterType: CharacterType = isPlayer(character) ? "players" : "npcs";

  // Initialiser le formulaire avec useCharacterForm
  const { form, onUpdate, onCancel, isEditing, setIsEditing, isSaving } = useCharacterForm({
    characterId: character._id,
    type: characterType,
    sourceCharacter: character,
    refetchCharacter,
    sessionCode: sessionCodeFromUrl,
    onSuccess: () => {
      // Rafraîchir les données du parent après la mise à jour
      if (onCharacterUpdate) {
        onCharacterUpdate();
      }
    },
  });

  // Abonnement explicite (sinon isDirty ne met pas à jour le footer quand seuls des champs imbriqués changent, ex. abilities)
  const { errors, isDirty } = useFormState({ control: form.control });
  const tabsWithErrors = useMemo(() => getCharacterTabsWithErrors(errors), [errors]);

  const handleInvalid = React.useCallback((errors: Record<string, unknown>) => {
    const firstErrorTab = getFirstCharacterTabWithError(errors);
    if (firstErrorTab && firstErrorTab !== activeTab) {
      handleTabChange(firstErrorTab);
    }
    toast.error(t("updateError"));
  }, [activeTab, handleTabChange, t, toast]);

  useEffect(() => {
    if (!playedBySubjectId) {
      return;
    }
    let cancelled = false;
    void UserService.getUserById(playedBySubjectId)
      .then((u) => {
        if (!cancelled) {
          const label = formatSessionParticipantUserLabel(u);
          if (label) {
            setResolvedPlayedBy({ createdByKey: playedBySubjectId, label });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedPlayedBy(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playedBySubjectId]);

  useEffect(() => {
    if (!showEditControls && isEditing) {
      onCancel();
      setIsEditing(false);
    }
  }, [showEditControls, isEditing, onCancel, setIsEditing]);

  // Si on arrive avec mode=edit (création depuis la sidebar, ou autre lien), ouvrir directement en édition
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "edit" && showEditControls) {
      setIsEditing(true);
    }
    if (mode === "edit" && !showEditControls) {
      setIsEditing(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("mode");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, setIsEditing, showEditControls, router]);

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
      if (!isDirty) return;

      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit(onUpdate, handleInvalid)();
    };

    window.addEventListener("keydown", handleGlobalShortcuts, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts, true);
    };
  }, [form, handleInvalid, isDirty, isEditing, onCancel, onUpdate, setIsEditing]);

  const characterFooterActions = showEditControls ? (
    <div className="flex w-full min-w-0 flex-row-reverse gap-2 sm:w-auto">
      {isEditing ? (
        <React.Fragment>
          <Button
            type="submit"
            form="character-update-form"
            disabled={isSaving || !isDirty}
            tabIndex={0}
            className={`
              max-w-full min-w-0 lg:text-sm text-xs font-semibold
              ${activeTab === "general" ? "bg-blue hover:bg-blue/75 text-black" : ""}
              ${activeTab === "battle" ? "bg-red hover:bg-red/75 text-white" : ""}
              ${activeTab === "magic" ? "bg-pink hover:bg-pink/75 text-black" : ""}
              ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/75 text-black" : ""}
              ${activeTab === "history" ? "bg-green hover:bg-green/75 text-black" : ""}
            `}
            aria-label={t("saveChanges")}
            aria-busy={isSaving}>
            <Save
              className="lg:size-5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{isSaving ? t("saving") : t("saveChanges")}</span>
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
            className="max-w-full min-w-0 lg:text-sm text-xs font-semibold"
            aria-label={t("cancel")}>
            <X
              className="lg:size-5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{t("cancel")}</span>
          </Button>
        </React.Fragment>
      ) : (
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
            max-w-full min-w-0 lg:text-sm text-xs font-semibold
            ${activeTab === "general" ? "bg-blue hover:bg-blue/75 text-black" : ""}
            ${activeTab === "battle" ? "bg-red hover:bg-red/75 text-white" : ""}
            ${activeTab === "magic" ? "bg-pink hover:bg-pink/75 text-black" : ""}
            ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/75 text-black" : ""}
            ${activeTab === "history" ? "bg-green hover:bg-green/75 text-black" : ""}
          `}
          aria-label={t("editCharacter")}>
          <SquarePen
            className="lg:size-5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{t("editCharacter")}</span>
        </Button>
      )}
    </div>
  ) : null;

  return (
    <main
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      id="characterView">
      <form
        id="character-update-form"
        className="flex flex-col flex-1 min-h-0"
        onSubmit={(event) => {
          if (!isEditing) {
            event.preventDefault();
            return;
          }

          form.handleSubmit(onUpdate, handleInvalid)(event);
        }}
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
                  <div className="min-w-0 w-full justify-start lg:justify-end flex items-start lg:items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help min-w-0 w-full flex flex-col items-start text-left gap-0.5 lg:flex-row lg:items-end lg:justify-end lg:text-right lg:gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white truncate min-w-0 max-w-full">
                          {character.firstname?.trim()} {character.lastname?.trim()}
                        </h1>
                        {character.surname && (
                          <span className="text-gray-light italic text-sm lg:text-base truncate min-w-0 max-w-full">
                            ({character.surname?.trim()})
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <span>
                            {character.firstname} {character.lastname} {character.surname && `(${character.surname})`}
                          </span>
                          {isGmViewingPlayerSheet && playedByLabel ? (
                            <span className="text-xs opacity-90">{t("playedBy", { name: playedByLabel })}</span>
                          ) : null}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Ligne 2: Surnom + Classe/CR + Groupe */}
                  <div className="flex flex-col gap-2 text-sm items-start lg:items-end justify-end">
                    {isPlayer(character) ? (
                      <div className="flex flex-col gap-1 text-white font-semibold items-start lg:items-end">
                        <div>
                          {character.class.map((cls: { name: string; level: number }, index: number) => (
                            <span key={index}>
                              {t("classLevelShort", { className: tClass(cls.name), level: cls.level })}
                              {index < character.class.length - 1 && " / "}
                            </span>
                          ))}
                        </div>
                        {isGmViewingPlayerSheet && playedByLabel ? (
                          <span className="text-xs font-normal text-gray-light">
                            {t("playedBy", { name: playedByLabel })}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-white font-semibold">
                        {(() => {
                          const challengeRating = character.challenge?.challengeRating ?? 0;
                          const experiencePoints = character.challenge?.experiencePoints ?? 0;
                          const displayChallengeRating = formatChallengeRating(challengeRating);

                          return (
                            <React.Fragment>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <abbr className="no-underline cursor-help">{t("npc.challengeRatingAbbr")}</abbr>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{tCommon("challengeRatingTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>{" "}
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
                    tabsWithErrors={isEditing ? tabsWithErrors : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenu des onglets - scrollable (min-h-0 pour que les enfants h-full / flex-1 se calent sur la hauteur utile) */}
          <div
            id="characterScrollView"
            className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden w-full mx-auto px-4 sm:px-6 md:px-8 py-4 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
            <CharacterTabPanels
              character={character}
              form={form}
              isEditing={isEditing}
              onCharacterUpdate={onCharacterUpdate}
            />
          </div>
        </Tabs>

        {isInSession ? (
          <CombatBanner characterId={character._id} footerActions={characterFooterActions} />
        ) : characterFooterActions ? (
          <div className="shrink-0 border-t border-white/10 px-4 sm:px-6 md:px-8 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
            <div className="flex w-full justify-end">{characterFooterActions}</div>
          </div>
        ) : null}
      </form>
    </main>
  );
}
