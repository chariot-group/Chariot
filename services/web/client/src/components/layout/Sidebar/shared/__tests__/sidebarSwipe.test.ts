import { describe, expect, it } from "vitest";

const OPEN_THRESHOLD = 48;

function resolveSwipeOpenState(finalOffset: number): "open" | "closed" {
  return finalOffset >= OPEN_THRESHOLD ? "open" : "closed";
}

describe("sidebar swipe threshold", () => {
  it("opens actions when swipe exceeds threshold", () => {
    expect(resolveSwipeOpenState(60)).toBe("open");
  });

  it("closes actions when swipe is below threshold", () => {
    expect(resolveSwipeOpenState(20)).toBe("closed");
  });

  it("opens exactly at threshold", () => {
    expect(resolveSwipeOpenState(48)).toBe("open");
  });
});
