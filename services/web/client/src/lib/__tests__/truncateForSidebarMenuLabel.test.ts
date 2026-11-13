import { describe, expect, it } from "vitest";
import { TOAST_EMBEDDED_NAME_MAX_LENGTH, truncateForSidebarMenuLabel } from "@/lib/truncateForSidebarMenuLabel";

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

  it("toast nominal: campaign name at the toast limit is kept whole (trimmed)", () => {
    const name = "a".repeat(TOAST_EMBEDDED_NAME_MAX_LENGTH);
    expect(truncateForSidebarMenuLabel(`  ${name}  `, TOAST_EMBEDDED_NAME_MAX_LENGTH)).toBe(name);
  });

  it("toast edge: name one char over the toast limit ends with an ellipsis within the limit", () => {
    const result = truncateForSidebarMenuLabel(
      "b".repeat(TOAST_EMBEDDED_NAME_MAX_LENGTH + 1),
      TOAST_EMBEDDED_NAME_MAX_LENGTH,
    );
    expect(result).toHaveLength(TOAST_EMBEDDED_NAME_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
  });
});
