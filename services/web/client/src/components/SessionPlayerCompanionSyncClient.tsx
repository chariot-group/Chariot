"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import { SESSION_PARTICIPANTS_GROUP_LABEL } from "@/lib/buildSessionParticipantsGroup";
import {
  assignedPlayerCharacterIds,
  assignedPlayerIdsSignature,
  companionCharacterIds,
  companionTrackerRowIdsToRemove,
  diffCharacterIds,
  withNormalizedLinkedPlayerId,
} from "@/lib/sessionPlayerCompanions";
import { showToast } from "@/lib/toast";
import characterService from "@/services/CharacterService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/userSlice";
import {
  appendInitiativeTrackerRows,
  createInitiativeTrackerRow,
  removeInitiativeTrackerRows,
  selectBattleInitialized,
  selectInitiativeTrackerRows,
  selectIsInSession,
  selectSessionCode,
  selectSessionCompanionNpcs,
  selectSessionParticipants,
  setSessionCompanionNpcs,
} from "@/store/slices/sessionSlice";
import type { NPC } from "@/types/character";

const FETCH_DEBOUNCE_MS = 220;

function isSessionGm(
  participants: ReturnType<typeof selectSessionParticipants>,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return participants.some((participant) => participant.userId === userId && participant.status === "gameMaster");
}

function companionTrackerRow(npc: NPC) {
  const stats = npc.stats;
  const row = createInitiativeTrackerRow({
    groupId: SESSION_PARTICIPANTS_GROUP_ID,
    groupLabel: SESSION_PARTICIPANTS_GROUP_LABEL,
    characterId: npc._id,
    firstname: npc.firstname ?? "",
    lastname: npc.lastname ?? "",
    surname: npc.surname ?? "",
    avatar: npc.avatar ?? "",
    hitPoints: stats?.currentHitPoints ?? stats?.maxHitPoints ?? 0,
    maxHitPoints: stats?.maxHitPoints ?? 0,
    tempHitPoints: stats?.tempHitPoints ?? 0,
    armorClass: stats?.armorClass ?? 10,
    kind: "npc",
    initiativeModifier: stats?.initiative ?? 0,
  });
  return { ...row, isPlayerCompanion: true as const };
}

/**
 * GM-only: derive player companions from the roster and keep tracker rows in sync.
 * @see FR-session-player-companion-combatants
 */
export default function SessionPlayerCompanionSyncClient() {
  const dispatch = useAppDispatch();
  const t = useTranslations("characterDetail.companions");
  const tRef = useRef(t);
  tRef.current = t;
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const currentUser = useAppSelector(selectUser);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const trackerRows = useAppSelector(selectInitiativeTrackerRows);
  const companions = useAppSelector(selectSessionCompanionNpcs);

  const isGm = isSessionGm(participants, currentUser?.keycloakId);
  const playerIds = assignedPlayerCharacterIds(participants);
  const playerIdsKey = assignedPlayerIdsSignature(playerIds);
  const companionIdsKey = assignedPlayerIdsSignature(companionCharacterIds(companions));
  const previousCompanionIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isInSession || !isGm || !sessionCode) {
      if (companions.length > 0) {
        dispatch(setSessionCompanionNpcs([]));
      }
      previousCompanionIdsRef.current = [];
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const npcs =
            playerIds.length === 0
              ? []
              : await characterService.getNpcsByLinkedPlayers(playerIds, { sessionCode });
          if (!cancelled) {
            dispatch(setSessionCompanionNpcs(npcs.map(withNormalizedLinkedPlayerId)));
          }
        } catch {
          if (!cancelled) {
            showToast(tRef.current("loadError"), "error", {
              toastId: "session-companion-lookup-error",
            });
            if (companions.length === 0) {
              dispatch(setSessionCompanionNpcs([]));
            }
          }
        }
      })();
    }, FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // companions.length is only used to avoid clobbering a successful cache on fetch failure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isGm, isInSession, playerIdsKey, sessionCode]);

  useEffect(() => {
    const nextIds = companionCharacterIds(companions);
    const { added, removed } = diffCharacterIds(previousCompanionIdsRef.current, nextIds);
    previousCompanionIdsRef.current = nextIds;

    if (!isInSession || !isGm || !battleInitialized) {
      return;
    }

    if (removed.length > 0) {
      const rowIds = companionTrackerRowIdsToRemove(trackerRows, removed);
      if (rowIds.length > 0) {
        dispatch(removeInitiativeTrackerRows(rowIds));
      }
    }

    if (added.length === 0) return;
    const existingIds = new Set(trackerRows.map((row) => row.characterId));
    const rows = companions
      .filter((npc) => added.includes(npc._id) && !existingIds.has(npc._id))
      .map(companionTrackerRow);
    if (rows.length > 0) {
      dispatch(appendInitiativeTrackerRows(rows));
    }
  }, [battleInitialized, companionIdsKey, companions, dispatch, isGm, isInSession, trackerRows]);

  return null;
}
