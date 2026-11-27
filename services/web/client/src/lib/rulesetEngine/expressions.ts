import jsonLogic from "json-logic-js";

/**
 * JSON Logic evaluation for the builder engine: standard operators only (same list as the adventure
 * service validation), failures returned as values, never thrown.
 *
 * @see FR-ruleset-character-builder — Logic and expressions, Builder engine
 */

export const JSON_LOGIC_OPERATORS: ReadonlySet<string> = new Set([
  "var",
  "missing",
  "missing_some",
  "if",
  "?:",
  "==",
  "===",
  "!=",
  "!==",
  "!",
  "!!",
  "or",
  "and",
  ">",
  ">=",
  "<",
  "<=",
  "max",
  "min",
  "+",
  "-",
  "*",
  "/",
  "%",
  "map",
  "filter",
  "reduce",
  "all",
  "none",
  "some",
  "merge",
  "in",
  "cat",
  "substr",
]);

export type ExpressionResult = { ok: true; value: unknown } | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A JSON Logic operation is an object with exactly one key. */
export function isLogic(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && Object.keys(value).length === 1;
}

/** Returns the first operator outside the allowed list, if any. */
export function findForbiddenOperator(expression: unknown): string | undefined {
  if (Array.isArray(expression)) {
    for (const item of expression) {
      const found = findForbiddenOperator(item);
      if (found) return found;
    }
    return undefined;
  }
  if (!isLogic(expression)) return undefined;
  const [operator] = Object.keys(expression);
  if (!JSON_LOGIC_OPERATORS.has(operator)) return operator;
  return findForbiddenOperator(expression[operator]);
}

/** Operator check per expression object: ruleset expressions are immutable and evaluated many times. */
const forbiddenCache = new WeakMap<object, string | null>();

function cachedForbiddenOperator(expression: unknown): string | undefined {
  if (typeof expression !== "object" || expression === null) return undefined;
  if (!forbiddenCache.has(expression)) forbiddenCache.set(expression, findForbiddenOperator(expression) ?? null);
  return forbiddenCache.get(expression) ?? undefined;
}

/** Evaluates a JSON Logic expression (or returns a literal as is) against `data`. */
export function evaluateExpression(expression: unknown, data: object): ExpressionResult {
  if (expression === undefined) return { ok: true, value: undefined };
  const forbidden = cachedForbiddenOperator(expression);
  if (forbidden) return { ok: false, error: `Unknown operator "${forbidden}"` };
  try {
    const value = jsonLogic.apply(expression as jsonLogic.RulesLogic, data);
    if (typeof value === "number" && !Number.isFinite(value)) {
      return { ok: false, error: "Expression does not evaluate to a finite number" };
    }
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** JSON Logic truthiness (empty arrays are falsy). */
export function isTruthy(value: unknown): boolean {
  return jsonLogic.truthy(value);
}
