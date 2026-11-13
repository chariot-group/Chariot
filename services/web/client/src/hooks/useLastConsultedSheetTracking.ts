"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsSessionLaunched,
  selectSessionCode,
  selectSessionParticipants,
  setLastConsultedSheetPath,
} from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";
import { withSessionCodeQuery } from "@/lib/sessionInAppNavigation";

function isCharacterDetailPath(pathname: string): boolean {
  return (
    /\/characters\/[^/]+(?:\/|$)/.test(pathname) &&
    !pathname.includes("/characters/new")
  );
}

/**
 * FR-session-combat-navigation — enregistre la dernière fiche consultée par le MJ pendant une session active.
 * Inclut `sessionCode` pour conserver l'accès roster aux fiches non propriétaires.
 */
export function useLastConsultedSheetTracking() {
  const pathname = usePathname() ?? "";
  const dispatch = useAppDispatch();
  const isSessionLaunched = useAppSelector(selectIsSessionLaunched);
  const sessionCode = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!isSessionLaunched || !isCharacterDetailPath(pathname)) return;

    const userId = user?.keycloakId;
    if (!userId) return;

    const isGm = participants.some((p) => p.userId === userId && p.status === "gameMaster");
    if (!isGm) return;

    dispatch(setLastConsultedSheetPath(withSessionCodeQuery(pathname, sessionCode)));
  }, [dispatch, isSessionLaunched, participants, pathname, sessionCode, user?.keycloakId]);
}
