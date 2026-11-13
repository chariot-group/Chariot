import type { FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import StatisticsUpdate from "@/components/character/tabContents/shared/StatisticsUpdate";
import { ids, labelledBy } from "@/components/character/tabContents/__tests__/bentoMarkup";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ info: vi.fn() }) }));
vi.mock("@/hooks/useDistanceUnit", () => ({
  useDistanceUnit: () => ({ displayFt: (v: number) => v, toFeet: (v: number) => v, unitLabel: "m" }),
}));

const renderStats = (values: FieldValues) =>
  render(
    <WithForm values={values}>
      {(form) => (
        <StatisticsUpdate
          accentColor="text-blue"
          form={form}
        />
      )}
    </WithForm>,
  );

const GROUPS = ["stats-speeds-heading-edit", "stats-hp-heading-edit"];

/** @see FR-character-general-bento-layout (Statistics edit groups) */
describe("StatisticsUpdate — field families", () => {
  it("nominal: each field family is a labelled group, in reading order", () => {
    const html = renderStats({ stats: { armorClass: 13 }, class: [{ name: "Wizard", level: 3, hitDice: 6 }] });
    const positions = GROUPS.map((id) => html.indexOf(`role="group" aria-labelledby="${id}"`));

    expect(positions.every((pos) => pos > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("edge: speeds and hit points titles sit centred in a divider; hit dice belong to the hit points family", () => {
    const html = renderStats({ stats: {}, class: [{ name: "Wizard", level: 3, hitDice: 6 }] });

    for (const id of GROUPS) {
      expect(html).toMatch(
        new RegExp(
          `<span aria-hidden="true" class="h-px flex-1 bg-border"></span><h3 id="${id}"[^]*?</h3><span aria-hidden="true" class="h-px flex-1 bg-border">`,
        ),
      );
    }
    expect(html).not.toContain("stats-defense-heading-edit");
    expect(html.indexOf("hitPointsRoll")).toBeGreaterThan(html.indexOf('aria-labelledby="stats-hp-heading-edit"'));
  });

  it("failure: every group label resolves to a heading id rendered once", () => {
    const html = renderStats({ stats: {}, class: [] });
    const all = ids(html);

    for (const id of GROUPS) {
      expect(labelledBy(html)).toContain(id);
      expect(all.filter((x) => x === id)).toHaveLength(1);
    }
  });

  it("nominal: multiclass shows a class selector and the first class's hit dice only", () => {
    const html = renderStats({
      stats: {},
      class: [
        { name: "Wizard", level: 2, hitDice: 6 },
        { name: "Fighter", level: 1, hitDice: 10 },
      ],
    });

    expect(html).toContain('aria-label="classSelector"');
    expect(html.match(/aria-pressed="(true|false)"/g)).toEqual(['aria-pressed="true"', 'aria-pressed="false"']);
    expect(html).toContain('id="class-0-hitdice"');
    expect(html).not.toContain('id="class-1-hitdice"');
  });

  it("edge: a single class shows its hit dice without a selector", () => {
    const html = renderStats({ stats: {}, class: [{ name: "Wizard", level: 3, hitDice: 6 }] });

    expect(html).not.toContain('aria-label="classSelector"');
    expect(html).toContain('id="class-0-hitdice"');
  });

  it("edge: an unset hit die shows the placeholder, not an empty value", () => {
    const html = renderStats({ stats: {}, class: [{ name: "Fighter", level: 1, hitDice: 0 }] });
    const trigger = html.match(/id="class-0-hitdice"[^]*?<\/button>/)?.[0] ?? "";

    expect(trigger).toContain(">hitDice<");
  });
});
