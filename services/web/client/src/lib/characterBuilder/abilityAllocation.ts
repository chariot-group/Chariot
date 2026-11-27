import type { AbilityAllocationAnswer, AbilityAllocationMethod } from "@/lib/rulesetEngine/types";

/**
 * Helpers of the `abilityAllocation` field UI, driven by the field `config` (no game-system knowledge).
 * @see FR-ruleset-character-builder — Seed `dnd5e-2014` (ability scores), Web builder UI (Fields)
 */

export type PointBuyConfig = { budget?: number; min?: number; max?: number; costs?: Record<string, number> };
export type RollConfig = { dice?: string; dropLowest?: number; min?: number; max?: number };

export type AllocationConfig = {
  abilities: string[];
  /** Ability → `computed` field of the page holding its total (shown in the ability row). */
  totals: Record<string, string>;
  pointBuy?: PointBuyConfig;
  standardArray?: number[];
  roll?: RollConfig;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function readAllocationConfig(config: Record<string, unknown> | undefined): AllocationConfig {
  const source = config ?? {};
  return {
    abilities: Array.isArray(source.abilities)
      ? source.abilities.filter((a): a is string => typeof a === "string")
      : [],
    totals: isRecord(source.totals)
      ? Object.fromEntries(
          Object.entries(source.totals).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : {},
    pointBuy: isRecord(source.pointBuy) ? (source.pointBuy as PointBuyConfig) : undefined,
    standardArray: Array.isArray(source.standardArray)
      ? source.standardArray.filter((v): v is number => typeof v === "number")
      : undefined,
    roll: isRecord(source.roll) ? (source.roll as RollConfig) : undefined,
  };
}

export function readAllocationAnswer(answer: unknown): AbilityAllocationAnswer {
  if (!isRecord(answer)) return {};
  const scores = isRecord(answer.scores) ? (answer.scores as Record<string, number | null>) : {};
  return { method: answer.method as AbilityAllocationMethod | undefined, scores };
}

/** Points left in the point-buy budget (`null` without budget). */
export function pointBuyRemaining(pointBuy: PointBuyConfig | undefined, scores: Record<string, number | null>) {
  if (!pointBuy?.budget && pointBuy?.budget !== 0) return null;
  const spent = Object.values(scores).reduce<number>(
    (total, score) => total + (typeof score === "number" ? (pointBuy.costs?.[String(score)] ?? 0) : 0),
    0,
  );
  return pointBuy.budget - spent;
}

/** Cost in points of a point-buy value (0 when the config gives none). */
export function pointBuyCost(pointBuy: PointBuyConfig | undefined, score: number): number {
  return pointBuy?.costs?.[String(score)] ?? 0;
}

/** Point-buy values of the config, in ascending order. */
export function pointBuyValues(pointBuy: PointBuyConfig | undefined): number[] {
  return Object.keys(pointBuy?.costs ?? {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

/**
 * Standard-array values an ability can still take: each value of the array once, the ability's own value included.
 */
export function availableArrayValues(
  array: readonly number[],
  scores: Record<string, number | null>,
  ability: string,
): number[] {
  const remaining = [...array];
  for (const [other, score] of Object.entries(scores)) {
    if (other === ability || typeof score !== "number") continue;
    const index = remaining.indexOf(score);
    if (index >= 0) remaining.splice(index, 1);
  }
  return [...new Set(remaining)].sort((a, b) => b - a);
}

/** New answer after a method change: scores are kept only when they still fit the new method. */
export function changeAllocationMethod(
  answer: AbilityAllocationAnswer,
  method: AbilityAllocationMethod,
): AbilityAllocationAnswer {
  return method === answer.method ? answer : { method, scores: {} };
}

export function setAllocationScore(
  answer: AbilityAllocationAnswer,
  ability: string,
  score: number | null,
): AbilityAllocationAnswer {
  return { ...answer, scores: { ...(answer.scores ?? {}), [ability]: score } };
}

/** Totals of the abilities read from the computed fields of the page (`config.totals`). */
export function allocationTotals(
  config: AllocationConfig,
  pageFields: readonly { id: string; value: unknown }[],
): Record<string, number | undefined> {
  return Object.fromEntries(
    Object.entries(config.totals).map(([ability, fieldId]) => {
      const value = pageFields.find((field) => field.id === fieldId)?.value;
      return [ability, typeof value === "number" ? value : undefined];
    }),
  );
}

/** Computed fields shown inside an allocation table (hidden as separate fields). */
export function allocationTotalFieldIds(fields: readonly { type: string; config?: Record<string, unknown> }[]) {
  return new Set(
    fields
      .filter((field) => field.type === "abilityAllocation")
      .flatMap((field) => Object.values(readAllocationConfig(field.config).totals)),
  );
}
