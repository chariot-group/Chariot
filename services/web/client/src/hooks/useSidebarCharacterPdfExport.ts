"use client";

/** @see FR-character-sheet-pdf-export */

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { NPC, Player } from "@/types/character";
import CharacterService from "@/services/CharacterService";
import { useToast } from "@/hooks/useToast";

export function useSidebarCharacterPdfExport() {
  const toast = useToast();
  const t = useTranslations("characterDetail.pdfExport");
  const [characterToExport, setCharacterToExport] = useState<Player | NPC | null>(null);
  const [isFetchingExport, setIsFetchingExport] = useState(false);

  const requestCharacterPdfExport = useCallback(
    async (characterId: string) => {
      if (isFetchingExport) return;
      setIsFetchingExport(true);
      try {
        const full = await CharacterService.getCharacterById(characterId);
        setCharacterToExport(full as Player | NPC);
      } catch {
        toast.error(t("error"));
      } finally {
        setIsFetchingExport(false);
      }
    },
    [isFetchingExport, t, toast],
  );

  const closeExportDialog = useCallback((open: boolean) => {
    if (!open) {
      setCharacterToExport(null);
    }
  }, []);

  return {
    characterToExport,
    requestCharacterPdfExport,
    closeExportDialog,
    isFetchingExport,
  };
}
