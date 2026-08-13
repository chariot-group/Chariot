/** @see FR-character-sheet-pdf-export */

import React from "react";
import { buildCharacterSheetPdfFilename } from "@/lib/characterSheetPdf/buildFilename";
import type { CharacterSheetPdfData, CharacterSheetPdfLabels, CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/types";

export interface ExportCharacterSheetPdfParams {
  data: CharacterSheetPdfData;
  labels: CharacterSheetPdfLabels;
  theme: CharacterSheetPdfTheme;
  firstname: string;
  lastname: string;
}

export async function exportCharacterSheetPdf({
  data,
  labels,
  theme,
  firstname,
  lastname,
}: ExportCharacterSheetPdfParams): Promise<void> {
  const [{ pdf }, { CharacterSheetPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/characterSheetPdf/CharacterSheetPdfDocument"),
  ]);

  const blob = await pdf(
    React.createElement(CharacterSheetPdfDocument, { data, labels, theme }),
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildCharacterSheetPdfFilename(firstname, lastname);
  link.click();
  URL.revokeObjectURL(url);
}
