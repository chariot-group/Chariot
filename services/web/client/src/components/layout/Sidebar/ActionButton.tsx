"use client";

import { useEffect, useState } from "react";
import { Button, type ButtonTone } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  resolveReturnToSessionTone,
  resolveSessionActionRole,
  shouldShowLobbyOpenIndicator,
} from "@/lib/sessionPresenceUi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LucideSwords, PlayCircle, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sessionService from "@/services/SessionService";
import {
  findActiveCampaignSession,
  hasJoinedPlayer,
  isLaunchedSessionStillActive,
  shouldGmReturnToSession,
} from "@/lib/findActiveCampaignSession";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { setContextMode } from "@/store/slices/environmentSlice";
import {
  selectCurrentSession,
  selectCurrentUserParticipant,
  selectBattleInitialized,
  selectBattleStarted,
  selectIsInSession,
  selectSessionStatus,
  selectSessionParticipants,
  selectSessionLobbyOpen,
  selectLastConsultedSheetPath,
  selectLastLeftSessionCode,
  openSessionLobby,
  setCurrentSession,
} from "@/store/slices/sessionSlice";
import { LazyJoinSessionDialog } from "@/components/lazy/lazyDialogs";
import { InitBattleDialog } from "@/components/dialogs/InitBattleDialog";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { useUser } from "@/hooks/useUser";
import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import {
  shouldGmShowReturnToBattle,
  shouldGmShowReturnToSheet,
  shouldPlayerShowReturnToBattleOnSessionLobby,
  shouldPlayerShowReturnToSheetOnSessionLobby,
  withSessionCodeQuery,
} from "@/lib/sessionInAppNavigation";

/** Lobby ouvert : anneau distinct du focus clavier (offset plus large, couleur de texte du thème). */
const activeButtonClassName = "ring-2 ring-foreground ring-offset-4 ring-offset-background";

interface ActionButtonConfig {
  label: string;
  action: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  tone: ButtonTone;
  state: ActionButtonState;
  tooltip?: string;
  /** FR-session-lobby-modal — lobby affiché : état « en cours », indicatif. */
  active?: boolean;
}

type ActionButtonState =
  | "initBattle"
  | "launchSession"
  | "joinSession"
  | "startBattle"
  | "returnToBattle"
  | "returnToSheet"
  | "returnToSession";

