"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsInSession,
  selectSessionParticipants,
  setLastConsultedSheetPath,
} from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";

function isCharacterDetailPath(pathname: string): boolean {
  return (
    /\/characters\/[^/]+(?:\/|$)/.test(pathname) &&
    !pathname.includes("/characters/new")
  );
}

/**
 * FR-session-combat-navigation — enregistre la dernière fiche consultée par le MJ pendant une session active.
 */
export function useLastConsultedSheetTracking() {
  const pathname = usePathname() ?? "";
  const dispatch = useAppDispatch();
  const isInSession = useAppSelector(selectIsInSession);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!isInSession || !isCharacterDetailPath(pathname)) return;

    const userId = user?.keycloakId;
    if (!userId) return;

    const isGm = participants.some((p) => p.userId === userId && p.status === "gameMaster");
    if (!isGm) return;

    dispatch(setLastConsultedSheetPath(pathname));
  }, [dispatch, isInSession, participants, pathname, user?.keycloakId]);
}
