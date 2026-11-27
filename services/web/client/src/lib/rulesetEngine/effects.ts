import { cloneJson, deletePath, getPath, jsonEquals, setPath, type JsonObject } from "@/lib/rulesetEngine/paths";
import type { EntryEffect } from "@/lib/rulesetEngine/types";

/**
 * Application of entry effects on the builder state.
 *
 * @see FR-ruleset-character-builder — Builder engine (Effects)
 */

const KEY_PLACEHOLDER = "{key}";

/** Replaces `{key}` in every string of `value` (grant effects, applied per chosen option). */
export function replaceKeyPlaceholder<T>(value: T, key: string): T {
  if (typeof value === "string") return value.split(KEY_PLACEHOLDER).join(key) as T;
  if (Array.isArray(value)) return value.map((item) => replaceKeyPlaceholder(item, key)) as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, replaceKeyPlaceholder(item, key)]),
    ) as T;
  }
  return value;
}

function asList(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Applies one effect in place. Returns `false` when the effect cannot apply (unsafe target, `add` on
 * incompatible values).
 */
export function applyEffect(state: JsonObject, effect: EntryEffect): boolean {
  const current = getPath(state, effect.target);
  const value = cloneJson(effect.value);

  switch (effect.op) {
    case "set":
      return setPath(state, effect.target, value);
    case "add": {
      if (typeof value === "number" && (current === undefined || typeof current === "number")) {
        return setPath(state, effect.target, (current ?? 0) + value);
      }
      if (current === undefined || Array.isArray(current)) {
        return setPath(state, effect.target, [...asList(current), ...asList(value)]);
      }
      return false;
    }
    case "grant": {
      if (current !== undefined && !Array.isArray(current)) return false;
      const next = [...asList(current)];
      for (const item of asList(value)) {
        if (!next.some((existing) => jsonEquals(existing, item))) next.push(item);
      }
      return setPath(state, effect.target, next);
    }
    case "max": {
      if (typeof value !== "number" || (current !== undefined && typeof current !== "number")) return false;
      return setPath(state, effect.target, current === undefined ? value : Math.max(current, value));
    }
    case "remove": {
      if (effect.value === undefined) {
        deletePath(state, effect.target);
        return true;
      }
      if (!Array.isArray(current)) return current === undefined;
      const removed = asList(value);
      return setPath(
        state,
        effect.target,
        current.filter((item) => !removed.some((candidate) => jsonEquals(candidate, item))),
      );
    }
    default:
      return false;
  }
}
