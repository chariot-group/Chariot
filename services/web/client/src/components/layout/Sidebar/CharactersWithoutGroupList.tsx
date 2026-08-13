"use client";

import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import { removeCharacterWithoutGroup } from "@/store/slices/characterSlice";
import { useMemo, useState } from "react";
import { Loader2, Swords, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { selectCurrentUserParticipant, selectIsInSession, selectSessionStatus } from "@/store/slices/sessionSlice";
import { useUser } from "@/hooks/useUser";
import CharacterService from "@/services/CharacterService";
import { Character } from "@/types/character";
import { isPlayer } from "@/utils/global.utils";
import { SidebarItemWithActions } from "@/components/layout/Sidebar/shared/SidebarItemWithActions";
import { ConfirmDialog } from "@/components/layout/Sidebar/shared/ConfirmDialog";
import { DuplicateCharacterDialog } from "@/components/dialogs/DuplicateCharacterDialog";
import { ExportCharacterSheetPdfDialog } from "@/components/dialogs/ExportCharacterSheetPdfDialog";
import type { SidebarActionItem } from "@/components/layout/Sidebar/shared/sidebarActions.types";
import { buildSequentialCopyNames, characterDisplayName } from "@/lib/duplicateName";
import { showToast } from "@/lib/toast";
import { upsertCharacterWithoutGroup } from "@/store/slices/characterSlice";
import { useSidebarCharacterPdfExport } from "@/hooks/useSidebarCharacterPdfExport";

/**
 * Liste des joueurs sans groupe : la zone défilante occupe toute la hauteur restante de la sidebar (sous le titre et « Créer »).
 *
 * autoFetch=false : NavigationService charge la première page à la connexion ; le hook respecte le cooldown 3 s.
 */
export default function CharactersWithoutGroupList() {
  const t = useTranslations("sidebar");
  const tClass = useTranslations("classes");
  const { characters, loading, loadingMore, hasMore, loadMoreCharacters, error } = usePlayersWithoutGroup(10, {
    autoFetch: false,
  });
  const router = useRouter();

  const dispatch = useAppDispatch();
  const { user } = useUser();
  const isInSession = useAppSelector(selectIsInSession);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user?.keycloakId ?? ""),
  );
  const sessionCharacterId =
    isInSession && sessionStatus === "launched" ? (currentParticipant?.characterId ?? null) : null;
  const actionsDisabled = isInSession && sessionStatus === "launched";
  const { setOpenMobile } = useSidebar();
  const [characterPendingDelete, setCharacterPendingDelete] = useState<Character | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [characterToDuplicate, setCharacterToDuplicate] = useState<Character | null>(null);
  const { characterToExport, requestCharacterPdfExport, closeExportDialog } = useSidebarCharacterPdfExport();

  const pathname = usePathname();

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]?.split("?")[0]
    : null;

  const handleDeleteCharacter = async () => {
    if (!characterPendingDelete || isDeleting) return;

    const deletingCharacterId = characterPendingDelete._id;
    const nextCharacter = characters.find((character) => character._id !== deletingCharacterId);

    try {
      setIsDeleting(true);
      await CharacterService.deleteCharacter(deletingCharacterId);
      setCharacterPendingDelete(null);
      dispatch(removeCharacterWithoutGroup(deletingCharacterId));

      if (selectedCharacterId === deletingCharacterId) {
        if (nextCharacter?._id) {
          router.replace(`/characters/${nextCharacter._id}`);
        } else {
          router.replace("/welcome");
        }
      }
    } catch (deleteError) {
      console.error("Error deleting character:", deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const existingCharacterNames = useMemo(
    () => characters.map((c) => characterDisplayName(c)).filter(Boolean),
    [characters],
  );

  const handleDuplicateCharacter = async (character: Character, name: string, count: number) => {
    if (!isPlayer(character)) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, createdBy, deletedAt, groups, ...rest } = character;
      const copyNames = buildSequentialCopyNames(name, count);
      let lastCreated: Character | null = null;
      for (const copyName of copyNames) {
        const payload = { ...rest, firstname: copyName, lastname: "", groups: [] as [] };
        const created = await CharacterService.createCharacter("players", payload);
        dispatch(upsertCharacterWithoutGroup(created as Character));
        lastCreated = created as Character;
      }
      showToast(t("duplicateCharacterSuccess"), "success");
      if (count === 1 && lastCreated) router.push(`/characters/${lastCreated._id}`);
    } catch {
      showToast(t("duplicateCharacterError"), "error");
      throw new Error("duplicate failed");
    }
  };

  const buildCharacterActions = (character: Character): SidebarActionItem[] => {
    const exportAction: SidebarActionItem = {
      id: "exportPdf",
      label: t("exportPdf"),
      onSelect: () => void requestCharacterPdfExport(character._id),
    };

    if (actionsDisabled) return [exportAction];

    return [
      exportAction,
      {
        id: "duplicate",
        label: t("duplicate"),
        onSelect: () => setCharacterToDuplicate(character),
      },
      {
        id: "edit",
        label: t("edit"),
        onSelect: () => {
          router.push(`/characters/${character._id}?mode=edit`);
          setOpenMobile(false);
        },
      },
      {
        id: "delete",
        label: t("delete"),
        variant: "destructive",
        onSelect: () => setCharacterPendingDelete(character),
      },
    ];
  };

  if (loading && characters.length === 0) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-4 focus-visible:outline-none"
      aria-label={t("playerNavigation")}>
      <h2 className="shrink-0 text-lg text-white">{t("yourCharacters")}</h2>

      <Link
        href="/characters/new/players"
        onClick={() => setOpenMobile(false)}
        aria-label={t("createCharacter")}
        className="sidebar-btn-white shrink-0 text-sm cursor-pointer flex justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:border hover:bg-white/80">
        {t("createCharacter")}
        <UserPlus
          aria-hidden="true"
          className="w-5 h-5"
        />
      </Link>

      <div className="mt-1 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain scroll-smooth pt-0.5 pr-0.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {characters.map((character, index) => {
          const isSelected = selectedCharacterId === character._id;
          const classLabel = isPlayer(character)
            ? character.class
                .map((cls) => (cls?.name ? tClass(cls.name).trim() : ""))
                .filter((label) => label.length > 0)
                .join(" / ")
            : "";
          const displayName =
            [character.firstname, character.lastname]
              .map((part) => (typeof part === "string" ? part.trim() : ""))
              .filter((part) => part.length > 0)
              .join(" ") || t("unnamedCharacter");
          const isSessionCharacter = sessionCharacterId === character._id;
          const characterActions = buildCharacterActions(character);

          return (
            <SidebarItemWithActions
              key={character._id ?? `character-${index}`}
              actions={characterActions}
              disabled={characterActions.length === 0}
              contextMenuLabel={t("characterActions")}
              className={cn(
                "rounded-[12px] transition-all duration-150",
                isSelected ? "bg-white text-black" : "hover:bg-white/10",
              )}
              overflowTriggerClassName={
                isSelected ? "text-black/40 hover:bg-black/10 hover:text-black" : undefined
              }>
              <Link
                href={`/characters/${character._id}`}
                aria-current={isSelected ? "page" : undefined}
                aria-label={`${displayName}${classLabel ? ` (${classLabel})` : ""}${isSelected ? ` (${t("selected")})` : ""}`}
                onClick={() => dispatch(clearSelectedCampaign())}
                className={cn(
                  "relative flex min-w-0 flex-1 shrink-0 cursor-pointer items-center justify-between gap-1 py-1.5 px-3 focus-visible:ring-1 focus-visible:ring-white/50",
                  isSelected && "pl-4 font-bold text-black",
                )}>
                {isSelected && (
                  <span
                    className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "text-sm min-w-0 flex-1 truncate",
                    isSelected && "font-bold text-black",
                  )}>
                  {displayName}
                </span>
                {classLabel && (
                  <span
                    className={cn(
                      "text-sm shrink-0 whitespace-nowrap",
                      isSelected && "font-bold text-black",
                    )}>
                    ({classLabel})
                  </span>
                )}
                {isSessionCharacter && (
                  <Swords
                    aria-label={t("sessionCharacter")}
                    className={cn(
                      "ml-1 h-3.5 w-3.5 shrink-0",
                      isSelected ? "text-primary" : "text-yellow",
                    )}
                  />
                )}
              </Link>
            </SidebarItemWithActions>
          );
        })}

        {hasMore && (
          <button
            type="button"
            key="characters-without-group-load-more"
            onClick={() => void loadMoreCharacters()}
            disabled={loadingMore}
            aria-busy={loadingMore}
            aria-label={t("loadMoreCharactersAria")}
            className="text-xs shrink-0 cursor-pointer rounded-[12px] py-1.5 px-3 text-white/90 text-center transition-all duration-100 w-full border border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:border">
            {loadingMore ? (
              <Loader2
                className="w-4 h-4 animate-spin mx-auto"
                aria-hidden
              />
            ) : (
              t("loadMoreCharacters")
            )}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!characterPendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setCharacterPendingDelete(null);
        }}
        title={t("deleteCharacterDialogTitle")}
        description={t("deleteCharacterDialogDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDeleteCharacter}
        isLoading={isDeleting}
      />

      <DuplicateCharacterDialog
        character={characterToDuplicate}
        open={!!characterToDuplicate}
        onOpenChange={(open) => {
          if (!open) setCharacterToDuplicate(null);
        }}
        existingNames={existingCharacterNames}
        onDuplicate={(name, count) => handleDuplicateCharacter(characterToDuplicate!, name, count)}
      />

      <ExportCharacterSheetPdfDialog
        character={characterToExport}
        open={!!characterToExport}
        onOpenChange={closeExportDialog}
      />
    </nav>
  );
}
