"use client";

/** @see FR-character-sheet-pdf-export */

import * as React from "react";
import { FileDown, Loader2, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NPC, Player } from "@/types/character";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCharacterSheetPdfExport } from "@/hooks/useCharacterSheetPdfExport";
import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";
import { cn } from "@/lib/utils";

interface ExportCharacterSheetPdfDialogProps {
  character: Player | NPC | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCode?: string | null;
  playerName?: string;
}

export function ExportCharacterSheetPdfDialog({
  character,
  open,
  onOpenChange,
  sessionCode,
  playerName,
}: ExportCharacterSheetPdfDialogProps) {
  const t = useTranslations("characterDetail.pdfExport");
  const [theme, setTheme] = React.useState<CharacterSheetPdfTheme>("dark");
  const { exportSheet, isExporting } = useCharacterSheetPdfExport({ sessionCode, playerName });

  React.useEffect(() => {
    if (!open) {
      setTheme("dark");
    }
  }, [open]);

  const handleExport = async () => {
    if (!character || isExporting) return;
    await exportSheet(character, theme);
    onOpenChange(false);
  };

  const displayName = character
    ? [character.firstname, character.lastname]
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-busy={isExporting}
        className="w-[calc(100%-1.5rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {displayName ? t("dialogDescription", { name: displayName }) : t("dialogDescriptionGeneric")}
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-white mb-1">{t("themeLegend")}</legend>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={cn(
                "flex items-center gap-2 rounded-[15px] border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                theme === "dark" ? "border-primary bg-primary/20" : "border-white/15 bg-gray-middle-light hover:bg-gray",
              )}>
              <Moon className="size-5 shrink-0 text-blue" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-white">{t("themeDark")}</span>
                <span className="block text-xs text-white/70">{t("themeDarkHint")}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={cn(
                "flex items-center gap-2 rounded-[15px] border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                theme === "light" ? "border-primary bg-primary/20" : "border-white/15 bg-gray-middle-light hover:bg-gray",
              )}>
              <Sun className="size-5 shrink-0 text-yellow" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-white">{t("themeLight")}</span>
                <span className="block text-xs text-white/70">{t("themeLightHint")}</span>
              </span>
            </button>
          </div>
        </fieldset>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleExport()}
            disabled={!character || isExporting}
            aria-busy={isExporting}
            aria-label={t("exportAria")}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="size-4" aria-hidden="true" />
            )}
            {isExporting ? t("exporting") : t("export")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
