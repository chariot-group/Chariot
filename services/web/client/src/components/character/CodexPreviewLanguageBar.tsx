"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { codexLocaleFlagEmoji } from "@/utils/codexLocale.utils";
import { Undo2 } from "lucide-react";

export interface CodexPreviewLanguageBarProps {
  availableLangs: string[];
  currentLang: string;
  onSelectLang: (lang: string) => void | Promise<void>;
  /** Désactive les boutons de langue (ex. chargement d’une variante). */
  disabled?: boolean;
  onUndo?: () => void;
  canUndo: boolean;
  label: string;
  undoLabel: string;
  /** Libellé court sur le bouton retour (visible sur écrans ≥ sm) */
  undoButtonLabel?: string;
  getLanguageAriaLabel: (lang: string) => string;
}

export default function CodexPreviewLanguageBar({
  availableLangs,
  currentLang,
  onSelectLang,
  disabled = false,
  onUndo,
  canUndo,
  label,
  undoLabel,
  undoButtonLabel,
  getLanguageAriaLabel,
}: CodexPreviewLanguageBarProps) {
  if (availableLangs.length < 2) {
    return null;
  }

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-x-2 gap-y-2 my-3 pb-3 border-b border-border">
      <span className="text-xs font-medium text-muted-foreground w-full sm:w-auto sm:shrink-0">{label}</span>
      <div
        className={cn(
          "flex flex-wrap gap-1.5 flex-1 min-w-0",
          disabled && "opacity-60 pointer-events-none",
        )}>
        {availableLangs.map((lang) => {
          const active = lang === currentLang;
          const flag = codexLocaleFlagEmoji(lang);
          return (
            <Tooltip key={lang}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "primary" : "secondary"}
                  className="px-2.5 text-xs"
                  disabled={disabled}
                  onClick={() => {
                    if (!active && !disabled) void onSelectLang(lang);
                  }}
                  aria-current={active ? "true" : undefined}
                  aria-label={getLanguageAriaLabel(lang)}>
                  {flag ? <span className="text-[1.05rem] leading-none select-none">{flag}</span> : null}
                  <span className="uppercase tabular-nums">{lang}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getLanguageAriaLabel(lang)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      {canUndo && onUndo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 px-2 sm:px-2.5"
              disabled={disabled}
              onClick={onUndo}
              aria-label={undoLabel}>
              <Undo2 className="size-4 shrink-0" />
              {undoButtonLabel ? (
                <span className="hidden sm:inline text-xs font-medium max-w-[7rem] truncate">{undoButtonLabel}</span>
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{undoLabel}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
