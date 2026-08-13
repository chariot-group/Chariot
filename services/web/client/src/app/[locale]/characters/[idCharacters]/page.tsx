"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";

export default function Character() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const characterId = params.idCharacters as string;
  const locale = pathname.split("/")[1] || "fr";
  const sessionCode = searchParams.get("sessionCode");
  const { character, loading, error, refetch, setCharacter } = useCharacter(characterId, sessionCode);
  const { loading: keycloakLoading, userTransitioning } = useKeycloak();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // FR-user-cache-isolation: hard-navigate out of forbidden sheets (breaks client router loops).
  useEffect(() => {
    if (keycloakLoading || userTransitioning || loading) return;
    if (!error && character) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    const target = `/${locale}/welcome`;
    // Full navigation avoids soft-router ping-pong with post-login / stale cache.
    window.location.replace(target);
  }, [keycloakLoading, userTransitioning, loading, error, character, router, locale]);

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
