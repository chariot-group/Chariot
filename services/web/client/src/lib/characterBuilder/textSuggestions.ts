import { getPath } from "@/lib/rulesetEngine/paths";
import { RULESET_DEFAULT_LOCALE, type EvaluatedField, type RulesetLocale } from "@/lib/rulesetEngine/types";

/**
 * Suggestions offered by a text field (`config.suggestionsFrom` field entry, `data.suggestions[suggestionsKey]`).
 * Each suggestion is a plain text or a translated text resolved in the user's locale (fallback `en`).
 * @see FR-ruleset-character-builder — Web builder UI (Fields: text)
 */
export function textSuggestions(
  field: Pick<EvaluatedField, "config">,
  state: Record<string, unknown>,
  locale: RulesetLocale,
): string[] {
  const from = field.config?.suggestionsFrom;
  const key = field.config?.suggestionsKey;
  if (typeof from !== "string" || typeof key !== "string") return [];
  const list = getPath(state, `entries.${from}.data.suggestions.${key}`);
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const texts = item as Partial<Record<RulesetLocale, unknown>>;
        const text = texts[locale] ?? texts[RULESET_DEFAULT_LOCALE];
        return typeof text === "string" ? text : null;
      }
      return null;
    })
    .filter((text): text is string => typeof text === "string" && text.trim() !== "");
}
