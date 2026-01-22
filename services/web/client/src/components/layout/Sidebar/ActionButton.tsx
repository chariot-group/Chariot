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

interface ActionButtonConfig {
  label: string;
  action: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  backgroundColor: string;
  textColor: string;
  state: ActionButtonState;
}

/**
 * Context-aware action button
 * Displays different actions based on:
 * - User context (GM vs Player)
 * - Session state (not started, started, battle initialized, battle started)
 * - Current page (initiativeTracker, character sheet, etc.)
 */
export function ActionButton() {
  const t = useTranslations("sidebar");
  const contextMode = useAppSelector((state) => state.environment.contextMode);
  const sessionStarted = useAppSelector(selectSessionStarted);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const currentPage = usePathname() || "/";

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
          action: () => {},
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
          disabled: false,
          icon: <Users className="size-6" />,
          backgroundColor: "bg-green",
          textColor: "text-black",
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

  return (
    <Button
      onClick={button.action}
      disabled={button.disabled}
      className={`w-full py-5 hover:font-bold transition-all duration-100 ${button.backgroundColor} ${button.textColor} cursor-pointer rounded-[12px] flex items-center gap-3`}>
      {button.icon}
      <span className="text-lg">{button.label}</span>
    </Button>
  );
}
