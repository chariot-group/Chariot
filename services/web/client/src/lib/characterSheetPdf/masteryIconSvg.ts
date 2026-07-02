/** @see FR-character-sheet-pdf-export — same SVG assets as `getIconForValue` in global.utils */

import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";

const NO_MASTERY_DARK =
  '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.99892 0C4.48541 0 0 4.48541 0 10.0011C0 15.5168 4.48541 20 9.99892 20C15.5124 20 20 15.5146 20 10.0011C20 4.48758 15.5124 0 9.99892 0ZM9.99892 18.4817C5.32263 18.4817 1.51827 14.6774 1.51827 10.0011C1.51827 5.3248 5.32263 1.51827 9.99892 1.51827C14.6752 1.51827 18.4817 5.32263 18.4817 10.0011C18.4817 14.6795 14.6752 18.4817 9.99892 18.4817Z" fill="FILL_COLOR"/></svg>';

const HALF_MASTERY =
  '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0011 0C4.48758 0 0 4.48541 0 10.0011C0 15.5168 4.48758 20 10.0011 20C15.5146 20 20 15.5146 20 10.0011C20 4.48758 15.5146 0 10.0011 0ZM10.0011 18.4817V1.51827C14.6774 1.51827 18.4817 5.32263 18.4817 10.0011C18.4817 14.6795 14.6774 18.4817 10.0011 18.4817Z" fill="FILL_COLOR"/></svg>';

const FULL_CIRCLE =
  '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.4871 0 0 4.48493 0 10C0 15.5151 4.48493 20 10 20C15.5151 20 20 15.5151 20 10C20 4.48493 15.5129 0 10 0Z" fill="FILL_COLOR"/></svg>';

const EXPERT =
  '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.001 0C4.48514 0 0 4.48527 0 10.0013C0 15.5174 4.48514 20.0006 10.001 20.0006C15.5169 20.0006 20 15.5153 20 10.0013C20 4.48732 15.5128 0 10.001 0ZM10.001 18.8217C5.13528 18.8217 1.17889 14.8652 1.17889 10.0013C1.17889 5.13748 5.13528 1.17893 10.001 1.17893C14.8668 1.17893 18.8211 5.13748 18.8211 10.0013C18.8211 14.8652 14.8647 18.8217 10.001 18.8217Z" fill="FILL_COLOR"/><path d="M16.5 10.0008C16.5 13.5833 13.585 16.5 10.0008 16.5C6.41668 16.5 3.5 13.585 3.5 10.0008C3.5 6.41668 6.41499 3.5 10.0008 3.5C13.5867 3.5 16.5 6.41499 16.5 10.0008Z" fill="FILL_COLOR"/></svg>';

function withFill(template: string, fill: string): string {
  return template.replaceAll("FILL_COLOR", fill);
}

export function getMasteryIconSvg(
  level: number,
  accentColor: "blue" | "red",
  theme: CharacterSheetPdfTheme,
  colors: { blue: string; red: string; textMuted: string },
): string {
  const proficientFill = accentColor === "red" ? colors.red : colors.blue;
  const emptyFill = theme === "dark" ? "#ffffff" : colors.textMuted;

  switch (level) {
    case 1:
      return withFill(HALF_MASTERY, proficientFill);
    case 2:
      return withFill(FULL_CIRCLE, proficientFill);
    case 3:
      return withFill(EXPERT, proficientFill);
    default:
      return withFill(NO_MASTERY_DARK, emptyFill);
  }
}