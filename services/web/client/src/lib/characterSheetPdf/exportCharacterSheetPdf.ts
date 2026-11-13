/** @see FR-character-sheet-pdf-export */

import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { buildCharacterSheetPdfFilename } from "@/lib/characterSheetPdf/buildFilename";
import type { CharacterSheetPdfData, CharacterSheetPdfLabels } from "@/lib/characterSheetPdf/types";
import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";

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

  // `pdf()` is typed for a bare `<Document>` element; our component renders one.
  const doc = React.createElement(CharacterSheetPdfDocument, { data, labels, theme }) as unknown as React.ReactElement<DocumentProps>;
  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildCharacterSheetPdfFilename(firstname, lastname);
  link.click();
  URL.revokeObjectURL(url);
}
