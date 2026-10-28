import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";

/** @see FR-frontend-design — transparent buttons hover in neutral gray; violet stays on filled buttons */
describe("Button variants — hover surfaces", () => {
  it("nominal: ghost buttons (expand, sidebar trigger) hover in neutral gray", () => {
    const ghost = buttonVariants({ variant: "ghost", size: "icon" });

    expect(ghost).toContain("hover:bg-white/10");
    expect(ghost).not.toMatch(/hover:bg-(primary|accent|muted)/);
  });

  it("edge: outline keyboard focus uses gray, not the accent violet", () => {
    const outline = buttonVariants({ variant: "outline" });

    expect(outline).toContain("focus-visible:bg-white/10");
    expect(outline).not.toMatch(/bg-(accent|primary)\b/);
  });

  it("failure guard: the filled default button keeps its violet fill", () => {
    expect(buttonVariants()).toContain("bg-primary");
  });
});
