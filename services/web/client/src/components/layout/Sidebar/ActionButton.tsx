"use client";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LucideSwords, PlayCircle, Users, RotateCcw, ArrowLeft, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sessionService, { SessionParticipant } from "@/services/SessionService";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { setContextMode } from "@/store/slices/environmentSlice";
import {
  selectCurrentSession,
  selectCurrentUserParticipant,
  selectBattleInitialized,
  selectBattleStarted,
  selectIsInSession,
  selectSessionStatus,
  resetInitiativeTracker,
} from "@/store/slices/sessionSlice";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";
import { InitBattleDialog } from "@/components/dialogs/InitBattleDialog";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { useUser } from "@/hooks/useUser";
import { usePlayersWithoutGroup } from "@/hooks/useCharacter";

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
  | "reset"
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

  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );

  useSessionValidation();

  const sessionStarted = sessionStatus && sessionStatus === "launched";
  const { characters: charactersWithoutGroup, loading: loadingCharactersWithoutGroup } = usePlayersWithoutGroup();

  const isJoinSessionDisabled = loadingCharactersWithoutGroup || charactersWithoutGroup.length === 0;

  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const isInitiativeTrackerPage = currentPage.endsWith("/initiativeTracker");

  const navigateToSession = (nextContextMode?: "player" | "gm") => {
    if (nextContextMode) {
      dispatch(setContextMode(nextContextMode));
    }
    router.push(`/campaigns/${session?.campaignId}/session/${session?.code}`);
  };

  /**
   * Determine button state based on context and workflow state
   * GM workflow: launchSession → initBattle → startBattle → (reset | returnToBattle)
   * Player workflow: joinSession → returnToSheet
   */
  const getButtonState = (): ActionButtonConfig => {
    if (currentParticipant === null || isInSession === null || session === null) {
      if (contextMode === "gm") {
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
          tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
        };
      } else {
        return {
          label: t("joinSession"),
          state: "joinSession",
          action: () => {
            if (isInSession) {
              window.location.href = `/campaigns/${session?.campaignId}/session/${session?.code}`;
            }
          },
          icon: <Users className="size-6" />,
          disabled: isJoinSessionDisabled,
          backgroundColor: "bg-green",
          textColor: "text-black",
          tooltip: isJoinSessionDisabled ? tWelcome("session.noCharacterWithoutGroup") : undefined,
        };
      }
    }

    if (currentParticipant?.status === "gameMaster") {
      if (!sessionStarted) {
        return {
          label: t("returnToSession"),
          state: "returnToSession",
          action: () => {
            navigateToSession();
          },
          disabled: false,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }

      // GM: Initialize battle (session started, battle not initialized)
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

      // GM: Reset (battle initialized/started + on initiativeTracker page)
      if ((battleStarted || battleInitialized) && isInitiativeTrackerPage) {
        return {
          label: t("reset"),
          state: "reset",
          action: () => {
            dispatch(resetInitiativeTracker());
          },
          disabled: false,
          icon: <RotateCcw className="size-6" />,
          backgroundColor: "bg-gray-600",
          textColor: "text-white",
        };
      }

      // GM: Return to battle (battle initialized but not started)
      if (battleInitialized && !battleStarted) {
        return {
          label: t("returnToBattle"),
          state: "returnToBattle",
          action: () => {
            router.push(`/${locale}/initiativeTracker`);
          },
          disabled: false,
          icon: <LucideSwords className="size-6" />,
          backgroundColor: "bg-pink",
          textColor: "text-black",
        };
      }

      // GM: Return to battle (battle started + on character page)
      if (battleStarted && currentPage.includes("/characters/")) {
        return {
          label: t("returnToBattle"),
          state: "returnToBattle",
          action: () => {},
          disabled: true,
          tooltip: t("comingSoon"),
          icon: <ArrowLeft className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }
    } else {
      // Player: Join session (initial state)
      if (!sessionStarted) {
        return {
          label: t("returnToSession"),
          state: "returnToSession",
          action: () => {
            navigateToSession("player");
          },
          disabled: false,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }

      // Player: Return to character sheet (session started)
      if (sessionStarted) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: () => {
            const currentParticipant = session?.participants.find(
              (p: SessionParticipant) => p.userId === user.user?.keycloakId,
            );
            const characterId = currentParticipant?.characterId;
            if (isInSession && characterId) {
              window.location.href = `/characters/${characterId}`;
            }
          },
          disabled: false,
          icon: <UserCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }
    }

    // Default fallback state
    return {
      label: t("launchSession"),
      state: "launchSession",
      action: () => {
        if (isInSession) {
          window.location.href = `/campaigns/${session?.campaignId}/session/${session?.code}`;
          return;
        }
        if (!selectedCampaignId) return;
        sessionService.createSession(selectedCampaignId);
      },
      disabled: !selectedCampaignId,
      icon: <PlayCircle className="size-6" />,
      backgroundColor: "bg-yellow",
      textColor: "text-black",
      tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
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
