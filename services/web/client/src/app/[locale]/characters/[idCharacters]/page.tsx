"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";

export default function Character() {
  const params = useParams();
  const searchParams = useSearchParams();
  const characterId = params.idCharacters as string;
  const sessionCode = searchParams.get("sessionCode");
  const { character, loading, error, refetch, setCharacter } = useCharacter(characterId, sessionCode);
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirection conditionnelle après le chargement complet
  if (!loading && (error || !character)) {
    // Utiliser un délai de grâce pour éviter les redirections pendant transition
    setTimeout(() => {
      if (!character) {
        router.push(`/404`);
      }
    }, 500);

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
