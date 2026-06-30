/** @see FR-character-sheet-pdf-export */

export type CharacterSheetPdfTheme = "dark" | "light";

export interface CharacterSheetPdfThemeTokens {
  pageBackground: string;
  cardBackground: string;
  text: string;
  textMuted: string;
  border: string;
  footerText: string;
  blue: string;
  red: string;
  pink: string;
  yellow: string;
  green: string;
  purple: string;
  sectionHeaderText: string;
}

export const CHARACTER_SHEET_PDF_THEMES: Record<CharacterSheetPdfTheme, CharacterSheetPdfThemeTokens> = {
  dark: {
    pageBackground: "#0c0c0c",
    cardBackground: "#19191c",
    text: "#f7f7f7",
    textMuted: "#b2b2b2",
    border: "#2b2b2b",
    footerText: "#d6d6d6",
    blue: "#61ebff",
    red: "#ff2d2d",
    pink: "#ffadff",
    yellow: "#ffc400",
    green: "#9ae201",
    purple: "#4e00de",
    sectionHeaderText: "#0c0c0c",
  },
  light: {
    pageBackground: "#ffffff",
    cardBackground: "#f5f5f7",
    text: "#1a1a1a",
    textMuted: "#4a4a4a",
    border: "#d6d6d6",
    footerText: "#4a4a4a",
    blue: "#0099b8",
    red: "#c41e1e",
    pink: "#a832a8",
    yellow: "#b8860b",
    green: "#5a8f00",
    purple: "#4e00de",
    sectionHeaderText: "#ffffff",
  },
};
