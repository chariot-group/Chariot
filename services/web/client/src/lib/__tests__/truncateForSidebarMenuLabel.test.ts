import { describe, expect, it } from "vitest";
import { truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";

/** @see FR-sidebar-npc-link */
describe("truncateForSidebarMenuLabel", () => {
  it("nominal: leaves short names unchanged", () => {
    expect(truncateForSidebarMenuLabel("Aragorn")).toBe("Aragorn");
  });

  it("edge: truncates long names with ellipsis", () => {
    const long = "Jean-Baptiste de la Rochefoucauld";
    const result = truncateForSidebarMenuLabel(long, 12);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(12);
  });
});
