/**
 * Page shown before the character builder was opened (an existing character, a group…), kept in the session so
 * « Cancel » in the builder or in the Player form it opens returns there. The browser history is not reliable for
 * this: a full load of the builder (reload, SSO round trip) adds entries pointing back to the builder.
 * @see FR-ruleset-character-builder — Web builder UI (End of the builder)
 */

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const BUILDER_RETURN_KEY = "chariot:character-builder:return";

/** Same-origin path that is not a creation page (never return to the builder or a creation form). */
export function isBuilderReturnPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !/\/characters\/new(\/|$|\?)/.test(path)
  );
}

export function saveBuilderReturnPath(storage: StorageLike | undefined, path: string) {
  try {
    if (isBuilderReturnPath(path)) storage?.setItem(BUILDER_RETURN_KEY, path);
    else storage?.removeItem(BUILDER_RETURN_KEY);
  } catch {
    // Storage unavailable: « Cancel » falls back to the default destination.
  }
}

/** Reads and clears the saved page (one use). */
export function takeBuilderReturnPath(storage: StorageLike | undefined): string | null {
  try {
    const path = storage?.getItem(BUILDER_RETURN_KEY) ?? null;
    storage?.removeItem(BUILDER_RETURN_KEY);
    return isBuilderReturnPath(path) ? path : null;
  } catch {
    return null;
  }
}
