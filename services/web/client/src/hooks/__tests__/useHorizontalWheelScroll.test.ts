import { describe, expect, it } from "vitest";
import { getHorizontalWheelDelta } from "@/hooks/useHorizontalWheelScroll";

const overflowing = { scrollLeft: 50, scrollWidth: 600, clientWidth: 300 };
const wheel = (deltaY: number, overrides: Partial<Parameters<typeof getHorizontalWheelDelta>[1]> = {}) => ({
  deltaX: 0,
  deltaY,
  deltaMode: 0,
  shiftKey: false,
  ...overrides,
});

describe("getHorizontalWheelDelta", () => {
  it("nominal: a vertical wheel scrolls an overflowing tab bar horizontally", () => {
    expect(getHorizontalWheelDelta(overflowing, wheel(40))).toBe(40);
    expect(getHorizontalWheelDelta(overflowing, wheel(-40))).toBe(-40);
  });

  it("edge: line-based wheel deltas (Firefox) are converted to pixels", () => {
    expect(getHorizontalWheelDelta(overflowing, wheel(3, { deltaMode: 1 }))).toBe(48);
  });

  it("edge: at either end the wheel is left to the page", () => {
    expect(getHorizontalWheelDelta({ ...overflowing, scrollLeft: 0 }, wheel(-40))).toBe(0);
    expect(getHorizontalWheelDelta({ ...overflowing, scrollLeft: 300 }, wheel(40))).toBe(0);
  });

  it("guard: no conversion without overflow, for horizontal gestures or with Shift", () => {
    expect(getHorizontalWheelDelta({ scrollLeft: 0, scrollWidth: 300, clientWidth: 300 }, wheel(40))).toBe(0);
    expect(getHorizontalWheelDelta(overflowing, wheel(10, { deltaX: 30 }))).toBe(0);
    expect(getHorizontalWheelDelta(overflowing, wheel(40, { shiftKey: true }))).toBe(0);
  });
});
