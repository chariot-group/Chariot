/**
 * Dotted-path helpers on plain JSON objects, used for the builder state and the projected sheet.
 *
 * @see FR-ruleset-character-builder — Builder engine
 */

const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

export type JsonObject = Record<string, unknown>;

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Splits a dotted path; returns `null` when a segment is empty or unsafe. */
export function splitPath(path: string): string[] | null {
  const segments = path.split(".");
  if (segments.some((segment) => segment === "" || FORBIDDEN_SEGMENTS.has(segment))) return null;
  return segments;
}

export function getPath(root: unknown, path: string): unknown {
  const segments = splitPath(path);
  if (!segments) return undefined;
  let current: unknown = root;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as JsonObject)[segment];
  }
  return current;
}

/**
 * Sets `value` at `path`, creating intermediate containers: an array when the next segment is `0`
 * (`damage.0.dice`), an object otherwise (`spellSlotsByLevel.3.total`). Returns `false` for an unsafe path.
 */
export function setPath(root: JsonObject, path: string, value: unknown): boolean {
  const segments = splitPath(path);
  if (!segments) return false;
  let current: JsonObject | unknown[] = root;
  segments.slice(0, -1).forEach((segment, i) => {
    const container = current as Record<string, unknown>;
    const next = container[segment];
    if (typeof next !== "object" || next === null) {
      container[segment] = segments[i + 1] === "0" ? [] : {};
    }
    current = container[segment] as JsonObject | unknown[];
  });
  (current as Record<string, unknown>)[segments[segments.length - 1]] = value;
  return true;
}

export function deletePath(root: JsonObject, path: string): void {
  const segments = splitPath(path);
  if (!segments) return;
  let current: unknown = root;
  for (const segment of segments.slice(0, -1)) {
    if (!isPlainObject(current)) return;
    current = current[segment];
  }
  if (isPlainObject(current)) delete current[segments[segments.length - 1]];
}

/** Deep copy of JSON data. */
export function cloneJson<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

export function jsonEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