export function ActionButton() {
  const t = useTranslations("sidebar");
  const tWelcome = useTranslations("welcome");
  const [isJoinSessionDialogOpen, setIsJoinSessionDialogOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const currentPage = usePathname() || "/";
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const isInSession = useAppSelector(selectIsInSession);
  const session = useAppSelector(selectCurrentSession);
  const sessionParticipants = useAppSelector(selectSessionParticipants);
  const isSessionLobbyOpen = useAppSelector(selectSessionLobbyOpen);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const user = useUser();
  const lastConsultedSheetPath = useAppSelector(selectLastConsultedSheetPath);

  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );

  useSessionValidation();

  // FR-session-lobby-modal — un MJ sorti d'une session encore active, lancée ou rejointe par un joueur, y retourne ; un lobby vide garde « Lancer une session ».
  const userId = user.user?.keycloakId;
  const [hasActiveCampaignSession, setHasActiveCampaignSession] = useState(false);
  useEffect(() => {
    if (isInSession || contextMode !== "gm" || !selectedCampaignId || !userId) {
      setHasActiveCampaignSession(false);
      return;
    }
    let cancelled = false;
    sessionService
      .getMySessions()
      .then((sessions) => {
        if (!cancelled) setHasActiveCampaignSession(
            shouldGmReturnToSession(findActiveCampaignSession(sessions, selectedCampaignId, userId), userId),
          );
      })
      .catch(() => {
        if (!cancelled) setHasActiveCampaignSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInSession, contextMode, selectedCampaignId, userId]);

  // FR-session-lobby-modal — un joueur sorti d'une session lancée et encore active y « retourne ».
  const lastLeftSessionCode = useAppSelector(selectLastLeftSessionCode);
  const [canReturnToLeftSession, setCanReturnToLeftSession] = useState(false);
  useEffect(() => {
    if (isInSession || contextMode === "gm" || !lastLeftSessionCode) {
      setCanReturnToLeftSession(false);
      return;
    }
    let cancelled = false;
    sessionService
      .getSession(lastLeftSessionCode)
      .then((session) => {
        if (!cancelled) setCanReturnToLeftSession(isLaunchedSessionStillActive(session));
      })
      .catch(() => {
        if (!cancelled) setCanReturnToLeftSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInSession, contextMode, lastLeftSessionCode]);

  const sessionStarted = sessionStatus && sessionStatus === "launched";
  const { characters: charactersWithoutGroup, loading: loadingCharactersWithoutGroup } = usePlayersWithoutGroup();

  const isJoinSessionDisabled = loadingCharactersWithoutGroup || charactersWithoutGroup.length === 0;

  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const isInitiativeTrackerPage = currentPage.endsWith("/initiativeTracker");
  const isCharacterPage = currentPage.includes("/characters/") && !currentPage.includes("/characters/new");

  const navigateToSession = (nextContextMode?: "player" | "gm") => {
    if (nextContextMode) {
      dispatch(setContextMode(nextContextMode));
    }
    dispatch(openSessionLobby());
  };

  const navigateToInitiativeTracker = () => {
    router.push("/initiativeTracker");
  };

  const navigateToPlayerCharacter = () => {
    const characterId = currentParticipant?.characterId;
    if (characterId) {
      const query = session?.code ? `?sessionCode=${encodeURIComponent(session.code)}` : "";
      router.push(`/characters/${encodeURIComponent(characterId)}${query}`);
    }
  };

  const navigateToLastConsultedSheet = () => {
    if (lastConsultedSheetPath) {
      router.push(withSessionCodeQuery(lastConsultedSheetPath, session?.code));
    }
  };

  const getButtonState = (): ActionButtonConfig => {
    if (!isInSession) {
      if (contextMode === "gm") {
        return {
          label: t(hasActiveCampaignSession ? "returnToSession" : "launchSession"),
          state: hasActiveCampaignSession ? "returnToSession" : "launchSession",
          action: async () => {
            if (!selectedCampaignId) return;
            const { campaignId, code } = await sessionService.createSession(selectedCampaignId);
            dispatch(setCurrentSession({ code, campaignId }));
            dispatch(openSessionLobby());
          },
          disabled: !selectedCampaignId,
          icon: <PlayCircle aria-hidden="true" />,
          tone: "yellow",
          tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
        };
      }

      return {
        label: t(canReturnToLeftSession ? "returnToSession" : "joinSession"),
        state: "joinSession",
        action: () => {
          if (isInSession) {
            dispatch(openSessionLobby());
          }
        },
        icon: <Users aria-hidden="true" />,
        disabled: isJoinSessionDisabled,
        tone: "green",
        tooltip: isJoinSessionDisabled ? tWelcome("session.noCharacterWithoutGroup") : undefined,
      };
    }

    // FR-session-lobby-modal — tant que la modale du lobby est ouverte, le bouton indique qu'on est dans la session.
    if (shouldShowLobbyOpenIndicator(isInSession, isSessionLobbyOpen)) {
      const role = resolveSessionActionRole(currentParticipant?.status, contextMode);
      return {
        label: t("returnToSession"),
        state: "returnToSession",
        action: () => navigateToSession(role === "player" ? "player" : undefined),
        disabled: false,
        icon: <PlayCircle aria-hidden="true" />,
        tone: resolveReturnToSessionTone(role),
        active: true,
      };
    }

    if (currentParticipant === null) {
      return {
        label: t("returnToSession"),
        state: "returnToSession",
        action: () => navigateToSession(contextMode === "player" ? "player" : undefined),
        disabled: false,
        icon: <PlayCircle aria-hidden="true" />,
        tone: resolveReturnToSessionTone(resolveSessionActionRole(null, contextMode)),
      };
    }

    if (currentParticipant?.status === "gameMaster") {
      // FR-session-lobby-modal — lobby jamais lancé : le MJ y « retourne » seulement si un joueur l'a rejoint.
      if (!sessionStarted) {
        const gmHasJoinedPlayer = hasJoinedPlayer(sessionParticipants, userId ?? "");
        return {
          label: t(gmHasJoinedPlayer ? "returnToSession" : "launchSession"),
          state: gmHasJoinedPlayer ? "returnToSession" : "launchSession",
          action: () => navigateToSession(),
          disabled: false,
          icon: <PlayCircle aria-hidden="true" />,
          tone: "yellow",
        };
      }

      if (sessionStarted && !battleInitialized) {
        return {
          label: t("initBattle"),
          state: "initBattle",
          action: () => {},
          disabled: false,
          icon: <LucideSwords aria-hidden="true" />,
          tone: "red",
        };
      }

      // FR-session-combat-navigation — combat initialisé ou démarré : retour fiche sur le tracker, retour combat ailleurs
      if (
        shouldGmShowReturnToSheet({
          sessionStarted: Boolean(sessionStarted),
          battleInitialized,
          pathname: currentPage,
        })
      ) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToLastConsultedSheet,
          disabled: !lastConsultedSheetPath,
          icon: <UserCircle aria-hidden="true" />,
          tone: "yellow",
          tooltip: !lastConsultedSheetPath ? t("noLastSheet") : undefined,
        };
      }

      if (
        shouldGmShowReturnToBattle({
          sessionStarted: Boolean(sessionStarted),
          battleInitialized,
          pathname: currentPage,
        })
      ) {
        return {
          label: t("returnToBattle"),
          state: "returnToBattle",
          action: navigateToInitiativeTracker,
          disabled: false,
          icon: <LucideSwords aria-hidden="true" />,
          tone: "red",
        };
      }
    } else {
      if (!sessionStarted) {
        return {
          label: t("returnToSession"),
          state: "returnToSession",
          action: () => navigateToSession("player"),
          disabled: false,
          icon: <PlayCircle aria-hidden="true" />,
          tone: resolveReturnToSessionTone("player"),
        };
      }

      // FR-session-combat-navigation — joueur : bascule combat ↔ fiche
      if (battleStarted && isInitiativeTrackerPage) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToPlayerCharacter,
          disabled: !currentParticipant?.characterId,
          icon: <UserCircle aria-hidden="true" />,
          tone: "yellow",
          tooltip: !currentParticipant?.characterId ? t("noPlayerCharacter") : undefined,
        };
      }

      if (
        shouldPlayerShowReturnToBattleOnSessionLobby({
          isPlayerParticipant: true,
          sessionStarted: Boolean(sessionStarted),
          pathname: currentPage,
          battleStarted,
        }) ||
        (battleStarted && !isInitiativeTrackerPage)
      ) {
        return {
          label: t("returnToBattle"),
          state: "returnToBattle",
          action: navigateToInitiativeTracker,
          disabled: false,
          icon: <LucideSwords aria-hidden="true" />,
          tone: "red",
        };
      }

      if (
        shouldPlayerShowReturnToSheetOnSessionLobby({
          isPlayerParticipant: true,
          sessionStarted: Boolean(sessionStarted),
          pathname: currentPage,
          battleStarted,
        })
      ) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToPlayerCharacter,
          disabled: !currentParticipant?.characterId,
          icon: <UserCircle aria-hidden="true" />,
          tone: "yellow",
          tooltip: !currentParticipant?.characterId ? t("noPlayerCharacter") : undefined,
        };
      }

      if (sessionStarted && isCharacterPage) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToPlayerCharacter,
          disabled: !currentParticipant?.characterId,
          icon: <UserCircle aria-hidden="true" />,
          tone: "yellow",
        };
      }
    }

    if (isInSession) {
      return {
        label: t("returnToSession"),
        state: "returnToSession",
        action: () => navigateToSession(currentParticipant?.status !== "gameMaster" ? "player" : undefined),
        disabled: false,
        icon: <PlayCircle aria-hidden="true" />,
        tone: resolveReturnToSessionTone(resolveSessionActionRole(currentParticipant?.status, contextMode)),
      };
    }

    return {
      label: t("launchSession"),
      state: "launchSession",
      action: async () => {
        if (!selectedCampaignId) return;
        const { campaignId, code } = await sessionService.createSession(selectedCampaignId);
        dispatch(setCurrentSession({ code, campaignId }));
        dispatch(openSessionLobby());
      },
      disabled: !selectedCampaignId,
      icon: <PlayCircle aria-hidden="true" />,
      tone: "yellow",
      tooltip: t("comingSoon"),
    };
  };

  const button = getButtonState();
  const buttonContent = (
    <Button
      // Red combat action: destructive variant keeps light text readable (black on red was hard to read).
      variant={button.tone === "red" ? "destructive" : "accent"}
      tone={button.tone === "red" ? undefined : button.tone}
      size="lg"
      onClick={button.action}
      disabled={button.disabled}
      aria-current={button.active ? "true" : undefined}
      className={cn("w-full", button.active && activeButtonClassName)}>
      {button.icon}
      <span className="truncate">{button.label}</span>
    </Button>
  );

  if (button.state === "joinSession" && !button.disabled) {
    // Controlled so the dialog code is fetched on first open (FR-web-first-load-performance).
    return (
      <>
        <Button
          variant={button.tone === "red" ? "destructive" : "accent"}
          tone={button.tone === "red" ? undefined : button.tone}
          size="lg"
          onClick={() => {
            button.action();
            setIsJoinSessionDialogOpen(true);
          }}
          onPointerEnter={LazyJoinSessionDialog.preload}
          onFocus={LazyJoinSessionDialog.preload}
          aria-haspopup="dialog"
          aria-expanded={isJoinSessionDialogOpen}
          className="w-full">
          {button.icon}
          <span className="truncate">{button.label}</span>
        </Button>
        <LazyJoinSessionDialog
          open={isJoinSessionDialogOpen}
          onOpenChange={setIsJoinSessionDialogOpen}
        />
      </>
    );
  }

  if (button.state === "initBattle" && !button.disabled) {
    return <InitBattleDialog>{buttonContent}</InitBattleDialog>;
  }

  return button.disabled && button.tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="w-full inline-flex">{buttonContent}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{button.tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    buttonContent
  );
}
