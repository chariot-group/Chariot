import { describe, expect, it, vi } from "vitest";
import StatsSummary from "@/components/character/tabContents/shared/StatsSummary";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";

const { unitState } = vi.hoisted(() => ({ unitState: { showBoth: false } }));

vi.mock("@/hooks/useDistanceUnit", () => ({
  useDistanceUnit: () => ({
    displayFt: (ft: number) => `${(ft * 0.3).toFixed(1).replace(/\.0$/, "")}`,
    unitLabel: "m",
    secondaryFt: unitState.showBoth ? (ft: number) => `${ft}` : null,
    secondaryUnitLabel: unitState.showBoth ? "ft" : null,
  }),
}));

const renderSummary = (speed: Record<string, number>, showBoth = false) => {
  unitState.showBoth = showBoth;
  return render(
    <StatsSummary
      armorClass={15}
      initiative={2}
      size="Medium"
      speed={speed}
    />,
  );
};

/** @see FR-character-statistics-card */
describe("StatsSummary", () => {
  it("nominal: three key stat cells with visible labels and one speed line with non-zero speeds", () => {
    const html = renderSummary({ walk: 30, climb: 15, swim: 0, fly: 0, burrow: 0 });
    const cells = html.match(/role="group" aria-label="[^"]+"/g) ?? [];

    expect(cells).toEqual([
      'role="group" aria-label="armorClass 15"',
      'role="group" aria-label="initiativeTooltip +2"',
      'role="group" aria-label="sizeTooltip sizes.Medium"',
    ]);
    expect(html).toContain("statLabels.armorClass");
    expect(html).toContain("statLabels.speeds");
    expect(html).toContain('aria-label="walkSpeedTooltip 9 m"');
    expect(html).toContain('aria-label="climbSpeedTooltip 4.5 m"');
    expect(html).not.toContain("swimSpeedTooltip");
  });

  it("edge: no speed line when every speed is 0; secondary unit shown when both units are enabled", () => {
    expect(renderSummary({ walk: 0, climb: 0, swim: 0, fly: 0, burrow: 0 })).not.toContain("statLabels.speeds");
    expect(renderSummary({ walk: 30 }, true)).toContain('aria-label="walkSpeedTooltip 9 m (30 ft)"');
  });

  it("nominal: NPC General tab adds a 4th passive perception cell (2 × 2, one row from sm)", () => {
    const html = render(
      <StatsSummary
        armorClass={15}
        initiative={2}
        size="Medium"
        speed={{ walk: 30 }}
        passivePerception={14}
      />,
    );
    const cells = html.match(/role="group" aria-label="[^"]+"/g) ?? [];

    expect(cells).toHaveLength(4);
    expect(cells[3]).toBe('role="group" aria-label="passivePerception 14"');
    expect(html).toContain("statLabels.passivePerception");
    expect(html).toContain("grid-cols-2 sm:grid-cols-4");
  });

  it("edge: passive perception 0 is still shown; without the prop the row keeps three cells", () => {
    const withZero = render(
      <StatsSummary
        armorClass={10}
        initiative={0}
        size="Small"
        passivePerception={0}
      />,
    );

    expect(withZero).toContain('aria-label="passivePerception 0"');
    expect(renderSummary({ walk: 30 })).toContain("grid min-w-0 gap-2 grid-cols-3");
    expect(renderSummary({ walk: 30 })).not.toContain("statLabels.passivePerception");
  });

  it("failure: no white pill and no '?' tooltip button", () => {
    const html = renderSummary({ walk: 30 });

    expect(html).not.toContain("bg-white");
    expect(html).not.toContain(">?<");
    expect(html).not.toContain("<button");
  });
});
