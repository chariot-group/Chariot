import type { CodexMonsterItem, CodexMonsterTranslation, CodexSpellItem } from "@/services/CodexService";

/**
 * Langues du document Codex pour lesquelles une traduction existe réellement.
 * Prend l'union de `languages` et des clés de `translations` pour ne rien omettre.
 * Tolère `languages` ou `translations` absents.
 */
export function codexAvailableTranslationLangs(
  languages: string[] | undefined,
  translations: Record<string, unknown> | undefined,
): string[] {
  const keys = new Set<string>([...(languages ?? []), ...Object.keys(translations ?? {})]);
  return [...keys].filter((l) => translations?.[l] != null).sort();
}

/**
 * Normalise un texte pour comparaison insensible à la casse et aux accents (recherche locale).
 */
function normalizeCodexSearchText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * En mode « toutes les langues », l'API peut renvoyer tout le document dès qu'une langue matche.
 * On n'affiche dans la liste que les langues dont le nom du sort contient la requête.
 * Si aucune ne matche côté client (ex. recherche plein texte), on retombe sur toutes les langues.
 */
export function codexSpellLangsVisibleInAllLanguagesSearch(
  spell: CodexSpellItem,
  searchQuery: string,
): string[] {
  const base = codexAvailableTranslationLangs(
    spell.languages,
    spell.translations as Record<string, unknown>,
  );
  const q = searchQuery.trim();
  if (!q) return base;
  const nq = normalizeCodexSearchText(q);
  const matched = base.filter((lang) => {
    const name = spell.translations[lang]?.name;
    return typeof name === "string" && normalizeCodexSearchText(name).includes(nq);
  });
  return matched.length > 0 ? matched : base;
}

/**
 * Titre utilisé pour la recherche locale des monstres : même champ que l’en-tête de carte (firstname),
 * avec repli si le prénom est vide (certains documents ne remplissent que lastname/surname).
 */
function codexMonsterTranslationSearchableTitle(t: CodexMonsterTranslation | undefined): string {
  if (!t) return "";
  const primary = (t.firstname ?? "").trim();
  if (primary) return primary;
  return [t.lastname, t.surname].filter(Boolean).join(" ").trim();
}

/**
 * En mode « toutes les langues », l'API peut renvoyer tout le document dès qu'une langue matche.
 * On n'affiche dans la liste que les langues dont le titre du monstre (comme sur la carte) contient la requête,
 * avec la même normalisation que pour les sorts.
 * Si aucune ne matche côté client, on retombe sur toutes les langues.
 */
export function codexMonsterLangsVisibleInAllLanguagesSearch(
  monster: CodexMonsterItem,
  searchQuery: string,
): string[] {
  const base = codexAvailableTranslationLangs(
    monster.languages,
    monster.translations as Record<string, unknown>,
  );
  const q = searchQuery.trim();
  if (!q) return base;
  const nq = normalizeCodexSearchText(q);
  const matched = base.filter((lang) => {
    const title = codexMonsterTranslationSearchableTitle(monster.translations[lang]);
    return title.length > 0 && normalizeCodexSearchText(title).includes(nq);
  });
  return matched.length > 0 ? matched : base;
}

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
