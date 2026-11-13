import { durationToRemainingSeconds } from "@/components/initiativeTracker/conditionDuration";
import type { InitiativeTrackerConditionDuration } from "@/store/slices/sessionSlice";


/** @see FR-tracker-custom-effects */
export const CUSTOM_EFFECT_NAME_MAX_LENGTH = 40;
export const CUSTOM_EFFECT_DESCRIPTION_MAX_LENGTH = 280;

export interface TrackerCustomEffectDefinition {
  id: string;
  name: string;
  description?: string;
}

export interface InitiativeTrackerCustomEffectEntry {
  effectId: string;
  name: string;
  description?: string;
  duration?: InitiativeTrackerConditionDuration;
  remainingSeconds?: number;
}

export function normalizeCustomEffectName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, CUSTOM_EFFECT_NAME_MAX_LENGTH);
}

export function normalizeCustomEffectDescription(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, CUSTOM_EFFECT_DESCRIPTION_MAX_LENGTH);
}

export function customEffectNamesMatch(left: string, right: string): boolean {
  return normalizeCustomEffectName(left).toLocaleLowerCase() === normalizeCustomEffectName(right).toLocaleLowerCase();
}

export function normalizeCustomEffectDefinition(value: unknown): TrackerCustomEffectDefinition | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TrackerCustomEffectDefinition>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const name = normalizeCustomEffectName(candidate.name);
  if (!id || !name) return null;
  const description = normalizeCustomEffectDescription(candidate.description);
  return description ? { id, name, description } : { id, name };
}

export function normalizeCustomEffectCatalog(value: unknown): TrackerCustomEffectDefinition[] {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const catalog: TrackerCustomEffectDefinition[] = [];
  for (const entry of value) {
    const definition = normalizeCustomEffectDefinition(entry);
    if (!definition) continue;
    const nameKey = definition.name.toLocaleLowerCase();
    if (seenIds.has(definition.id) || seenNames.has(nameKey)) continue;
    seenIds.add(definition.id);
    seenNames.add(nameKey);
    catalog.push(definition);
  }
  return catalog;
}

export function findCatalogEntryByName(
  catalog: TrackerCustomEffectDefinition[],
  name: string,
): TrackerCustomEffectDefinition | undefined {
  return catalog.find((entry) => customEffectNamesMatch(entry.name, name));
}

function createCustomEffectId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type UpsertCustomEffectResult =
  | { ok: true; catalog: TrackerCustomEffectDefinition[]; definition: TrackerCustomEffectDefinition }
  | { ok: false; error: "empty-name" };

export function upsertCustomEffectDefinition(
  catalog: TrackerCustomEffectDefinition[],
  input: { id?: string; name: string; description?: string },
): UpsertCustomEffectResult {
  const name = normalizeCustomEffectName(input.name);
  if (!name) return { ok: false, error: "empty-name" };

  const description = normalizeCustomEffectDescription(input.description);
  const existing = findCatalogEntryByName(catalog, name);
  if (existing) {
    const definition =
      description && !existing.description ? { ...existing, description } : existing;
    return {
      ok: true,
      catalog: catalog.map((entry) => (entry.id === definition.id ? definition : entry)),
      definition,
    };
  }

  const definition: TrackerCustomEffectDefinition = {
    id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : createCustomEffectId(),
    name,
    ...(description ? { description } : {}),
  };
  return { ok: true, catalog: [...catalog, definition], definition };
}

export function buildCustomEffectEntry(
  definition: TrackerCustomEffectDefinition,
  duration?: InitiativeTrackerConditionDuration,
): InitiativeTrackerCustomEffectEntry {
  const base: InitiativeTrackerCustomEffectEntry = {
    effectId: definition.id,
    name: definition.name,
    ...(definition.description ? { description: definition.description } : {}),
  };

  if (!duration) return base;

  if (duration.unit === "untilCombatEnd") {
    return { ...base, duration: { amount: 1, unit: "untilCombatEnd" } };
  }

  return {
    ...base,
    duration,
    remainingSeconds: durationToRemainingSeconds(duration),
  };
}

export function normalizeCustomEffectEntry(value: unknown): InitiativeTrackerCustomEffectEntry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<InitiativeTrackerCustomEffectEntry>;
  const effectId = typeof candidate.effectId === "string" ? candidate.effectId.trim() : "";
  const name = normalizeCustomEffectName(candidate.name);
  if (!effectId || !name) return null;

  const description = normalizeCustomEffectDescription(candidate.description);
  const entry: InitiativeTrackerCustomEffectEntry = {
    effectId,
    name,
    ...(description ? { description } : {}),
  };

  if (!candidate.duration) return entry;

  const { amount, unit } = candidate.duration;
  if (unit === "untilCombatEnd") {
    return { ...entry, duration: { amount: 1, unit } };
  }

  if (!Number.isFinite(amount) || amount <= 0) return entry;

  const duration = { amount, unit };
  return {
    ...entry,
    duration,
    remainingSeconds:
      typeof candidate.remainingSeconds === "number" && Number.isFinite(candidate.remainingSeconds)
        ? candidate.remainingSeconds
        : durationToRemainingSeconds(duration),
  };
}

export function normalizeCustomEffectEntries(value: unknown): InitiativeTrackerCustomEffectEntry[] {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set<string>();
  const entries: InitiativeTrackerCustomEffectEntry[] = [];
  for (const item of value) {
    const entry = normalizeCustomEffectEntry(item);
    if (!entry || seenIds.has(entry.effectId)) continue;
    seenIds.add(entry.effectId);
    entries.push(entry);
  }
  return entries;
}

export function replaceCustomEffectOnRow(
  entries: InitiativeTrackerCustomEffectEntry[] | undefined,
  definition: TrackerCustomEffectDefinition,
  duration?: InitiativeTrackerConditionDuration,
): InitiativeTrackerCustomEffectEntry[] {
  const next = buildCustomEffectEntry(definition, duration);
  return [...(entries ?? []).filter((entry) => entry.effectId !== definition.id), next];
}
