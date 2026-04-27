"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";
import { useAppSelector } from "@/store/hooks";
import { selectActiveGroups, selectArchivedGroups } from "@/store/slices/groupSlice";

export default function Character() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const campaignId = params.idCampaign as string;
  const groupId = params.idGroup as string;
  const characterId = params.idCharacter as string;
  const activeGroups = useAppSelector(selectActiveGroups);
  const archivedGroups = useAppSelector(selectArchivedGroups);

  const { character, loading, error, refetch, setCharacter } = useCharacter(characterId);

  const getFallbackRoute = useCallback((): string => {
    const remainingActive = activeGroups.filter((group) => group._id !== groupId);
    const remainingArchived = archivedGroups.filter((group) => group._id !== groupId);

    const groupWithCharacter =
      remainingActive.find((group) => (group.characters?.length || 0) > 0) ||
      remainingArchived.find((group) => (group.characters?.length || 0) > 0);

    if (groupWithCharacter && groupWithCharacter.characters[0]?._id) {
      return `/campaigns/${campaignId}/groups/${groupWithCharacter._id}/characters/${groupWithCharacter.characters[0]._id}`;
    }

    if (remainingActive.length > 0) {
      return `/campaigns/${campaignId}/groups/${remainingActive[0]._id}/characters/new/players`;
    }

    if (remainingArchived.length > 0) {
      return `/campaigns/${campaignId}/groups/${remainingArchived[0]._id}/characters/new/players`;
    }

    return `/${locale}`;
  }, [activeGroups, archivedGroups, campaignId, groupId, locale]);

  useEffect(() => {
    if (loading || !character || !groupId || !campaignId) {
      return;
    }

    const groupIds = (character.groups || [])
      .map((group) => {
        if (typeof group === "string") return group;
        if (typeof group === "object" && group !== null && "_id" in group) {
          return (group as { _id?: string })._id;
        }
        return undefined;
      })
      .filter((id: string | undefined): id is string => Boolean(id));

    if (!groupIds.includes(groupId)) {
      router.replace(getFallbackRoute());
    }
  }, [campaignId, character, getFallbackRoute, groupId, loading, router]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (error || !character) {
      router.replace(getFallbackRoute());
    }
  }, [loading, error, character, router, getFallbackRoute]);

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
