import { describe, expect, it } from "vitest";
import {
  menuItemClassName,
  menuItemDestructiveClassName,
  menuItemIconClassName,
} from "@/components/ui/menu-styles";
import { cn } from "@/lib/utils";

const destructiveRow = cn(menuItemClassName, menuItemIconClassName, menuItemDestructiveClassName);
const defaultRow = cn(menuItemClassName, menuItemIconClassName);

describe("menu-styles — destructive row icon color", () => {
  it("colors every icon of a destructive row like its text, even when wrapped (sidebar actions)", () => {
    expect(destructiveRow).toContain("text-destructive");
    expect(destructiveRow).toContain("[&_svg]:!text-destructive");
  });

  it("does not only target direct svg children, which misses icons wrapped in a span", () => {
    expect(menuItemDestructiveClassName).not.toContain("*:[svg]");
  });

  it("keeps the muted icon color on non-destructive rows", () => {
    expect(defaultRow).toContain("[&_svg:not([class*='text-'])]:text-white/60");
    expect(defaultRow).not.toContain("text-destructive");
  });
});
