"use client";

import {
  selectBattleInitialized,
  selectBattleStateSnapshot,
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  applyRemoteBattleState,
  type BattleStateSnapshot,
} from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  emitBattleStateUpdate,
  registerBattleStateBroadcastScheduler,
  registerBattleStateRequestResponder,
  respondToBattleStateRequest,
} from "@/lib/sessionBattleSyncBridge";
import { getPooledSessionSocket } from "@/lib/sessionSocketPool";
import { useEffect, useRef } from "react";

const BATTLE_SYNC_DEBOUNCE_MS = 250;

function isGameMaster(
  participants: ReturnType<typeof selectSessionParticipants>,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return participants.some((p) => p.userId === userId && p.status === "gameMaster");
}

/**
 * FR-015 — synchronise l'état combat MJ ↔ joueurs via WebSocket.
 */
export function useSessionBattleSync() {
  const dispatch = useAppDispatch();
  const isInSession = useAppSelector(selectIsInSession);
  const code = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useAppSelector(selectUser);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const snapshot = useAppSelector(selectBattleStateSnapshot);

  const snapshotRef = useRef(snapshot);
  const isGmRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    isGmRef.current = isGameMaster(participants, user?.keycloakId);
  }, [participants, user?.keycloakId]);

  const broadcastSnapshot = (state: BattleStateSnapshot) => {
    const socket = getPooledSessionSocket();
    if (!socket?.connected || !code) return;
    socket.emit("session:battle-state-updated", {
      sessionId: code,
      state,
    });
  };

  useEffect(() => {
    if (!isInSession) {
      registerBattleStateBroadcastScheduler(null);
      registerBattleStateRequestResponder(null);
      return;
    }

    registerBattleStateBroadcastScheduler((state) => {
      if (!isGmRef.current) return;
      broadcastSnapshot(state);
    });

    registerBattleStateRequestResponder(() => {
      if (!isGmRef.current || !snapshotRef.current.battleInitialized) return null;
      return snapshotRef.current;
    });

    return () => {
      registerBattleStateBroadcastScheduler(null);
      registerBattleStateRequestResponder(null);
    };
  }, [isInSession, code]);

  const isGm = isGameMaster(participants, user?.keycloakId);

  useEffect(() => {
    if (!isInSession || !isGm || !battleInitialized) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      emitBattleStateUpdate(snapshotRef.current);
    }, BATTLE_SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [battleInitialized, isGm, isInSession, snapshot]);

  useEffect(() => {
    if (!isInSession || !code || isGm) return;

    const socket = getPooledSessionSocket();
    if (!socket) return;

    const requestState = () => {
      socket.emit("session:request-battle-state", { sessionId: code });
    };

    if (!battleInitialized) {
      requestState();
    }

    const onBattleStateUpdated = ({ state }: { state: BattleStateSnapshot }) => {
      if (!state || typeof state !== "object") return;
      dispatch(applyRemoteBattleState(state));
    };

    socket.on("session:battle-state-updated", onBattleStateUpdated);
    socket.on("connect", requestState);

    return () => {
      socket.off("session:battle-state-updated", onBattleStateUpdated);
      socket.off("connect", requestState);
    };
  }, [battleInitialized, code, dispatch, isGm, isInSession]);

  useEffect(() => {
    if (!isInSession || !code || !isGm) return;

    const socket = getPooledSessionSocket();
    if (!socket) return;

    const onBattleStateRequested = () => {
      const current = respondToBattleStateRequest();
      if (current) {
        broadcastSnapshot(current);
      }
    };

    const onParticipantJoined = () => {
      if (snapshotRef.current.battleInitialized) {
        emitBattleStateUpdate(snapshotRef.current);
      }
    };

    socket.on("session:battle-state-requested", onBattleStateRequested);
    socket.on("session:participant-joined", onParticipantJoined);

    return () => {
      socket.off("session:battle-state-requested", onBattleStateRequested);
      socket.off("session:participant-joined", onParticipantJoined);
    };
  }, [code, isGm, isInSession]);
}
