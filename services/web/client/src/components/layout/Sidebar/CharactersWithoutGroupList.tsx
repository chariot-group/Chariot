"use client";

import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import { useState } from "react";
import { Loader2, PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { useAppDispatch } from "@/store/hooks";
import { useSidebar } from "@/components/ui/sidebar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CharacterService from "@/services/CharacterService";
import { Character } from "@/types/character";
import { isPlayer } from "@/utils/global.utils";

/**
 * Liste des joueurs sans groupe : la zone défilante occupe toute la hauteur restante de la sidebar (sous le titre et « Créer »).
 *
 * autoFetch=false : NavigationService charge la première page à la connexion ; le hook respecte le cooldown 3 s.
 */
export default function CharactersWithoutGroupList() {
  const t = useTranslations("sidebar");
  const tClass = useTranslations("classes");
  const { characters, loading, loadingMore, hasMore, loadMoreCharacters, refetch, error } = usePlayersWithoutGroup(10, {
    autoFetch: false,
  });
  const router = useRouter();

  const dispatch = useAppDispatch();
  const { setOpenMobile } = useSidebar();
  const [characterPendingDelete, setCharacterPendingDelete] = useState<Character | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pathname = usePathname();

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]
    : null;

  const handleDeleteCharacter = async () => {
    if (!characterPendingDelete || isDeleting) return;

    const deletingCharacterId = characterPendingDelete._id;
    const nextCharacter = characters.find((character) => character._id !== deletingCharacterId);

    try {
      setIsDeleting(true);
      await CharacterService.deleteCharacter(deletingCharacterId);
      setCharacterPendingDelete(null);
      await refetch();

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

      {/* Create character button */}
      <Link
        href="/characters/new/players"
        onClick={() => setOpenMobile(false)}
        aria-label={t("createCharacter")}
        className="sidebar-btn-white shrink-0 text-sm cursor-pointer flex justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:border">
        {t("createCharacter")}
        <PlusCircleIcon
          aria-hidden="true"
          className="w-5 h-5"
        />
      </Link>

      <div className="mt-1 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth py-0.5 pr-0.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
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
          return (
            <ContextMenu key={character._id ?? `character-${index}`}>
              <ContextMenuTrigger asChild>
                <Link
                  href={`/characters/${character._id}`}
                  aria-current={isSelected ? "page" : undefined}
                  aria-label={`${displayName}${classLabel ? ` (${classLabel})` : ""}${isSelected ? ` (${t("selected")})` : ""}`}
                  onClick={() => dispatch(clearSelectedCampaign())}
                  className={`w-full shrink-0 border-2 cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center gap-1 group/character focus-visible:border ${isSelected ? "bg-white" : ""}`}>
                  <span
                    className={`text-sm min-w-0 flex-1 truncate group-hover/character:font-bold group-hover/character:text-black ${isSelected ? "font-bold text-black" : ""}`}>
                    {displayName}
                  </span>
                  {classLabel && (
                    <span
                      className={`text-sm shrink-0 whitespace-nowrap group-hover/character:font-bold group-hover/character:text-black ${isSelected ? "font-bold text-black" : ""}`}>
                      ({classLabel})
                    </span>
                  )}
                </Link>
              </ContextMenuTrigger>
              <ContextMenuContent
                className="w-56 bg-card rounded-[12px] py-1.5 px-1.5 shadow focus-visible:outline-none"
                aria-label={t("characterActions")}>
                <ContextMenuItem
                  className="cursor-pointer focus-visible:border rounded-[8px] px-2 py-1.5 text-sm text-red-500 hover:text-red-600 focus:text-red-600"
                  onClick={() => setCharacterPendingDelete(character)}>
                  {t("delete")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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

      {characterPendingDelete && (
        <Dialog
          open={!!characterPendingDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setCharacterPendingDelete(null);
          }}>
          <DialogContent className="sm:max-w-sm rounded-[15px] bg-card">
            <DialogHeader>
              <DialogTitle>{t("deleteCharacterDialogTitle")}</DialogTitle>
              <DialogDescription>{t("deleteCharacterDialogDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCharacterPendingDelete(null)}
                disabled={isDeleting}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="text-black"
                onClick={handleDeleteCharacter}
                disabled={isDeleting}>
                {t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </nav>
  );
}
