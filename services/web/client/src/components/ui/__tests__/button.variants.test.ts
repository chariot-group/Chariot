import { describe, expect, it } from "vitest";
import { buttonVariants, toggleButtonPressedClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const classes = (value: string) => value.split(/\s+/);

/** @see FR-frontend-button-system */
describe("Button variants — types", () => {
  it("nominal: primary is a white fill with dark text that gets slightly darker on hover", () => {
    const primary = classes(buttonVariants({ variant: "primary" }));

    expect(primary).toEqual(expect.arrayContaining(["bg-white", "text-black", "hover:bg-gray-300"]));
  });

  it("nominal: secondary is a dark fill with light text that gets lighter on hover", () => {
    const secondary = classes(buttonVariants({ variant: "secondary" }));

    expect(secondary).toEqual(expect.arrayContaining(["bg-gray-middle-light", "text-white", "hover:bg-gray"]));
  });

  it("nominal: the default button is the violet accent with light text and a lighter hover", () => {
    const fallback = classes(buttonVariants());

    expect(fallback).toEqual(
      expect.arrayContaining(["bg-primary", "text-primary-foreground", "hover:bg-primary-hover"]),
    );
  });

  it.each(["blue", "red", "pink", "yellow", "green"] as const)(
    "edge: accent %s uses dark text and its lighter hover token",
    (tone) => {
      const accent = classes(buttonVariants({ variant: "accent", tone }));

      expect(accent).toEqual(expect.arrayContaining([`bg-${tone}`, "text-black", `hover:bg-${tone}-hover`]));
      expect(accent).not.toContain("text-white");
    },
  );

  it("edge: tone has no effect outside the accent variant", () => {
    const secondary = classes(buttonVariants({ variant: "secondary", tone: "red" }));

    expect(secondary).not.toContain("bg-red");
    expect(secondary).toContain("bg-gray-middle-light");
  });

  it("edge: ghost (transparent) buttons hover in neutral gray, never violet", () => {
    const ghost = buttonVariants({ variant: "ghost", size: "icon" });

    expect(classes(ghost)).toContain("hover:bg-white/10");
    expect(ghost).not.toMatch(/hover:bg-(primary|accent|muted)/);
  });
});

describe("Button variants — sizes, shape and alignment", () => {
  it("nominal: three text sizes, large to small", () => {
    expect(classes(buttonVariants({ size: "lg" }))).toContain("h-12");
    expect(classes(buttonVariants({ size: "default" }))).toContain("h-9");
    expect(classes(buttonVariants({ size: "sm" }))).toContain("h-8");
  });

  it("edge: default and small sizes use the 13px radius, no pill shape", () => {
    for (const size of ["default", "sm", "icon", "icon-sm"] as const) {
      const value = buttonVariants({ size });

      expect(classes(value)).toContain("rounded-[13px]");
      expect(value).not.toMatch(/rounded-(md|full|2xl|\[15px\])/);
    }
  });

  it("edge: large sizes are slightly rounder (15px, merged over the base radius) with a larger label and icon", () => {
    for (const size of ["lg", "icon-lg"] as const) {
      const value = classes(buttonVariants({ size }));

      expect(value).toContain("rounded-[15px]");
      expect(value).not.toContain("rounded-[13px]");
      expect(value).toContain("[&_svg:not([class*='size-'])]:size-6");
    }
    expect(classes(buttonVariants({ size: "lg" }))).toContain("text-lg");
  });

  it("edge: content is centered by default and left-aligned with align=start", () => {
    expect(classes(buttonVariants())).toContain("justify-center");

    const start = classes(buttonVariants({ variant: "primary", align: "start" }));
    expect(start).toContain("justify-start");
    expect(start).not.toContain("justify-center");
  });

  it("edge: keyboard focus draws a visible ring", () => {
    expect(classes(buttonVariants({ variant: "primary" }))).toContain("focus-visible:ring-2");
  });
});

describe("Button variants — guards", () => {
  it("failure guard: disabled buttons reset every hover fill", () => {
    expect(classes(buttonVariants({ variant: "primary" }))).toContain("disabled:hover:bg-white");
    expect(classes(buttonVariants({ variant: "secondary" }))).toContain("disabled:hover:bg-gray-middle-light");
    expect(classes(buttonVariants({ variant: "accent", tone: "yellow" }))).toContain("disabled:hover:bg-yellow");
    expect(classes(buttonVariants())).toContain("disabled:hover:bg-primary");
  });

  it("failure guard: a pressed filter toggle uses the selection gray, not a violet fill", () => {
    const pressed = classes(cn(buttonVariants({ variant: "secondary" }), toggleButtonPressedClassName));

    expect(pressed).toEqual(expect.arrayContaining(["bg-white/15", "border-frame", "hover:bg-white/15"]));
    expect(pressed).not.toContain("bg-primary");
    expect(pressed).not.toContain("bg-gray-middle-light");
    expect(pressed).not.toContain("hover:bg-gray");
  });
});
