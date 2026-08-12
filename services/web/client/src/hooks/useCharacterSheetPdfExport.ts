"use client";

/** @see FR-character-sheet-pdf-export */

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { NPC, Player } from "@/types/character";
import { buildCharacterSheetPdfLabels } from "@/lib/characterSheetPdf/buildCharacterSheetPdfLabels";
import { buildCharacterQrCodeDataUrl } from "@/lib/characterSheetPdf/buildCharacterQrCodeDataUrl";
import { buildCharacterSheetPageUrl } from "@/lib/characterSheetPdf/buildCharacterSheetPageUrl";
import { fetchCharacterAvatarForPdf } from "@/lib/characterSheetPdf/fetchAvatarForPdf";
import { enrichSkillsWithRasterIcons } from "@/lib/characterSheetPdf/enrichSkillsWithRasterIcons";
import { mapCharacterToPdfData } from "@/lib/characterSheetPdf/mapCharacterToPdfData";
import { exportCharacterSheetPdf } from "@/lib/characterSheetPdf/exportCharacterSheetPdf";
import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import { useToast } from "@/hooks/useToast";
import { isPlayer } from "@/utils/global.utils";

export interface UseCharacterSheetPdfExportOptions {
  sessionCode?: string | null;
  playerName?: string;
}

export function useCharacterSheetPdfExport(options: UseCharacterSheetPdfExportOptions = {}) {
  const { sessionCode, playerName = "" } = options;
  const locale = useLocale();
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
  const tMagic = useTranslations("characterDetail.magic");

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
        tMagic: (key, values) => (values !== undefined ? tMagic(key, values) : tMagic(key)),
      }),
    [tPdf, tGeneral, tBattle, tEdit, tNpc, tClass, tAlignment, tMagic],
  );

  const formatClassLevel = useCallback(
    (className: string, level: number) => tDetail("classLevelShort", { className, level }),
    [tDetail],
  );

  const exportSheet = useCallback(
    async (character: Player | NPC, theme: CharacterSheetPdfTheme) => {
      if (isExporting) return;
      if (!isPlayer(character)) {
        toast.info(tPdf("npcComingSoon"));
        return;
      }
      setIsExporting(true);
      try {
        const characterPageUrl = buildCharacterSheetPageUrl(
          typeof window !== "undefined" ? window.location.origin : "",
          locale,
          character._id,
        );

        const [avatarDataUrl, qrCodeDataUrl] = await Promise.all([
          fetchCharacterAvatarForPdf(character._id, character.avatar, sessionCode),
          buildCharacterQrCodeDataUrl(characterPageUrl),
        ]);

        const mappedData = mapCharacterToPdfData(character, {
          labels,
          playerName,
          translateClass: (name) => tClass(name),
          formatClassLevel,
          translateAlignment: (alignment) => tAlignment(alignment),
          avatarDataUrl,
          qrCodeDataUrl,
          characterPageUrl,
        });

        const data = await enrichSkillsWithRasterIcons(
          mappedData,
          CHARACTER_SHEET_PDF_THEMES[theme].textMuted,
        );

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
    [formatClassLevel, isExporting, labels, locale, playerName, sessionCode, tAlignment, tClass, tPdf, toast],
  );

  return { exportSheet, isExporting, labels };
}
