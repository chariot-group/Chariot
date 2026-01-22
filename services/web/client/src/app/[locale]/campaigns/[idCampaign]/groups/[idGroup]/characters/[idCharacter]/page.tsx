"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useCharacter } from "@/hooks/useCharacter";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Character() {
  const t = useTranslations();
  const params = useParams();
  const characterId = params.idCharacter as string;

  const { character, loading, error } = useCharacter(characterId);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error || !character) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">{error || "Personnage introuvable"}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">{character.name}</h1>
      </div>
    </AppLayout>
  );
}
