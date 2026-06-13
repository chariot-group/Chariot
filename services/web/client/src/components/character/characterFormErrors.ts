import type { FieldErrors, FieldValues } from "react-hook-form";
import type { CharacterTab } from "@/components/character/CharacterTabs";
import type { Spell } from "@/types/character";

const ERROR_METADATA_KEYS = new Set(["message", "type", "types", "ref", "root"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getErrorFieldPaths(errors: FieldErrors<FieldValues> | Record<string, unknown>): string[] {
  const paths: string[] = [];

  function walk(value: unknown, path: string) {
    if (!isRecord(value)) return;

    const hasOwnMessage = typeof value.message === "string" && path.length > 0;
    const childEntries = Object.entries(value).filter(([key]) => !ERROR_METADATA_KEYS.has(key));

    if (hasOwnMessage) {
      paths.push(path);
    }

    for (const [key, childValue] of childEntries) {
      walk(childValue, path ? `${path}.${key}` : key);
    }

    if (!hasOwnMessage && childEntries.length === 0 && path.length > 0) {
      paths.push(path);
    }
  }

  walk(errors, "");

  return [...new Set(paths)];
}

function tabsForFieldPath(path: string): CharacterTab[] {
  if (path.startsWith("spellcasting")) return ["magic"];
  if (path.startsWith("treasure")) return ["inventory"];
  if (path.startsWith("appearance") || path.startsWith("background")) return ["history"];
  if (path.startsWith("affinities") || path.startsWith("actions") || path.startsWith("conditions") || path.startsWith("deathSaves")) {
    return ["battle"];
  }
  if (path.startsWith("abilities")) {
    return ["general", "battle"];
  }

  return ["general"];
}

export function getCharacterTabsWithErrors(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
): Partial<Record<CharacterTab, boolean>> {
  return getErrorFieldPaths(errors).reduce<Partial<Record<CharacterTab, boolean>>>((acc, path) => {
    for (const tab of tabsForFieldPath(path)) {
      acc[tab] = true;
    }

    return acc;
  }, {});
}

export function getFirstCharacterTabWithError(errors: FieldErrors<FieldValues> | Record<string, unknown>): CharacterTab | null {
  const tabsWithErrors = getCharacterTabsWithErrors(errors);
  const tabOrder: CharacterTab[] = ["general", "battle", "magic", "inventory", "history"];

  return tabOrder.find((tab) => tabsWithErrors[tab]) ?? null;
}

export function getSpellIndicesWithErrors(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
  spellcastingIndex: number,
): number[] {
  const spellPathPrefix = `spellcasting.${spellcastingIndex}.spells.`;
  const spellIndices = getErrorFieldPaths(errors).reduce<Set<number>>((acc, path) => {
    if (!path.startsWith(spellPathPrefix)) return acc;

    const index = Number(path.slice(spellPathPrefix.length).split(".")[0]);
    if (Number.isInteger(index) && index >= 0) {
      acc.add(index);
    }

    return acc;
  }, new Set<number>());

  return [...spellIndices].sort((a, b) => a - b);
}

export function getSpellLevelsWithErrors(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
  spellcastingIndex: number,
  spells: Spell[],
): Partial<Record<number, boolean>> {
  const levelErrors = getSpellIndicesWithErrors(errors, spellcastingIndex).reduce<Partial<Record<number, boolean>>>(
    (acc, spellIndex) => {
      const level = Number(spells[spellIndex]?.level ?? 0);
      if (Number.isFinite(level)) {
        acc[level] = true;
      }

      return acc;
    },
    {},
  );

  const slotPathPrefix = `spellcasting.${spellcastingIndex}.spellSlotsByLevel.`;
  for (const path of getErrorFieldPaths(errors)) {
    if (!path.startsWith(slotPathPrefix)) continue;

    const level = Number(path.slice(slotPathPrefix.length).split(".")[0]);
    if (Number.isFinite(level)) {
      levelErrors[level] = true;
    }
  }

  return levelErrors;
}

export function getSpellUsesGroupsWithErrors(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
  spellcastingIndex: number,
  spells: Spell[],
  getUsesKey: (uses: number | null) => string,
): Record<string, boolean> {
  const usesErrors = getSpellIndicesWithErrors(errors, spellcastingIndex).reduce<Record<string, boolean>>((acc, spellIndex) => {
    const uses = spells[spellIndex]?.usesPerDay ?? null;
    acc[getUsesKey(uses)] = true;
    return acc;
  }, {});

  const slotPathPrefix = `spellcasting.${spellcastingIndex}.spellSlotsByUses.`;
  for (const path of getErrorFieldPaths(errors)) {
    if (!path.startsWith(slotPathPrefix)) continue;

    const key = path.slice(slotPathPrefix.length).split(".")[0];
    if (key) {
      usesErrors[key] = true;
    }
  }

  return usesErrors;
}
