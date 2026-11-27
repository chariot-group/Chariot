import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUILDER_RETURN_KEY,
  isBuilderReturnPath,
  saveBuilderReturnPath,
  takeBuilderReturnPath,
} from "@/lib/characterBuilder/builderReturn";

/**
 * « Cancel » in the builder or in the Player form it opens returns to the page shown when the builder was opened,
 * whatever the browser history.
 * @see FR-ruleset-character-builder — Web builder UI (End of the builder)
 */

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
};

describe("builder return page", () => {
  it("nominal: the page shown when opening the builder is returned once", () => {
    const storage = memoryStorage();
    saveBuilderReturnPath(storage, "/fr/characters/abc?tab=magic");

    expect(takeBuilderReturnPath(storage)).toBe("/fr/characters/abc?tab=magic");
    expect(takeBuilderReturnPath(storage)).toBeNull();
  });

  it("edge: a creation page is never saved (no return to the builder or a form)", () => {
    const storage = memoryStorage();
    storage.setItem(BUILDER_RETURN_KEY, "/fr/characters/old");
    saveBuilderReturnPath(storage, "/fr/characters/new/builder");

    expect(takeBuilderReturnPath(storage)).toBeNull();
    expect(isBuilderReturnPath("/campaigns/c1/groups/g1/characters/new/players?fromBuilder=1")).toBe(false);
    expect(isBuilderReturnPath("/campaigns/c1")).toBe(true);
  });

  it("failure guard: foreign or malformed paths and storage errors are ignored", () => {
    const storage = memoryStorage();
    storage.setItem(BUILDER_RETURN_KEY, "//evil.example/x");
    expect(takeBuilderReturnPath(storage)).toBeNull();
    expect(isBuilderReturnPath("https://evil.example")).toBe(false);

    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => saveBuilderReturnPath(throwing, "/fr/characters/abc")).not.toThrow();
    expect(takeBuilderReturnPath(throwing)).toBeNull();
  });

  it("failure guard: the form cancel opened by the builder uses the saved page, never the history", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../../components/character/CharacterFormView.tsx"), "utf8");
    const cancel = source.slice(
      source.indexOf("const handleCancel = useCallback"),
      source.indexOf("const handleInvalid"),
    );

    expect(cancel).toContain("if (fromBuilder)");
    expect(cancel).toContain("router.replace(takeBuilderReturnPath(window.sessionStorage) ?? fallback)");
    expect(cancel.indexOf("if (fromBuilder)")).toBeLessThan(cancel.indexOf("router.back()"));
  });
});
