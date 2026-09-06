"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useActiveSessionCode } from "@/hooks/useActiveSessionCode";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";
import { shouldRedirectAwayFromCharacterSheet } from "@/lib/characterAccessError";

export default function Character() {
  const params = useParams();
  const pathname = usePathname();
  const characterId = params.idCharacters as string;
  const locale = pathname.split("/")[1] || "fr";
  const sessionCode = useActiveSessionCode();
  const { character, loading, error, accessDenied, refetch, setCharacter } = useCharacter(
    characterId,
    sessionCode,
  );
  const { loading: keycloakLoading, userTransitioning } = useKeycloak();
  const redirectedRef = useRef(false);

  // FR-user-cache-isolation: hard-navigate out of forbidden sheets (breaks client router loops).
  // FR-session-combat-navigation: do not leave on transient fetch failures.
  useEffect(() => {
    if (keycloakLoading || userTransitioning || loading) return;
    if (!shouldRedirectAwayFromCharacterSheet(accessDenied)) return;
    if (character) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    const target = `/${locale}/welcome`;
    // Full navigation avoids soft-router ping-pong with post-login / stale cache.
    window.location.replace(target);
  }, [keycloakLoading, userTransitioning, loading, accessDenied, character, locale]);

  if (keycloakLoading || userTransitioning || loading || error || !character) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CharacterDetailView
      character={character as Player | NPC}
      refetchCharacter={refetch}
      onCharacterUpdate={(updated) => {
        if (updated) {
          setCharacter(updated);
        } else {
          void refetch();
        }
      }}
    />
  );
}
