"use client";

import { SquarePen, X, Save, FileDown } from "lucide-react";
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
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { isEnterWithModifiers, isEnterWithoutModifiers, isTypingInInputElement } from "@/utils/keyboard.utils";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import { useToast } from "@/hooks/useToast";
import { useFormState } from "react-hook-form";
import { getCharacterTabsWithErrors, getFirstCharacterTabWithError } from "@/components/character/characterFormErrors";
import { CharacterSheetHeaderIdentity } from "@/components/character/CharacterSheetHeaderIdentity";
import { CharacterSheetHeader } from "@/components/character/CharacterSheetHeader";
import { CombatBanner } from "@/components/character/CombatBanner";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { MediaAvatarUpload } from "@/components/media/MediaAvatarUpload";
import MediaService from "@/services/MediaService";
import { invalidateMediaAvatarCache } from "@/lib/mediaAvatarCache";
import { emitCharacterSheetUpdated } from "@/lib/sessionCharacterSyncBridge";
import { getSessionSnapshotForBroadcast } from "@/lib/sessionSnapshot";
import { ExportCharacterSheetPdfDialog } from "@/components/dialogs/ExportCharacterSheetPdfDialog";
import { cn } from "@/lib/utils";

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
  const tForm = useTranslations("characterForm");
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

  const sessionCodeForMedia = sessionCodeFromUrl ?? sessionCodeRedux ?? null;

  const canEditAsGm = useMemo(
    () => isGmViewingPlayerSheet && isInSession && !!sessionCodeFromUrl && sessionCodeFromUrl === sessionCodeRedux,
    [isGmViewingPlayerSheet, isInSession, sessionCodeFromUrl, sessionCodeRedux],
  );

  const showEditControls = !isGmViewingPlayerSheet || canEditAsGm;

  // Lire l'onglet actif depuis l'URL (ou "general" par défaut)
  const activeTab = (searchParams.get("tab") as CharacterTab) || "general";

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = React.useCallback(
    (newTab: string) => {
      const tab = newTab as CharacterTab;
      // Mettre à jour l'URL sans recharger la page
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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

  const [pendingAvatarFile, setPendingAvatarFile] = React.useState<File | null>(null);
  const [pendingAvatarRemove, setPendingAvatarRemove] = React.useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [isAvatarCommitting, setIsAvatarCommitting] = React.useState(false);

  const isAvatarDirty = pendingAvatarFile !== null || pendingAvatarRemove;
  const hasPendingChanges = isDirty || isAvatarDirty;

  const resetAvatarDraft = React.useCallback(() => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setPendingAvatarFile(null);
    setPendingAvatarRemove(false);
  }, [avatarPreviewUrl]);

  const handlePendingAvatarFile = React.useCallback(
    (file: File) => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setPendingAvatarFile(file);
      setPendingAvatarRemove(false);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    },
    [avatarPreviewUrl],
  );

  const handlePendingAvatarRemove = React.useCallback(() => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setPendingAvatarFile(null);
    setPendingAvatarRemove(true);
    setAvatarPreviewUrl(null);
  }, [avatarPreviewUrl]);

  const handleCharacterSave = React.useCallback(
    async (data: Parameters<typeof onUpdate>[0]) => {
      form.clearErrors();
      const isValid = await form.trigger(undefined, { shouldFocus: true });
      if (!isValid) {
        toast.error(tForm("updateError"));
        return;
      }

      let avatarChanged = false;
      let newAvatar = character.avatar;

      try {
        if (pendingAvatarFile) {
          setIsAvatarCommitting(true);
          const result = await MediaService.uploadCharacterAvatar(
            character._id,
            pendingAvatarFile,
            sessionCodeForMedia,
          );
          newAvatar = result.avatar;
          avatarChanged = true;
          invalidateMediaAvatarCache("character", character._id);
        } else if (pendingAvatarRemove && character.avatar?.trim()) {
          setIsAvatarCommitting(true);
          const result = await MediaService.deleteCharacterAvatar(character._id, sessionCodeForMedia);
          newAvatar = result.avatar;
          avatarChanged = true;
          invalidateMediaAvatarCache("character", character._id);
        }

        if (avatarChanged) {
          form.setValue("avatar", newAvatar ?? "");
          if (onCharacterUpdate) {
            onCharacterUpdate({ ...character, avatar: newAvatar });
          }
        }

        const updatePayload = { ...data } as Record<string, unknown>;
        delete updatePayload.avatar;

        await onUpdate(updatePayload as Parameters<typeof onUpdate>[0]);

        resetAvatarDraft();

        if (avatarChanged) {
          const snap = getSessionSnapshotForBroadcast();
          if (snap) {
            emitCharacterSheetUpdated(snap.code, character._id);
          }
        }
      } catch {
        toast.error(tForm("updateError"));
      } finally {
        setIsAvatarCommitting(false);
      }
    },
    [
      character,
      form,
      onCharacterUpdate,
      onUpdate,
      pendingAvatarFile,
      pendingAvatarRemove,
      resetAvatarDraft,
      sessionCodeForMedia,
      tForm,
      toast,
    ],
  );

  const handleCancelEditor = React.useCallback(() => {
    resetAvatarDraft();
    onCancel();
    setIsEditing(false);
  }, [onCancel, resetAvatarDraft, setIsEditing]);

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const editingAvatarStoredValue = pendingAvatarRemove ? "" : form.watch("avatar") || character.avatar;

  const displayedAvatarStoredValue = form.watch("avatar") || character.avatar;

  const watchedFirstname = form.watch("firstname");
  const watchedLastname = form.watch("lastname");
  const watchedSurname = form.watch("surname");

  const headerFirstname = isEditing ? (watchedFirstname ?? character.firstname) : character.firstname;
  const headerLastname = isEditing ? (watchedLastname ?? character.lastname) : character.lastname;
  const headerSurname = isEditing ? (watchedSurname ?? character.surname) : character.surname;

  const headerFullName = [headerFirstname?.trim(), headerLastname?.trim()].filter(Boolean).join(" ");
  const characterDisplayName = headerFullName || t("placeholder.noImage");

  const handleInvalid = React.useCallback(
    (errors: Record<string, unknown>) => {
      const firstErrorTab = getFirstCharacterTabWithError(errors);
      if (firstErrorTab && firstErrorTab !== activeTab) {
        handleTabChange(firstErrorTab);
      }
      toast.error(tForm("updateError"));
    },
    [activeTab, handleTabChange, tForm, toast],
  );

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
      handleCancelEditor();
    }
  }, [showEditControls, isEditing, handleCancelEditor]);

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
        handleCancelEditor();
        return;
      }

      if (!isEditing || !isEnterWithoutModifiers(event) || isTypingInInputElement(event.target)) return;
      if (!hasPendingChanges) return;

      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit(handleCharacterSave, handleInvalid)();
    };

    window.addEventListener("keydown", handleGlobalShortcuts, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts, true);
    };
  }, [form, handleCharacterSave, handleCancelEditor, handleInvalid, hasPendingChanges, isEditing]);

  const [isExportPdfDialogOpen, setIsExportPdfDialogOpen] = React.useState(false);
  const isNpcPdfExportDisabled = !isPlayer(character);

  const exportPdfButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (isNpcPdfExportDisabled) return;
        setIsExportPdfDialogOpen(true);
      }}
      disabled={isNpcPdfExportDisabled}
      tabIndex={0}
      className={cn(
        "max-w-full min-w-0 lg:text-sm text-xs font-semibold",
        isNpcPdfExportDisabled && "pointer-events-none",
      )}
      aria-label={
        isNpcPdfExportDisabled ? t("pdfExport.npcComingSoonAria") : t("pdfExport.exportAria")
      }
      aria-disabled={isNpcPdfExportDisabled || undefined}>
      <FileDown
        className="lg:size-5 size-4 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate">{t("exportPdf")}</span>
    </Button>
  );

  const exportPdfAction = isNpcPdfExportDisabled ? (
    <InfoTooltip
      content={t("pdfExport.npcComingSoon")}
      side="top"
      helpPlacement="corner"
      className="max-w-full min-w-0"
      moreInfoLabel={t("pdfExport.npcComingSoon")}>
      <span className="inline-flex max-w-full min-w-0 cursor-not-allowed">{exportPdfButton}</span>
    </InfoTooltip>
  ) : (
    exportPdfButton
  );

  const characterFooterActions = showEditControls ? (
    <div className="flex w-full min-w-0 flex-row-reverse gap-2 sm:w-auto">
      {isEditing ? (
        <React.Fragment>
          <Button
            type="submit"
            form="character-update-form"
            disabled={isSaving || isAvatarCommitting || !hasPendingChanges}
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
            aria-busy={isSaving || isAvatarCommitting}>
            <Save
              className="lg:size-5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{isSaving || isAvatarCommitting ? t("saving") : t("saveChanges")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelEditor}
            disabled={isSaving || isAvatarCommitting}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCancelEditor();
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
        <React.Fragment>
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
          {exportPdfAction}
        </React.Fragment>
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

          form.handleSubmit(handleCharacterSave, handleInvalid)(event);
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
              <CharacterSheetHeader
                identity={
                  <CharacterSheetHeaderIdentity
                    fullName={headerFullName}
                    surname={headerSurname}
                    emptyNameFallback={t("placeholder.noImage")}
                    tooltipContent={
                      <div className="flex flex-col gap-1">
                        <span>
                          {headerFullName}
                          {headerSurname?.trim() ? ` (${headerSurname.trim()})` : ""}
                        </span>
                        {isGmViewingPlayerSheet && playedByLabel ? (
                          <span className="text-xs opacity-90">{t("playedBy", { name: playedByLabel })}</span>
                        ) : null}
                      </div>
                    }
                    subtitle={
                      isPlayer(character) ? (
                        <div className="flex flex-col gap-1 font-semibold text-white">
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
                        <div className="font-semibold text-white">
                          {(() => {
                            const challengeRating = character.challenge?.challengeRating ?? 0;
                            const experiencePoints = character.challenge?.experiencePoints ?? 0;
                            const displayChallengeRating = formatChallengeRating(challengeRating);

                            return (
                              <React.Fragment>
                                <InfoTooltip
                                  content={tCommon("challengeRatingTooltip")}
                                  side="bottom"
                                  moreInfoLabel={tCommon("challengeRatingTooltip")}>
                                  <abbr className="cursor-help no-underline">{t("npc.challengeRatingAbbr")}</abbr>
                                </InfoTooltip>{" "}
                                {displayChallengeRating} ({experiencePoints} XP)
                              </React.Fragment>
                            );
                          })()}
                        </div>
                      )
                    }
                  />
                }
                tabs={
                  <CharacterTabs
                    activeTab={activeTab}
                    tabsWithErrors={isEditing ? tabsWithErrors : undefined}
                  />
                }
                avatar={
                  isEditing && showEditControls ? (
                    <MediaAvatarUpload
                      scope="character"
                      entityId={character._id}
                      storedValue={editingAvatarStoredValue}
                      sessionCode={sessionCodeForMedia}
                      size="sheet"
                      alt={characterDisplayName}
                      deferUpload
                      previewUrl={avatarPreviewUrl}
                      onPendingFile={handlePendingAvatarFile}
                      onPendingRemove={handlePendingAvatarRemove}
                      disabled={isSaving || isAvatarCommitting}
                    />
                  ) : (
                    <MediaAvatar
                      scope="character"
                      entityId={character._id}
                      storedValue={displayedAvatarStoredValue}
                      sessionCode={sessionCodeForMedia}
                      size="sheet"
                      alt={characterDisplayName}
                      priority
                    />
                  )
                }
              />
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
          <CombatBanner
            characterId={character._id}
            footerActions={characterFooterActions}
          />
        ) : characterFooterActions ? (
          <div className="shrink-0 border-t border-white/10 px-4 sm:px-6 md:px-8 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
            <div className="flex w-full justify-end">{characterFooterActions}</div>
          </div>
        ) : null}
      </form>
      {isPlayer(character) ? (
        <ExportCharacterSheetPdfDialog
          character={character}
          open={isExportPdfDialogOpen}
          onOpenChange={setIsExportPdfDialogOpen}
          sessionCode={sessionCodeForMedia}
          playerName={playedByLabel ?? undefined}
        />
      ) : null}
    </main>
  );
}
