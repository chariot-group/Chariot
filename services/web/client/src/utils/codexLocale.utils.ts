/**
 * Emoji drapeau pour les locales du Codex (affichage recherche multi-langues).
 */
export function codexLocaleFlagEmoji(locale: string): string {
  switch (locale) {
    case "fr":
      return "🇫🇷";
    case "en":
      return "🇬🇧";
    case "es":
      return "🇪🇸";
    default:
      return "";
  }
}
