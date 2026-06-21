"use client";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LucideSwords, PlayCircle, Users, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sessionService from "@/services/SessionService";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { setContextMode } from "@/store/slices/environmentSlice";
import {
  selectCurrentSession,
  selectCurrentUserParticipant,
  selectBattleInitialized,
  selectBattleStarted,
  selectIsInSession,
  selectSessionInitBattleDraft,
  selectSessionStatus,
  selectLastConsultedSheetPath,
  openSessionLobby,
  setCurrentSession,
} from "@/store/slices/sessionSlice";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";
import { InitBattleDialog } from "@/components/dialogs/InitBattleDialog";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { useUser } from "@/hooks/useUser";
import { usePlayersWithoutGroup } from "@/hooks/useCharacter";
import {
  shouldGmShowReturnToBattle,
  shouldGmShowReturnToSheet,
  shouldPlayerShowReturnToBattleOnSessionLobby,
  shouldPlayerShowReturnToSheetOnSessionLobby,
} from "@/lib/sessionInAppNavigation";

interface ActionButtonConfig {
  label: string;
  action: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  backgroundColor: string;
  textColor: string;
  state: ActionButtonState;
  tooltip?: string;
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
  const dispatch = useAppDispatch();
  const router = useRouter();
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const currentPage = usePathname() || "/";
  const locale = currentPage.split("/")[1] || "fr";
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const isInSession = useAppSelector(selectIsInSession);
  const session = useAppSelector(selectCurrentSession);
  const sessionStatus = useAppSelector(selectSessionStatus);
  const user = useUser();
  const lastConsultedSheetPath = useAppSelector(selectLastConsultedSheetPath);

  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );

  useSessionValidation();

  const sessionStarted = sessionStatus && sessionStatus === "launched";
  const { characters: charactersWithoutGroup, loading: loadingCharactersWithoutGroup } = usePlayersWithoutGroup();

  const isJoinSessionDisabled = loadingCharactersWithoutGroup || charactersWithoutGroup.length === 0;

  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const initBattleDraft = useAppSelector(selectSessionInitBattleDraft);
  const isInitiativeTrackerPage = currentPage.endsWith("/initiativeTracker");
  const isCharacterPage = currentPage.includes("/characters/") && !currentPage.includes("/characters/new");

  const navigateToSession = (nextContextMode?: "player" | "gm") => {
    if (nextContextMode) {
      dispatch(setContextMode(nextContextMode));
    }
    dispatch(openSessionLobby());
  };

  const navigateToInitiativeTracker = () => {
    router.push(`/${locale}/initiativeTracker`);
  };

  const navigateToPlayerCharacter = () => {
    const characterId = currentParticipant?.characterId;
    if (characterId) {
      const query = session?.code ? `?sessionCode=${encodeURIComponent(session.code)}` : "";
      router.push(`/${locale}/characters/${encodeURIComponent(characterId)}${query}`);
    }
  };

  const navigateToLastConsultedSheet = () => {
    if (lastConsultedSheetPath) {
      router.push(lastConsultedSheetPath);
    }
  };

  const getButtonState = (): ActionButtonConfig => {
    if (!isInSession) {
      if (contextMode === "gm") {
        return {
          label: t("launchSession"),
          state: "launchSession",
          action: async () => {
            if (!selectedCampaignId) return;
            const { code } = await sessionService.createSession(selectedCampaignId);
            dispatch(setCurrentSession({ code, campaignId: selectedCampaignId }));
            dispatch(openSessionLobby());
          },
          disabled: !selectedCampaignId,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
          tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
        };
      }

      return {
        label: t("joinSession"),
        state: "joinSession",
        action: () => {
          if (isInSession) {
            dispatch(openSessionLobby());
          }
        },
        icon: <Users className="size-6" />,
        disabled: isJoinSessionDisabled,
        backgroundColor: "bg-green",
        textColor: "text-black",
        tooltip: isJoinSessionDisabled ? tWelcome("session.noCharacterWithoutGroup") : undefined,
      };
    }

    if (currentParticipant === null) {
      return {
        label: t("returnToSession"),
        state: "returnToSession",
        action: () => navigateToSession(contextMode === "player" ? "player" : undefined),
        disabled: false,
        icon: <PlayCircle className="size-6" />,
        backgroundColor: "bg-yellow",
        textColor: "text-black",
      };
    }

    if (currentParticipant?.status === "gameMaster") {
      if (!sessionStarted) {
        return {
          label: t("returnToSession"),
          state: "returnToSession",
          action: () => navigateToSession(),
          disabled: false,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }

      if (sessionStarted && !battleInitialized) {
        return {
          label: t("initBattle"),
          state: "initBattle",
          action: () => {},
          disabled: false,
          icon: <LucideSwords className="size-6" />,
          backgroundColor: "bg-red",
          textColor: "text-white",
        };
      }

      // FR-021 — combat initialisé ou démarré : retour fiche sur le tracker, retour combat ailleurs
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
          icon: <UserCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
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
          icon: <LucideSwords className="size-6" />,
          backgroundColor: "bg-red",
          textColor: "text-white",
        };
      }
    } else {
      if (!sessionStarted) {
        return {
          label: t("returnToSession"),
          state: "returnToSession",
          action: () => navigateToSession("player"),
          disabled: false,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }

      // FR-021 — joueur : bascule combat ↔ fiche
      if (battleStarted && isInitiativeTrackerPage) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToPlayerCharacter,
          disabled: !currentParticipant?.characterId,
          icon: <UserCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
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
          icon: <LucideSwords className="size-6" />,
          backgroundColor: "bg-red",
          textColor: "text-white",
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
          icon: <UserCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
          tooltip: !currentParticipant?.characterId ? t("noPlayerCharacter") : undefined,
        };
      }

      if (sessionStarted && isCharacterPage) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: navigateToPlayerCharacter,
          disabled: !currentParticipant?.characterId,
          icon: <UserCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }
    }

    if (isInSession) {
      return {
        label: t("returnToSession"),
        state: "returnToSession",
        action: () => navigateToSession(currentParticipant?.status !== "gameMaster" ? "player" : undefined),
        disabled: false,
        icon: <PlayCircle className="size-6" />,
        backgroundColor: "bg-yellow",
        textColor: "text-black",
      };
    }

    return {
      label: t("launchSession"),
      state: "launchSession",
      action: () => {
        if (!selectedCampaignId) return;
        sessionService.createSession(selectedCampaignId);
      },
      disabled: !selectedCampaignId,
      icon: <PlayCircle className="size-6" />,
      backgroundColor: "bg-yellow",
      textColor: "text-black",
      tooltip: t("comingSoon"),
    };
  };

  const hoverMap: Record<string, string> = {
    "bg-yellow": "hover:bg-[#e6b000]",
    "bg-green": "hover:bg-[#7dc400]",
    "bg-red": "hover:bg-[#e02020]",
    "bg-pink": "hover:bg-[#e090e0]",
    "bg-gray-600": "hover:bg-gray-700",
  };

  const button = getButtonState();
  const hoverClass = hoverMap[button.backgroundColor] ?? "hover:brightness-90";
  const buttonContent = (
    <Button
      onClick={button.action}
      disabled={button.disabled}
      className={`w-full py-5 transition-colors duration-150 ${button.backgroundColor} ${hoverClass} ${button.textColor} rounded-2xl flex items-center justify-center gap-3 ${button.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      {button.icon}
      <span className="text-lg truncate">{button.label}</span>
    </Button>
  );

  if (button.state === "joinSession" && !button.disabled) {
    return <JoinSessionDialog>{buttonContent}</JoinSessionDialog>;
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
