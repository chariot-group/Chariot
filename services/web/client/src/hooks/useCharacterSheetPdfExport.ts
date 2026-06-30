"use client";

/** @see FR-character-sheet-pdf-export */

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { NPC, Player } from "@/types/character";
import { buildCharacterSheetPdfLabels } from "@/lib/characterSheetPdf/buildCharacterSheetPdfLabels";
import { fetchCharacterAvatarForPdf } from "@/lib/characterSheetPdf/fetchAvatarForPdf";
import { mapCharacterToPdfData } from "@/lib/characterSheetPdf/mapCharacterToPdfData";
import { exportCharacterSheetPdf } from "@/lib/characterSheetPdf/exportCharacterSheetPdf";
import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";
import { useToast } from "@/hooks/useToast";

export interface UseCharacterSheetPdfExportOptions {
  sessionCode?: string | null;
  playerName?: string;
}

export function useCharacterSheetPdfExport(options: UseCharacterSheetPdfExportOptions = {}) {
  const { sessionCode, playerName = "" } = options;
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const tPdf = useTranslations("characterDetail.pdfExport");
  const tGeneral = useTranslations("characterDetail.player.general");
  const tBattle = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tNpc = useTranslations("characterDetail.npc");
  const tClass = useTranslations("classes");
  const tAlignment = useTranslations("alignments");
  const tDetail = useTranslations("characterDetail");

  const labels = useMemo(
    () =>
      buildCharacterSheetPdfLabels({
        tPdf: (key, values) => (values !== undefined ? tPdf(key, values) : tPdf(key)),
        tGeneral: (key) => tGeneral(key),
        tBattle: (key) => tBattle(key),
        tEdit: (key) => tEdit(key),
        tNpc: (key) => tNpc(key),
        tClass: (key) => tClass(key),
        tAlignment: (key) => tAlignment(key),
        tCommon: (key) => (key === "yes" ? tPdf("yes") : tPdf("no")),
      }),
    [tPdf, tGeneral, tBattle, tEdit, tNpc, tClass, tAlignment],
  );

  const formatClassLevel = useCallback(
    (className: string, level: number) => tDetail("classLevelShort", { className, level }),
    [tDetail],
  );

  const exportSheet = useCallback(
    async (character: Player | NPC, theme: CharacterSheetPdfTheme) => {
      if (isExporting) return;
      setIsExporting(true);
      try {
        const avatarDataUrl = await fetchCharacterAvatarForPdf(
          character._id,
          character.avatar,
          sessionCode,
        );

        const data = mapCharacterToPdfData(character, {
          labels,
          playerName,
          translateClass: (name) => tClass(name),
          formatClassLevel,
          translateAlignment: (alignment) => tAlignment(alignment),
          avatarDataUrl,
        });

        await exportCharacterSheetPdf({
          data,
          labels,
          theme,
          firstname: character.firstname ?? "",
          lastname: character.lastname ?? "",
        });

        toast.success(tPdf("success"));
      } catch {
        toast.error(tPdf("error"));
      } finally {
        setIsExporting(false);
      }
    },
    [formatClassLevel, isExporting, labels, playerName, sessionCode, tAlignment, tClass, tPdf, toast],
  );

  return { exportSheet, isExporting, labels };
}
