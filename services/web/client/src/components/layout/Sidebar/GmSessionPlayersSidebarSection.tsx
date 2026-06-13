"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Swords } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectUser } from "@/store/slices/userSlice";
import {
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  selectCharacterSheetRemoteVersions,
  selectSessionParticipantDisplayNames,
  mergeSessionParticipantDisplayNames,
  pruneSessionParticipantDisplayNames,
} from "@/store/slices/sessionSlice";
import { selectOpenSessionPlayers, setOpenSessionPlayers } from "@/store/slices/sidebarSlice";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import { fetchSessionParticipantDisplayName } from "@/lib/sessionParticipantDisplayNames";
import { useSidebar } from "@/components/ui/sidebar";
import characterService from "@/services/CharacterService";

const ROSTER_FETCH_DEBOUNCE_MS = 220;

/**
 * Personnages choisis par les joueurs pendant une session — visible uniquement pour le MJ.
 */
export default function GmSessionPlayersSidebarSection() {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isMobile, setOpenMobile } = useSidebar();
  const contextMode = useAppSelector(selectContextMode);
  const isInSession = useAppSelector(selectIsInSession);
  const sessionCode = useAppSelector(selectSessionCode);
  const participants = useAppSelector(selectSessionParticipants);
  const currentUser = useAppSelector(selectUser);
  const openSection = useAppSelector(selectOpenSessionPlayers);
  const remoteVersions = useAppSelector(selectCharacterSheetRemoteVersions);

  const displayNames = useAppSelector(selectSessionParticipantDisplayNames);
  const [characterLabels, setCharacterLabels] = React.useState<Record<string, string>>({});

  const locale = pathname?.split("/")[1] ?? "fr";

  const isGm =
    !!currentUser?.keycloakId &&
    participants.some((p) => p.userId === currentUser.keycloakId && p.status === "gameMaster");

  /** Tous les humains hors MJ dans la session (y compris avant choix de personnage). */
  const presenceRoster = React.useMemo(() => participants.filter((p) => p.status !== "gameMaster"), [participants]);

  /**
   * Signature ordre-indépendante : réordonnement HTTP uniquement sans changer les paires
   * (inclut `characterId` vide tant que le joueur n’a pas choisi).
   */
  const rosterStableKey = React.useMemo(() => {
    return presenceRoster
      .map((p) => `${p.userId}:${p.characterId ?? ""}`)
      .sort()
      .join("\u001f");
  }, [presenceRoster]);

  /** Dernière liste participants — alignée sur le store après le commit (voir effets roster). */
  const participantsRef = React.useRef(participants);
  React.useLayoutEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const rosterRemoteVersionsKey = React.useMemo(() => {
    const roster = participants.filter(
      (p) => p.status !== "gameMaster" && p.characterId != null && String(p.characterId).length > 0,
    );
    return roster
      .map((p) => {
        const cid = String(p.characterId);
        return `${cid}:${remoteVersions[cid] ?? 0}`;
      })
      .sort()
      .join("|");
  }, [remoteVersions, participants]);

  /** Retirer labels des joueurs qui ne sont plus au roster (évite d’afficher un UUID fantôme). */
  React.useEffect(() => {
    const rosterPresence = participantsRef.current.filter((p) => p.status !== "gameMaster");
    const rosterWithSheet = rosterPresence.filter((p) => p.characterId != null && p.characterId.length > 0);
    const cids = new Set(
      rosterWithSheet.map((p) => p.characterId).filter((id): id is string => Boolean(id && id.length > 0)),
    );
    dispatch(pruneSessionParticipantDisplayNames());
    setCharacterLabels((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!cids.has(k)) delete next[k];
      }
      return next;
    });
  }, [dispatch, rosterStableKey]);

  const prevRemoteVersionsRef = React.useRef<Record<string, number>>({});

  /** Après une synchro WS sur une fiche, mettre à jour le libellé concerné uniquement (évite le burst HTTP / 429). */
  React.useEffect(() => {
    const roster = participantsRef.current.filter(
      (p) => p.status !== "gameMaster" && p.characterId != null && p.characterId.length > 0,
    );
    if (!isInSession || contextMode !== "gm" || !isGm || !sessionCode || roster.length === 0) {
      prevRemoteVersionsRef.current = {};
      return;
    }

    const toRefetch: string[] = [];
    const nextPrev = { ...prevRemoteVersionsRef.current };

    for (const p of roster) {
      const cid = p.characterId as string;
      const v = remoteVersions[cid] ?? 0;
      const prev = nextPrev[cid] ?? 0;
      if (v > prev) {
        toRefetch.push(cid);
      }
      nextPrev[cid] = v;
    }

    prevRemoteVersionsRef.current = nextPrev;

    if (toRefetch.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const charUpdates: Record<string, string> = {};
      for (const cid of toRefetch) {
        try {
          const ch = await characterService.getCharacterById(cid, { sessionCode });
          let label = ch.firstname?.trim() ?? "";
          if (ch.lastname) label += ` ${ch.lastname.trim()}`;
          charUpdates[cid] = label.trim() || cid;
        } catch {
          charUpdates[cid] = cid;
        }
        if (cancelled) return;
      }
      if (!cancelled && Object.keys(charUpdates).length > 0) {
        setCharacterLabels((prev) => ({ ...prev, ...charUpdates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contextMode, isGm, isInSession, remoteVersions, rosterRemoteVersionsKey, rosterStableKey, sessionCode]);

  /** Chargement initial / changement de roster : requêtes espacées pour rester sous le rate limit gateway. */
  React.useEffect(() => {
    if (!isInSession || contextMode !== "gm" || !isGm || !sessionCode) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const roster = participantsRef.current.filter((p) => p.status !== "gameMaster");
        if (roster.length === 0 || cancelled) return;
        const nameUpdates: Record<string, string> = {};
        const charUpdates: Record<string, string> = {};
        for (const p of roster) {
          const existing = displayNames[p.userId];
          if (!existing || existing === SESSION_PARTICIPANT_NAME_LOADING) {
            const label = await fetchSessionParticipantDisplayName(p.userId);
            if (label !== SESSION_PARTICIPANT_NAME_LOADING) {
              nameUpdates[p.userId] = label;
            }
          }
          const cid = p.characterId?.trim();
          if (!cid) {
            continue;
          }
          try {
            const ch = await characterService.getCharacterById(cid, { sessionCode });
            let label = ch.firstname?.trim() ?? "";
            if (ch.lastname) label += ` ${ch.lastname.trim()}`;
            charUpdates[cid] = label.trim() || cid;
          } catch {
            charUpdates[cid] = cid;
          }
          if (cancelled) return;
        }
        if (!cancelled) {
          if (Object.keys(nameUpdates).length > 0) {
            dispatch(mergeSessionParticipantDisplayNames(nameUpdates));
          }
          setCharacterLabels((prev) => ({ ...prev, ...charUpdates }));
        }
      })();
    }, ROSTER_FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contextMode, dispatch, displayNames, isGm, isInSession, rosterStableKey, sessionCode]);

  if (!isInSession || contextMode !== "gm" || !isGm || !sessionCode || presenceRoster.length === 0) {
    return null;
  }

  const selectedCharacterId = pathname?.includes("/characters/")
    ? pathname.split("/characters/")[1]?.split("/")[0]?.split("?")[0]
    : null;

  const handleOpenChange = (isOpen: boolean) => {
    dispatch(setOpenSessionPlayers(isOpen));
  };

  return (
    <Collapsible
      open={openSection}
      onOpenChange={handleOpenChange}>
      <div className="flex w-full items-center gap-1 rounded-[12px] bg-card py-2 px-1.5 pl-3">
        <CollapsibleTrigger
          aria-expanded={openSection}
          aria-controls="session-players-content"
          className="flex flex-1 min-w-0 cursor-pointer items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50">
          <ChevronRight
            aria-hidden="true"
            className={cn("h-4 w-4 shrink-0 transition-all duration-100", openSection && "rotate-90")}
          />
          <span className={cn("min-w-0 flex-1 truncate text-sm text-left", openSection && "font-bold")}>
            {t("sessionPlayers")}
          </span>
        </CollapsibleTrigger>
        <span className="flex shrink-0 items-center justify-center rounded-[8px] p-1.5">
          <Swords
            aria-hidden="true"
            className="h-4 w-4 text-yellow"
          />
        </span>
      </div>
      <CollapsibleContent
        id="session-players-content"
        className="mt-1 ml-3 flex flex-col gap-1">
        {presenceRoster.map((p) => {
          const cid = p.characterId?.trim();
          const userLabel = displayNames[p.userId] ?? SESSION_PARTICIPANT_NAME_LOADING;
          const hasSheet = Boolean(cid);
          const charLabel = hasSheet ? (characterLabels[cid!] ?? cid!) : "";
          const href = cid
            ? `/${locale}/characters/${encodeURIComponent(cid)}?sessionCode=${encodeURIComponent(sessionCode)}`
            : "";
          const isSelected = Boolean(cid && selectedCharacterId === cid);

          const primaryLabel = hasSheet ? charLabel : t("sessionPlayerChoosingCharacter");
          const inlineLabel = `${primaryLabel} – ${userLabel}`;

          const rowClasses = cn(
            "relative w-full shrink-0 py-1.5 px-3 rounded-[12px] transition-all duration-150 flex flex-col gap-0 focus-visible:ring-1 focus-visible:ring-white/50",
            hasSheet
              ? cn("cursor-pointer", isSelected ? "bg-white pl-4 font-bold text-black" : "hover:bg-white/10")
              : "cursor-default opacity-60",
          );

          const innerLabel = (
            <>
              {isSelected && hasSheet && (
                <span
                  className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <span className={cn("text-sm truncate w-full", !hasSheet && "italic")}>
                {primaryLabel}
              </span>
              <span className={cn("text-xs truncate w-full", isSelected ? "text-black/50" : "text-white/50")}>
                {userLabel}
              </span>
            </>
          );

          return (
            hasSheet ? (
              <Link
                key={`${p.userId}-${cid ?? "pending"}`}
                href={href}
                aria-current={isSelected ? "page" : undefined}
                aria-label={inlineLabel}
                className={rowClasses}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}>
                {innerLabel}
              </Link>
            ) : (
              <div
                key={`${p.userId}-${cid ?? "pending"}`}
                className={rowClasses}
                aria-label={inlineLabel}>
                {innerLabel}
              </div>
            )
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
