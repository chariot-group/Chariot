"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";

export default function Character() {
  const params = useParams();
  const characterId = params.idCharacter as string;
  const router = useRouter();

  const { character, loading, error, refetch } = useCharacter(characterId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && (error || !character)) {
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
      onCharacterUpdate={refetch}
    />
  );
}
