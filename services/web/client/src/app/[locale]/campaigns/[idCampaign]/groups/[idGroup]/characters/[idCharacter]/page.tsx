"use client";

import { useCharacter } from "@/hooks/useCharacter";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Player, NPC } from "@/types/character";
import CharacterDetailView from "@/components/character/CharacterDetailView";
import { useAppSelector } from "@/store/hooks";
import { selectActiveGroups, selectArchivedGroups } from "@/store/slices/groupSlice";
import { selectContextMode } from "@/store/slices/environmentSlice";
import {
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
} from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";

export default function Character() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const campaignId = params.idCampaign as string;
  const groupId = params.idGroup as string;
  const characterId = params.idCharacter as string;
  const sessionCodeQs = searchParams.get("sessionCode");
  const activeGroups = useAppSelector(selectActiveGroups);
  const archivedGroups = useAppSelector(selectArchivedGroups);
  const contextMode = useAppSelector(selectContextMode);
  const isInSession = useAppSelector(selectIsInSession);
  const reduxSessionCode = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const currentUser = useAppSelector(selectUser);

  const { character, loading, error, refetch, setCharacter } = useCharacter(
    characterId,
    sessionCodeQs,
  );

  const sessionGmBypassGroup = useMemo(() => {
    if (contextMode !== "gm" || !isInSession || !sessionCodeQs || sessionCodeQs !== reduxSessionCode) {
      return false;
    }
    const isGm = participants.some(
      (p) => p.userId === currentUser?.keycloakId && p.status === "gameMaster",
    );
    if (!isGm) return false;
    return participants.some((p) => p.status !== "gameMaster" && p.characterId === characterId);
  }, [
    characterId,
    contextMode,
    currentUser?.keycloakId,
    isInSession,
    participants,
    reduxSessionCode,
    sessionCodeQs,
  ]);

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

    if (!groupIds.includes(groupId) && !sessionGmBypassGroup) {
      router.replace(getFallbackRoute());
    }
  }, [campaignId, character, getFallbackRoute, groupId, loading, router, sessionGmBypassGroup]);

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
