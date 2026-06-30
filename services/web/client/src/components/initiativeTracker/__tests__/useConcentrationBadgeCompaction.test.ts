import { describe, expect, it } from "vitest";
import {
  CONCENTRATION_BADGE_COMPACTION_LEVELS,
  shouldCompactConcentrationBadge,
} from "@/components/initiativeTracker/useConcentrationBadgeCompaction";

describe("FR-tracker-concentration — useConcentrationBadgeCompaction", () => {
  it("nominal: defines progressive compaction presets from verbose to minimal", () => {
    expect(CONCENTRATION_BADGE_COMPACTION_LEVELS[0]).toEqual({
      labelMode: "full",
      showInfo: true,
      showDrop: true,
      showPendingLabel: true,
    });
    expect(CONCENTRATION_BADGE_COMPACTION_LEVELS.at(-1)).toEqual({
      labelMode: "short",
      showInfo: false,
      showDrop: false,
      showPendingLabel: false,
    });
  });

  it("edge: compacts when the natural badge width exceeds the slot", () => {
    const slot = { clientWidth: 48 };
    const shell = { parentElement: slot };
    const badge = {
      scrollWidth: 112,
      clientWidth: 48,
      closest: (selector: string) =>
        selector === "[data-concentration-badge-slot]" ? shell : null,
      querySelector: () => null,
    } as unknown as HTMLElement;

    expect(shouldCompactConcentrationBadge(badge, 0)).toBe(true);
    expect(shouldCompactConcentrationBadge(badge, CONCENTRATION_BADGE_COMPACTION_LEVELS.length - 1)).toBe(false);
  });

  it("failure: info is never paired with the short label preset", () => {
    const hasShortWithInfo = CONCENTRATION_BADGE_COMPACTION_LEVELS.some(
      (preset) => preset.labelMode === "short" && preset.showInfo,
    );
    expect(hasShortWithInfo).toBe(false);
  });
});
