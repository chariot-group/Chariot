"use client";

import { ConfirmCancelSessionDialog } from "@/components/dialogs/ConfirmCancelSessionDialog";
import { ConfirmLeaveSessionDialog } from "@/components/dialogs/ConfirmLeaveSessionDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronUp, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Menu item mirrors the solid destructive button so both exit actions read the same. */
const SESSION_EXIT_MENU_ITEM_CLASS =
  "h-8 bg-destructive px-3 font-medium text-white! dark:bg-destructive/60 data-highlighted:bg-destructive/80! data-highlighted:text-white! focus:bg-destructive/80! focus:text-white! *:[svg]:text-white!";

export type SessionExitLayout = "leave" | "closeWithLeaveMenu";

/** GM with close available gets a split button: « Clôturer » + menu « Quitter » (FR-session-lobby-modal). */
export function getSessionExitLayout(isMJ: boolean, canClose: boolean): SessionExitLayout {
  return isMJ && canClose ? "closeWithLeaveMenu" : "leave";
}

interface SessionExitActionsProps {
  isMJ: boolean;
  isLeaving: boolean;
  onLeave: () => void;
  /** Provided when the GM can close the session from this surface. */
  onCloseSession?: () => void;
  buttonClassName?: string;
}

export function SessionExitActions({ isMJ, isLeaving, onLeave, onCloseSession, buttonClassName }: SessionExitActionsProps) {
  const t = useTranslations("sessionPage");
  const [leaveOpen, setLeaveOpen] = useState<boolean>(false);

  if (getSessionExitLayout(isMJ, Boolean(onCloseSession)) === "leave") {
    return (
      <ConfirmLeaveSessionDialog
        isMJ={isMJ}
        isLeaving={isLeaving}
        onConfirm={onLeave}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className={buttonClassName}
          disabled={isLeaving}>
          {t("players.leaveButton")}
        </Button>
      </ConfirmLeaveSessionDialog>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("sessionExit.groupAria")}
      className="inline-flex">
      <ConfirmCancelSessionDialog onConfirm={onCloseSession!}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className={cn("rounded-r-none", buttonClassName)}>
          {t("sessionCancel.confirm")}
        </Button>
      </ConfirmCancelSessionDialog>
      {/* Non-modal: an outside click must only close the menu, not the lobby dialog behind it. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            aria-label={t("sessionExit.moreAria")}
            className={cn(
              "rounded-l-none border-l border-white/30 [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform",
              buttonClassName,
              "px-2 sm:px-2",
            )}
            disabled={isLeaving}>
            <ChevronUp aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="z-[60] min-w-0 rounded-[15px] border-0 bg-transparent p-0 shadow-md">
          <DropdownMenuItem
            className={SESSION_EXIT_MENU_ITEM_CLASS}
            onSelect={() => setLeaveOpen(true)}>
            <LogOut aria-hidden="true" />
            {t("players.leaveButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmLeaveSessionDialog
        isMJ={isMJ}
        isLeaving={isLeaving}
        onConfirm={onLeave}
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
      />
    </div>
  );
}
