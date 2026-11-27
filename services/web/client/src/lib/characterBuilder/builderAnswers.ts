import type { BuilderAnswers, GrantedChoicesAnswer } from "@/lib/rulesetEngine/types";

/**
 * Immutable updates of the builder answers (`answers[fieldId]`, `answers[fieldId][repeatIndex]` on a repeated page).
 *
 * @see FR-ruleset-character-builder — Web builder UI
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Answer of a field on a page (`index` set on a repeated page). */
export function readFieldAnswer(answers: BuilderAnswers, fieldId: string, index?: number): unknown {
  const answer = answers[fieldId];
  if (index === undefined) return answer;
  return isRecord(answer) ? answer[String(index)] : undefined;
}

/** Sets (or clears with `undefined`) the answer of a field on a page. */
export function setFieldAnswer(
  answers: BuilderAnswers,
  fieldId: string,
  index: number | undefined,
  value: unknown,
): BuilderAnswers {
  const next: BuilderAnswers = { ...answers };
  if (index === undefined) {
    if (value === undefined) delete next[fieldId];
    else next[fieldId] = value;
    return next;
  }
  const byIndex = isRecord(answers[fieldId]) ? { ...(answers[fieldId] as Record<string, unknown>) } : {};
  if (value === undefined) delete byIndex[String(index)];
  else byIndex[String(index)] = value;
  if (Object.keys(byIndex).length) next[fieldId] = byIndex;
  else delete next[fieldId];
  return next;
}

/** Sets the options chosen for one grant of a `grantedChoices` field. */
export function setGrantAnswer(
  answers: BuilderAnswers,
  fieldId: string,
  index: number | undefined,
  grantId: string,
  keys: string[],
): BuilderAnswers {
  const current = readFieldAnswer(answers, fieldId, index);
  const grants: GrantedChoicesAnswer = isRecord(current) ? { ...(current as GrantedChoicesAnswer) } : {};
  // An empty list is an explicit answer: the suggested (obvious) choice must not come back.
  grants[grantId] = keys;
  return setFieldAnswer(answers, fieldId, index, grants);
}

/** Toggles one option in a multi-choice answer. */
export function toggleKey(keys: readonly string[], key: string, checked: boolean): string[] {
  if (checked) return keys.includes(key) ? [...keys] : [...keys, key];
  return keys.filter((candidate) => candidate !== key);
}
