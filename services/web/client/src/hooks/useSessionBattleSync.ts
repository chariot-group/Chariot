"use client";

import {
  selectBattleInitialized,
  selectBattleStarted,
  selectBattleStateSnapshot,
  selectInitiativeTrackerRows,
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  applyRemoteBattleState,
  updateInitiativeTrackerRow,
  type BattleStateSnapshot,
} from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import {
  emitBattleStateUpdate,
  registerBattleStateBroadcastScheduler,
  registerBattleStateRequestResponder,
  respondToBattleStateRequest,
} from "@/lib/sessionBattleSyncBridge";
import { registerConcentrationUpdateApplier } from "@/lib/sessionConcentrationBridge";
import { getPooledSessionSocket } from "@/lib/sessionSocketPool";
import { sanitizeBattleStateSnapshotForPlayers } from "@/components/initiativeTracker/utils";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useCallback, useEffect, useRef } from "react";

const BATTLE_SYNC_DEBOUNCE_MS = 250;

export function shouldBroadcastBattleStateSnapshot(
  snapshot: Pick<BattleStateSnapshot, "battleInitialized" | "battleStarted" | "allowPlayerInitiativeInput">,
  hadBroadcastVisibleBattle: boolean,
): boolean {
  const visibleToPlayers = snapshot.battleStarted || (
    snapshot.battleInitialized && snapshot.allowPlayerInitiativeInput
  );
  return visibleToPlayers || (!snapshot.battleInitialized && hadBroadcastVisibleBattle);
}

function isGameMaster(
  participants: ReturnType<typeof selectSessionParticipants>,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return participants.some((p) => p.userId === userId && p.status === "gameMaster");
}

/**
 * FR-session-combat-navigation — synchronise l'état combat MJ ↔ joueurs via WebSocket.
 */
export function useSessionBattleSync() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const isInSession = useAppSelector(selectIsInSession);
  const code = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useAppSelector(selectUser);
  const { keycloak } = useKeycloak();
  const currentUserId = user?.keycloakId ?? keycloak?.tokenParsed?.sub;
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const snapshot = useAppSelector(selectBattleStateSnapshot);

  const snapshotRef = useRef(snapshot);
  const codeRef = useRef(code);
  const isGmRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasBroadcastVisibleBattleRef = useRef(
    snapshot.battleStarted || (snapshot.battleInitialized && snapshot.allowPlayerInitiativeInput),
  );

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    isGmRef.current = isGameMaster(participants, currentUserId);
  }, [currentUserId, participants]);

  const broadcastSnapshot = useCallback((state: BattleStateSnapshot) => {
    const socket = getPooledSessionSocket();
    const sessionCode = codeRef.current;
    if (!socket?.connected || !sessionCode) return;
    socket.emit("session:battle-state-updated", {
      sessionId: sessionCode,
      state: sanitizeBattleStateSnapshotForPlayers(state),
    });
  }, []);

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
      if (
        !isGmRef.current ||
        (!snapshotRef.current.battleStarted
          && !(snapshotRef.current.battleInitialized && snapshotRef.current.allowPlayerInitiativeInput))
      ) {
        return null;
      }
      return snapshotRef.current;
    });

    return () => {
      registerBattleStateBroadcastScheduler(null);
      registerBattleStateRequestResponder(null);
    };
  }, [broadcastSnapshot, isInSession]);

  useEffect(() => {
    if (!isInSession) {
      registerConcentrationUpdateApplier(null);
      return;
    }

    registerConcentrationUpdateApplier((payload) => {
      if (!isGmRef.current) return;

      const state = store.getState();
      if (!selectBattleStarted(state)) return;

      const row = selectInitiativeTrackerRows(state).find(
        (candidate) => candidate.characterId === payload.characterId,
      );
      if (!row) return;

      dispatch(updateInitiativeTrackerRow({
        id: row.id,
        changes: {
          concentration: payload.concentration,
          pendingConcentrationCheck: payload.pendingConcentrationCheck ?? null,
        },
      }));

      emitBattleStateUpdate(selectBattleStateSnapshot(store.getState()));
    });

    return () => {
      registerConcentrationUpdateApplier(null);
    };
  }, [dispatch, isInSession, store]);

  const isGm = isGameMaster(participants, currentUserId);

  useEffect(() => {
    if (!isInSession || !isGm) return;

    const hadBroadcastVisibleBattle = hasBroadcastVisibleBattleRef.current;
    const shouldBroadcast = shouldBroadcastBattleStateSnapshot(snapshot, hadBroadcastVisibleBattle);
    if (!shouldBroadcast) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      hasBroadcastVisibleBattleRef.current =
        snapshotRef.current.battleStarted
        || (snapshotRef.current.battleInitialized && snapshotRef.current.allowPlayerInitiativeInput);
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

    if (!battleInitialized && !snapshot.battleStarted) {
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
  }, [battleInitialized, code, dispatch, isGm, isInSession, snapshot.battleStarted]);

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
      if (
        snapshotRef.current.battleStarted
        || (snapshotRef.current.battleInitialized && snapshotRef.current.allowPlayerInitiativeInput)
      ) {
        emitBattleStateUpdate(snapshotRef.current);
      }
    };

    socket.on("session:battle-state-requested", onBattleStateRequested);
    socket.on("session:participant-joined", onParticipantJoined);

    return () => {
      socket.off("session:battle-state-requested", onBattleStateRequested);
      socket.off("session:participant-joined", onParticipantJoined);
    };
  }, [broadcastSnapshot, code, isGm, isInSession]);
}
