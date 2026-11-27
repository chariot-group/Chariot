import { isPlainObject, jsonEquals, type JsonObject } from "@/lib/rulesetEngine/paths";
import type { AbilityAllocationAnswer, BuilderField, BuilderIssue } from "@/lib/rulesetEngine/types";

/**
 * `abilityAllocation` field: methods are guidance (warnings), only missing scores or method are errors.
 * No value is ever generated: the dice-roll method only takes the results entered by the player.
 *
 * @see FR-ruleset-character-builder — Seed `dnd5e-2014` (ability scores, no virtual dice)
 */

export type AllocationReporter = (code: BuilderIssue["code"], severity: BuilderIssue["severity"]) => void;

/** Allocation value: `{ method, <ability>: score }`, only with the scores the player entered. */
export function allocationValue(
  field: BuilderField,
  raw: unknown,
  answered: boolean,
  report: AllocationReporter,
): JsonObject | null {
  if (!answered || !isPlainObject(raw)) return null;
  const answer = raw as AbilityAllocationAnswer;
  const config = field.config ?? {};
  const abilities = Array.isArray(config.abilities) ? (config.abilities as string[]) : Object.keys(answer.scores ?? {});
  const scores: Record<string, number> = {};
  for (const ability of abilities) {
    const score = answer.scores?.[ability];
    if (typeof score === "number" && Number.isFinite(score)) scores[ability] = score;
  }
  const method = answer.method;
  if (!method || !(field.methods ?? []).includes(method)) report("allocation-method", "error");
  if (Object.keys(scores).length < abilities.length) report("allocation-incomplete", "error");
  const values = Object.values(scores);
  if (method === "pointBuy" && isPlainObject(config.pointBuy)) {
    const { budget, min, max, costs } = config.pointBuy as {
      budget?: number;
      min?: number;
      max?: number;
      costs?: Record<string, number>;
    };
    if (values.some((score) => (min !== undefined && score < min) || (max !== undefined && score > max))) {
      report("point-buy-range", "warning");
    }
    const spent = values.reduce((total, score) => total + (costs?.[String(score)] ?? 0), 0);
    if (budget !== undefined && spent > budget) report("point-buy-budget", "warning");
  }
  if (method === "standardArray" && Array.isArray(config.standardArray)) {
    const expected = [...(config.standardArray as number[])].sort((a, b) => a - b);
    if (
      !jsonEquals(
        [...values].sort((a, b) => a - b),
        expected,
      )
    )
      report("standard-array-mismatch", "warning");
  }
  if (method === "roll" && isPlainObject(config.roll)) {
    const { min, max } = config.roll as { min?: number; max?: number };
    if (values.some((score) => (min !== undefined && score < min) || (max !== undefined && score > max))) {
      report("roll-range", "warning");
    }
  }
  return { method: method ?? null, ...scores };
}
