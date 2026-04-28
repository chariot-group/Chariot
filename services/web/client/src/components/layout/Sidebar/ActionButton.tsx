"use client";

import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { LucideSwords, PlayCircle, Users, RotateCcw, ArrowLeft, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sessionService, { SessionParticipant } from "@/services/SessionService";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import {
  selectCurrentSession,
  selectCurrentUserParticipant,
  selectIsInSession,
  selectSessionStatus,
} from "@/store/slices/sessionSlice";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { useUser } from "@/hooks/useUser";

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
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const currentPage = usePathname() || "/";
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

  // TODO
  const battleInitialized: boolean = false;
  const battleStarted: boolean = false;

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
          disabled: false,
          backgroundColor: "bg-green",
          textColor: "text-black",
        };
      }
    }

    if (currentParticipant?.status === "gameMaster") {
      if (!sessionStarted) {
        return {
          label: "Retourner à la session",
          state: "returnToSession",
          action: () => {
            window.location.href = `/campaigns/${session?.campaignId}/session/${session?.code}`;
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
          disabled: true,
          icon: <LucideSwords className="size-6" />,
          tooltip: t("comingSoon"),
          backgroundColor: "bg-red",
          textColor: "text-white",
        };
      }

      // GM: Start battle (battle initialized but not started)
      if (battleInitialized && !battleStarted) {
        return {
          label: t("startBattle"),
          state: "startBattle",
          action: () => {},
          disabled: true,
          icon: <LucideSwords className="size-6" />,
          tooltip: t("comingSoon"),
          backgroundColor: "bg-pink",
          textColor: "text-black",
        };
      }

      // GM: Reset (battle started + on initiativeTracker page)
      if (battleStarted && currentPage === "/initiativeTracker") {
        return {
          label: t("reset"),
          state: "reset",
          action: () => {},
          disabled: true,
          tooltip: t("comingSoon"),
          icon: <RotateCcw className="size-6" />,
          backgroundColor: "bg-gray-600",
          textColor: "text-white",
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
          label: "Retourner à la session",
          state: "returnToSession",
          action: () => {
            window.location.href = `/campaigns/${session?.campaignId}/session/${session?.code}`;
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

  const button = getButtonState();
  const buttonContent = (
    <Button
      onClick={button.action}
      disabled={button.disabled}
      className={`w-full py-5 hover:font-bold transition-all duration-100 ${button.backgroundColor} ${button.textColor} rounded-2xl flex items-center justify-center gap-3 ${button.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      {button.icon}
      <span className="text-lg truncate">{button.label}</span>
    </Button>
  );

  if (button.state === "joinSession" && !button.disabled) {
    return <JoinSessionDialog>{buttonContent}</JoinSessionDialog>;
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
