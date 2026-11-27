import { isPlainObject, type JsonObject } from "@/lib/rulesetEngine/paths";
import {
  RULESET_DEFAULT_LOCALE,
  type BuilderAnswers,
  type ResolvedEntry,
  type RulesetEntry,
  type RulesetLocale,
  type TranslatedText,
} from "@/lib/rulesetEngine/types";

/**
 * Catalog lookups, translations and small value helpers of the builder engine.
 *
 * @see FR-ruleset-character-builder — Builder engine, Translations
 */

export type Catalog = {
  byType: Map<string, RulesetEntry[]>;
  byKey: Map<string, RulesetEntry>;
  get: (type: string, key: string) => RulesetEntry | undefined;
  resolve: (entry: RulesetEntry) => ResolvedEntry;
};

export const entryId = (entry: { type: string; key: string }) => `${entry.type}:${entry.key}`;

export function translate(text: TranslatedText | undefined, locale: RulesetLocale, repeat?: Record<string, unknown>) {
  if (!text) return undefined;
  const raw = text[locale] ?? text[RULESET_DEFAULT_LOCALE] ?? "";
  if (!repeat) return raw;
  return raw.replace(/\{repeat\.([A-Za-z0-9_]+)\}/g, (match, name: string) =>
    repeat[name] === undefined ? match : String(repeat[name]),
  );
}

export function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (isPlainObject(value) && Object.keys(value).length === 0)
  );
}

export function toCount(value: unknown): number | undefined {
  const count = typeof value === "number" ? value : Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : undefined;
}

export function buildCatalog(entries: RulesetEntry[], locale: RulesetLocale): Catalog {
  const byType = new Map<string, RulesetEntry[]>();
  const byKey = new Map<string, RulesetEntry>();
  const byId = new Map<string, RulesetEntry>();
  const resolved = new Map<RulesetEntry, ResolvedEntry>();
  for (const entry of entries) {
    byType.set(entry.type, [...(byType.get(entry.type) ?? []), entry]);
    if (!byKey.has(entry.key)) byKey.set(entry.key, entry);
    byId.set(entryId(entry), entry);
  }
  const resolve = (entry: RulesetEntry): ResolvedEntry => {
    const cached = resolved.get(entry);
    if (cached) return cached;
    const result: ResolvedEntry = {
      type: entry.type,
      key: entry.key,
      ...(entry.parentKey ? { parentKey: entry.parentKey } : {}),
      label: translate(entry.label, locale) ?? entry.key,
      ...(entry.description ? { description: translate(entry.description, locale) } : {}),
      ...(entry.level !== undefined ? { level: entry.level } : {}),
      tags: entry.tags ?? [],
      data: entry.data ?? {},
    };
    resolved.set(entry, result);
    return result;
  };
  return { byType, byKey, get: (type, key) => byId.get(entryId({ type, key })), resolve };
}

export function mergeAnswers(saved: BuilderAnswers | undefined, answers: BuilderAnswers): BuilderAnswers {
  if (!saved) return answers;
  const merged: BuilderAnswers = { ...saved };
  for (const [fieldId, value] of Object.entries(answers)) {
    const previous = merged[fieldId];
    merged[fieldId] = isPlainObject(previous) && isPlainObject(value) ? { ...previous, ...value } : value;
  }
  return merged;
}

/** `state.labels`: every list of keys (or of objects with a `key`) resolved to labels. */
export function buildLabels(node: unknown, catalog: Catalog, locale: RulesetLocale): unknown {
  if (Array.isArray(node)) {
    const resolvable = node.every(
      (item) =>
        typeof item === "string" ||
        (isPlainObject(item) && (typeof item.key === "string" || isPlainObject(item.label))),
    );
    if (!resolvable) return undefined;
    return node.map((item) => {
      if (typeof item === "string")
        return catalog.byKey.has(item) ? catalog.resolve(catalog.byKey.get(item)!).label : item;
      const object = item as JsonObject;
      if (isPlainObject(object.label)) {
        return { ...object, label: translate(object.label as TranslatedText, locale) };
      }
      const entry = catalog.byKey.get(object.key as string);
      return { ...object, label: entry ? catalog.resolve(entry).label : object.key };
    });
  }
  if (!isPlainObject(node)) return undefined;
  const labels: JsonObject = {};
  for (const [name, child] of Object.entries(node)) {
    const label = buildLabels(child, catalog, locale);
    if (label !== undefined) labels[name] = label;
  }
  return Object.keys(labels).length ? labels : undefined;
}
