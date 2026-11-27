import { allocationTotalFieldIds } from "@/lib/characterBuilder/abilityAllocation";
import type { EvaluatedCard, EvaluatedField, EvaluatedPage } from "@/lib/rulesetEngine/types";

/**
 * Layout of a builder page: step cards grouping fields, standalone fields, column spans.
 * @see FR-ruleset-character-builder — Web builder UI (Layout)
 */

export type FieldGroup = { card?: EvaluatedCard; fields: EvaluatedField[] };

/**
 * Fields of a page in display order: the step cards group their fields (at the place of their first field), every
 * other field stands alone; computed totals shown in an allocation table are left out.
 */
export function groupPageFields(page: Pick<EvaluatedPage, "fields" | "cards">): FieldGroup[] {
  const hidden = allocationTotalFieldIds(page.fields);
  const visible = page.fields.filter((field) => !hidden.has(field.id));
  const groups: FieldGroup[] = [];
  const placed = new Set<string>();
  for (const field of visible) {
    if (placed.has(field.id)) continue;
    const card = page.cards.find((candidate) => candidate.fields.includes(field.id));
    if (!card) {
      groups.push({ fields: [field] });
      continue;
    }
    const fields = visible.filter((candidate) => card.fields.includes(candidate.id));
    fields.forEach((candidate) => placed.add(candidate.id));
    groups.push({ card, fields });
  }
  return groups;
}

/** In a card, simple inputs sit side by side; long texts and choice lists take the full width. */
export const isHalfWidthField = (field: EvaluatedField) =>
  (field.type === "number" || field.type === "text" || field.type === "computed") && field.config?.multiline !== true;
