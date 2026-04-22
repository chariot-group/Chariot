"use client";

import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import { useEffect, useRef, useCallback, useState } from "react";
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

/**
 * Component to display players without group with infinite scroll
 * Auto-loads more characters when scrolling to bottom
 *
 * autoFetch=false: NavigationService loads characters at login; hook respects 3s cooldown
 */
export default function CharactersWithoutGroupList() {
  const t = useTranslations("sidebar");
  const { characters, loading, loadingMore, hasMore, loadMoreCharacters, refetch, error } = usePlayersWithoutGroup(10, {
    autoFetch: false,
  });
  const router = useRouter();

  const observerTarget = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { setOpenMobile } = useSidebar();
  const [characterPendingDelete, setCharacterPendingDelete] = useState<Character | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs to keep stable handleObserver without recreating the IntersectionObserver on every state change
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const loadMoreCharactersRef = useRef(loadMoreCharacters);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  useEffect(() => {
    loadMoreCharactersRef.current = loadMoreCharacters;
  }, [loadMoreCharacters]);

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

  /**
   * Intersection Observer callback for infinite scroll
   * Loads more characters when user scrolls to bottom
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
        loadMoreCharactersRef.current();
      }
    },
    [], // stable — reads live values via refs
  );

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleObserver]);

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
      className="flex gap-3 flex-col overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full px-3 py-4"
      aria-label={t("playerNavigation")}>
      <h2 className="text-lg text-white">{t("yourCharacters")}</h2>

      {/* Create character button */}
      <Link
        href="/characters/new/players"
        onClick={() => setOpenMobile(false)}
        aria-label={t("createCharacter")}
        className="text-sm cursor-pointer flex hover:font-bold justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full focus-visible:border">
        {t("createCharacter")}
        <PlusCircleIcon
          aria-hidden="true"
          className="w-5 h-5"
        />
      </Link>

      {characters.map((character) => {
        const isSelected = selectedCharacterId === character._id;
        return (
          <ContextMenu key={character._id}>
            <ContextMenuTrigger asChild>
              <Link
                href={`/characters/${character._id}`}
                aria-current={isSelected ? "page" : undefined}
                aria-label={`${character.firstname} ${character.lastname}${isSelected ? ` (${t("selected")})` : ""}`}
                onClick={() => dispatch(clearSelectedCampaign())}
                className={`w-full border-2 cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group/character focus-visible:border ${isSelected ? "bg-white" : ""}`}>
                <span
                  className={`text-sm min-w-0 truncate group-hover/character:font-bold group-hover/character:text-black ${isSelected ? "font-bold text-black" : ""}`}>
                  {character.firstname} {character.lastname}
                </span>
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

      {/* Intersection Observer target for infinite scroll */}
      <div
        ref={observerTarget}
        className="h-1"
      />

      {/* Loading indicator for pagination */}
      {loadingMore && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        </div>
      )}

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
