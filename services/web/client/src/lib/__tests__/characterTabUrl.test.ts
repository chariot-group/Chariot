import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCharacterTabUrl, replaceCharacterTabInUrl } from "@/lib/characterTabUrl";

const location = (search = "", hash = "") => ({ pathname: "/fr/characters/abc", search, hash });

describe("buildCharacterTabUrl — FR-character-detail-view", () => {
  it("nominal: sets tab and keeps the other parameters", () => {
    expect(buildCharacterTabUrl(location("?session=XY12"), "magic")).toBe("/fr/characters/abc?session=XY12&tab=magic");
  });

  it("edge: replaces an existing tab and keeps the hash", () => {
    expect(buildCharacterTabUrl(location("?tab=general&mode=edit", "#spells"), "battle")).toBe(
      "/fr/characters/abc?tab=battle&mode=edit#spells",
    );
  });

  it("edge: no search string at all", () => {
    expect(buildCharacterTabUrl(location(), "history")).toBe("/fr/characters/abc?tab=history");
  });
});

describe("replaceCharacterTabInUrl — no router navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("guard: only calls history.replaceState, without Next's internal state (else useSearchParams is not synced)", () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    vi.stubGlobal("window", {
      location: location("?tab=general"),
      history: { state: { __NA: true }, replaceState, pushState },
    });

    replaceCharacterTabInUrl("inventory");

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, "", "/fr/characters/abc?tab=inventory");
    expect(pushState).not.toHaveBeenCalled();
  });
});
