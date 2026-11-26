/** @see FR-character-sheet-pdf-export */

export type CharacterSheetPdfTheme = "dark" | "light";

export interface CharacterSheetPdfThemeTokens {
  /** Page surface (`--background`). */
  pageBackground: string;
  /** Card surface (`--card`). */
  cardBackground: string;
  /** Pills and tinted bars inside a card (`--gray-middle-light`). */
  raisedBackground: string;
  /** Main text (`--card-foreground`). */
  text: string;
  /** Secondary text (`--muted-foreground`). */
  textMuted: string;
  /** Minor separators only: cards have no border (`--border`). */
  border: string;
  footerText: string;
  /** Violet used as text (`--primary-light` on dark surfaces). */
  link: string;
  blue: string;
  red: string;
  pink: string;
  yellow: string;
  green: string;
  /** Text drawn on an accent fill (prepared badge, filled checkbox). */
  onAccentText: string;
}

/**
 * Dark mirrors the app tokens (`globals.css`). Light keeps the same cool-tinted neutral scale and
 * uses darker shades of the domain hues so they read as text (>= 4.5:1 on the card surface).
 */
export const CHARACTER_SHEET_PDF_THEMES: Record<CharacterSheetPdfTheme, CharacterSheetPdfThemeTokens> = {
  dark: {
    pageBackground: "#0c0c0f",
    cardBackground: "#17171a",
    raisedBackground: "#1f1f22",
    text: "#f7f7f7",
    textMuted: "#98989c",
    border: "#353538",
    footerText: "#d7d7db",
    link: "#a98bff",
    blue: "#61ebff",
    red: "#ff2d2d",
    pink: "#ffadff",
    yellow: "#ffc400",
    green: "#9ae201",
    onAccentText: "#0c0c0f",
  },
  light: {
    pageBackground: "#ffffff",
    cardBackground: "#f4f4f6",
    raisedBackground: "#e9e9ec",
    text: "#1a1a1d",
    textMuted: "#56565c",
    border: "#d7d7db",
    footerText: "#56565c",
    link: "#4e00de",
    blue: "#00758c",
    red: "#b81c1c",
    pink: "#9a2a9a",
    yellow: "#8a6100",
    green: "#456e00",
    onAccentText: "#ffffff",
  },
};
