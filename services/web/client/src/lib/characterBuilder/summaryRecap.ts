import {
  allocationTotalFieldIds,
  allocationTotals,
  readAllocationConfig,
} from "@/lib/characterBuilder/abilityAllocation";
import { readSpellChoices } from "@/lib/characterBuilder/spellChoices";
import type { EvaluatedField, EvaluatedPage } from "@/lib/rulesetEngine/types";

/**
 * Answers of one builder page as label / value rows, for the summary cards (« Modify » opens the page).
 * @see FR-ruleset-character-builder — Web builder UI (Fields: summary)
 */

export type RecapRow = { key: string; label: string; value: string };

const optionLabel = (field: EvaluatedField, key: string, entryLabel: (key: string) => string) =>
  field.options?.find((option) => option.key === key)?.label ?? entryLabel(key);

function fieldRows(
  field: EvaluatedField,
  page: EvaluatedPage,
  entryLabel: (key: string) => string,
  answer: unknown,
): RecapRow[] {
  switch (field.type) {
    case "entitySelect":
      return typeof field.value === "string"
        ? [{ key: field.id, label: field.label, value: optionLabel(field, field.value, entryLabel) }]
        : [];
    case "multiSelect": {
      const keys = Array.isArray(field.value) ? (field.value as string[]) : [];
      return keys.length
        ? [
            {
              key: field.id,
              label: field.label,
              value: keys.map((key) => optionLabel(field, key, entryLabel)).join(", "),
            },
          ]
        : [];
    }
    case "grantedChoices":
      return (field.grants ?? [])
        .filter((grant) => grant.chosen.length)
        .map((grant) => ({
          key: grant.key,
          label: grant.label ?? field.label,
          value: grant.chosen
            .map((key) => grant.options.find((option) => option.key === key)?.label ?? entryLabel(key))
            .join(", "),
        }));
    case "abilityAllocation": {
      const config = readAllocationConfig(field.config);
      const scores = (field.value ?? {}) as Record<string, unknown>;
      const totals = allocationTotals(config, page.fields);
      const parts = config.abilities
        .filter((ability) => typeof scores[ability] === "number")
        .map((ability) => {
          const total = totals[ability];
          const base = scores[ability] as number;
          return `${entryLabel(ability)} ${typeof total === "number" && total !== base ? `${base} → ${total}` : base}`;
        });
      return parts.length ? [{ key: field.id, label: field.label, value: parts.join(", ") }] : [];
    }
    case "spellSelect": {
      const spells = readSpellChoices(answer ?? field.value);
      return spells.length
        ? [{ key: field.id, label: field.label, value: spells.map((spell) => spell.name).join(", ") }]
        : [];
    }
    case "summary":
      return [];
    default:
      return field.value === null || field.value === undefined || field.value === ""
        ? []
        : [{ key: field.id, label: field.label, value: String(field.value) }];
  }
}

export function pageRecap(page: EvaluatedPage, entryLabel: (key: string) => string): RecapRow[] {
  const hidden = allocationTotalFieldIds(page.fields);
  return page.fields
    .filter((field) => !hidden.has(field.id))
    .flatMap((field) => fieldRows(field, page, entryLabel, field.value));
}

/** Abilities listed by the first `abilityAllocation` field of the builder (empty when the ruleset has none). */
export function summaryAbilities(pages: readonly EvaluatedPage[]): string[] {
  for (const page of pages) {
    const field = page.fields.find((candidate) => candidate.type === "abilityAllocation");
    if (field) return readAllocationConfig(field.config).abilities;
  }
  return [];
}
