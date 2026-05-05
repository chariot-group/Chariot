"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import { selectUser } from "@/store/slices/userSlice";
import {
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  selectCharacterSheetRemoteVersions,
} from "@/store/slices/sessionSlice";
import {
  selectOpenSessionPlayers,
  setOpenSessionPlayers,
} from "@/store/slices/sidebarSlice";
import UserService from "@/services/UserService";
import { useSidebar } from "@/components/ui/sidebar";
import characterService from "@/services/CharacterService";

const ROSTER_FETCH_DEBOUNCE_MS = 450;

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

  const [displayNames, setDisplayNames] = React.useState<Record<string, string>>({});
  const [characterLabels, setCharacterLabels] = React.useState<Record<string, string>>({});

  const locale = pathname?.split("/")[1] ?? "fr";

  const isGm =
    !!currentUser?.keycloakId &&
    participants.some((p) => p.userId === currentUser.keycloakId && p.status === "gameMaster");

  const playerRoster = participants.filter(
    (p) => p.status !== "gameMaster" && p.characterId != null && p.characterId.length > 0,
  );

  const rosterKey = playerRoster.map((p) => `${p.userId}:${p.characterId}`).join("|");

  /** Retirer labels des joueurs qui ne sont plus au roster (évite d’afficher un UUID fantôme). */
  React.useEffect(() => {
    const roster = participants.filter(
      (p) => p.status !== "gameMaster" && p.characterId != null && p.characterId.length > 0,
    );
    const uids = new Set(roster.map((p) => p.userId));
    const cids = new Set(
      roster.map((p) => p.characterId).filter((id): id is string => Boolean(id && id.length > 0)),
    );
    setDisplayNames((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!uids.has(k)) delete next[k];
      }
      return next;
    });
    setCharacterLabels((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!cids.has(k)) delete next[k];
      }
      return next;
    });
  }, [participants]);

  const prevRemoteVersionsRef = React.useRef<Record<string, number>>({});

  /** Après une synchro WS sur une fiche, mettre à jour le libellé concerné uniquement (évite le burst HTTP / 429). */
  React.useEffect(() => {
    const roster = participants.filter(
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
  }, [contextMode, isGm, isInSession, participants, remoteVersions, rosterKey, sessionCode]);

  /** Chargement initial / changement de roster : requêtes espacées pour rester sous le rate limit gateway. */
  React.useEffect(() => {
    const roster = participants.filter(
      (p) => p.status !== "gameMaster" && p.characterId != null && p.characterId.length > 0,
    );
    if (!isInSession || contextMode !== "gm" || !isGm || !sessionCode || roster.length === 0) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const nameUpdates: Record<string, string> = {};
        const charUpdates: Record<string, string> = {};
        for (const p of roster) {
          const cid = p.characterId as string;
          try {
            const u = await UserService.getUserById(p.userId);
            nameUpdates[p.userId] = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username;
          } catch {
            nameUpdates[p.userId] = p.userId;
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
          setDisplayNames((prev) => ({ ...prev, ...nameUpdates }));
          setCharacterLabels((prev) => ({ ...prev, ...charUpdates }));
        }
      })();
    }, ROSTER_FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contextMode, isGm, isInSession, participants, rosterKey, sessionCode]);

  if (!isInSession || contextMode !== "gm" || !isGm || !sessionCode || playerRoster.length === 0) {
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
      className="rounded-[15px] border-2"
      open={openSection}
      onOpenChange={handleOpenChange}>
      <CollapsibleTrigger
        aria-expanded={openSection}
        aria-controls="session-players-content"
        className={`w-full cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center gap-2 group/context focus-visible:border ${openSection ? "bg-white" : ""}`}>
        <span className="flex min-w-0 items-center gap-2">
          <Users
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 transition-colors group-hover/context:text-black ${openSection ? "text-black" : ""}`}
          />
          <span
            className={`text-sm truncate group-hover/context:font-bold group-hover/context:text-black ${openSection ? "text-black font-bold" : ""}`}>
            {t("sessionPlayers")}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`w-5 h-5 group-hover/context:text-black transition-all duration-100 ${openSection ? "rotate-90 text-black" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        id="session-players-content"
        className="my-2 flex mx-5 flex-col gap-1">
        {playerRoster.map((p) => {
          const cid = p.characterId as string;
          const userLabel = displayNames[p.userId] ?? p.userId;
          const charLabel = characterLabels[cid] ?? cid;
          const href = `/${locale}/characters/${encodeURIComponent(cid)}?sessionCode=${encodeURIComponent(sessionCode)}`;
          const isSelected = selectedCharacterId === cid;
          return (
            <Tooltip key={`${p.userId}-${cid}`}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  aria-current={isSelected ? "page" : undefined}
                  aria-label={`${charLabel} — ${t("playedBy", { name: userLabel })}`}
                  title={t("playedBy", { name: userLabel })}
                  className={`w-full text-xs py-1.5 px-3 rounded-[8px] flex items-center gap-2 hover:bg-card/50 transition-all duration-100 cursor-pointer focus-visible:ring-1 ${isSelected ? "bg-card/50 font-bold" : ""}`}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}>
                  <span className="block min-w-0 flex-1 truncate">{charLabel}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("playedBy", { name: userLabel })}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
