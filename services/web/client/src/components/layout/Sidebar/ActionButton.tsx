"use client";

import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import {
  ActionButtonState,
  selectBattleInitialized,
  selectBattleStarted,
  selectSessionStarted,
} from "@/store/slices/actionButtonSlice";
import { LucideSwords, PlayCircle, Users, RotateCcw, ArrowLeft, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import sessionService from "@/services/SessionService";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { selectIsInSession } from "@/store/slices/sessionSlice";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";

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

export function ActionButton() {
  const t = useTranslations("sidebar");
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const sessionStarted = useAppSelector(selectSessionStarted);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const currentPage = usePathname() || "/";
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const isInSession = useAppSelector(selectIsInSession);

  /**
   * Determine button state based on context and workflow state
   * GM workflow: launchSession → initBattle → startBattle → (reset | returnToBattle)
   * Player workflow: joinSession → returnToSheet
   */
  const getButtonState = (): ActionButtonConfig => {
    if (contextMode === "gm") {
      // GM: Launch session (initial state)
      if (!sessionStarted) {
        return {
          label: t("launchSession"),
          state: "launchSession",
          action: () => {
            if (!selectedCampaignId) return;
            sessionService.createSession(selectedCampaignId);
          },
          disabled: !selectedCampaignId || isInSession,
          icon: <PlayCircle className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
          tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
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

      // GM: Start battle (battle initialized but not started)
      if (battleInitialized && !battleStarted) {
        return {
          label: t("startBattle"),
          state: "startBattle",
          action: () => {},
          disabled: false,
          icon: <LucideSwords className="size-6" />,
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
          disabled: false,
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
          disabled: false,
          icon: <ArrowLeft className="size-6" />,
          backgroundColor: "bg-yellow",
          textColor: "text-black",
        };
      }
    } else {
      // Player: Join session (initial state)
      if (!sessionStarted) {
        return {
          label: t("joinSession"),
          state: "joinSession",
          action: () => {},
          disabled: isInSession,
          icon: <Users className="size-6" />,
          backgroundColor: "bg-green",
          textColor: "text-black",
          tooltip: isInSession ? t("alreadyInSession") : t("comingSoon"),
        };
      }

      // Player: Return to character sheet (session started)
      if (sessionStarted) {
        return {
          label: t("returnToSheet"),
          state: "returnToSheet",
          action: () => {},
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
      action: () => {},
      disabled: false,
      icon: <PlayCircle className="size-6" />,
      backgroundColor: "bg-yellow",
      textColor: "text-black",
    };
  };

  const button = getButtonState();
  const buttonContent = (
    <Button
      onClick={button.action}
      disabled={button.disabled}
      className={`w-full py-5 hover:font-bold transition-all duration-100 ${button.backgroundColor} ${button.textColor} rounded-2xl flex items-center gap-3 ${button.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      {button.icon}
      <span className="text-lg">{button.label}</span>
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
