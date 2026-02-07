"use client";

import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearSelectedCampaign } from "@/store/slices/campaignContextSlice";
import { useAppDispatch } from "@/store/hooks";

/**
 * Component to display players without group with infinite scroll
 * Auto-loads more characters when scrolling to bottom
 */
export default function CharactersWithoutGroupList() {
  const t = useTranslations("sidebar");
  const { characters, loading, loadingMore, hasMore, loadMoreCharacters, error } = usePlayersWithoutGroup(10);

  const observerTarget = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const pathname = usePathname();

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]
    : null;

  /**
   * Intersection Observer callback for infinite scroll
   * Loads more characters when user scrolls to bottom
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loadingMore) {
        loadMoreCharacters();
      }
    },
    [hasMore, loadingMore, loadMoreCharacters],
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
      className="flex gap-3 flex-col overflow-y-auto px-3 py-4"
      aria-label={t("playerNavigation")}>
      <h2 className="text-lg text-white">{t("yourCharacters")}</h2>
      {characters.map((character) => {
        const isSelected = selectedCharacterId === character._id;
        return (
          <Link
            href={`/characters/${character._id}`}
            key={character._id}
            aria-current={isSelected ? "page" : undefined}
            aria-label={`${character.firstname} ${character.lastname}${isSelected ? ` (${t("selected")})` : ""}`}
            onClick={() => dispatch(clearSelectedCampaign())}
            className={`w-full border-2 cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center group focus-visible:border ${isSelected ? "bg-white" : ""}`}>
            <span
              className={`text-sm group-hover:font-bold group-hover:text-black ${isSelected ? "font-bold text-black" : ""}`}>
              {character.firstname} {character.lastname}
            </span>
          </Link>
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
    </nav>
  );
}
