import { describe, expect, it } from "vitest";
import { MOBILE_BREAKPOINT, TABLET_BREAKPOINT } from "@/hooks/use-mobile";

describe("sidebar overflow menu breakpoints", () => {
  it("uses md breakpoint for mobile sidebar overlay", () => {
    expect(MOBILE_BREAKPOINT).toBe(768);
  });

  it("uses lg breakpoint for overflow menu on phone and tablet", () => {
    expect(TABLET_BREAKPOINT).toBe(1024);
  });
});
