import { describe, expect, it } from "vitest";
import { findNewIds, REVEAL_DURATION_MS } from "@/hooks/useNewlyRevealedRows";

describe("FR-032 — findNewIds (useNewlyRevealedRows core logic)", () => {
  it("nominal: returns IDs present in current but not in prev", () => {
    const prev = new Set(["a", "b"]);
    expect(findNewIds(prev, ["a", "b", "c"])).toEqual(["c"]);
  });

  it("nominal: returns empty array when no new IDs appear", () => {
    const prev = new Set(["a", "b"]);
    expect(findNewIds(prev, ["a", "b"])).toEqual([]);
  });

  it("nominal: returns all IDs when prev is empty (first reveal after mount)", () => {
    const prev = new Set<string>();
    expect(findNewIds(prev, ["x", "y"])).toEqual(["x", "y"]);
  });

  it("edge: IDs removed from current are not flagged as new", () => {
    const prev = new Set(["a", "b"]);
    expect(findNewIds(prev, ["a"])).toEqual([]);
  });

  it("edge: an ID re-added after removal is detected as new again", () => {
    const prevWithoutB = new Set(["a"]);
    expect(findNewIds(prevWithoutB, ["a", "b"])).toEqual(["b"]);
  });

  it("error: empty current list produces empty result without error", () => {
    const prev = new Set(["a"]);
    expect(findNewIds(prev, [])).toEqual([]);
  });

  it("nominal: REVEAL_DURATION_MS is 3000 ms as specified by FR-032", () => {
    expect(REVEAL_DURATION_MS).toBe(3000);
  });
});
