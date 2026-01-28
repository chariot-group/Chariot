"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Character() {
  const params = useParams();
  const characterId = params.idCharacter as string;

  const { character, loading, error } = useCharacter(characterId);

  if (loading || error || !character) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{character.name}</h1>
    </div>
  );
}
