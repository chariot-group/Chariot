import type { FieldValues, UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import StatisticsUpdate from "@/components/character/tabContents/shared/StatisticsUpdate";
import NpcStatisticsUpdate from "@/components/character/tabContents/shared/NpcStatisticsUpdate";
import { render, WithForm } from "@/components/character/tabContents/__tests__/bentoRender";

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ info: vi.fn() }) }));
/** Props of each rendered quick calculator, keyed by input id (the real one needs a DOM to interact). */
const calculators = new Map<string, { min?: number; onValueChange: (value: number) => void }>();
vi.mock("@/components/ui/quick-number-calculator", () => ({
  QuickNumberCalculator: (props: { min?: number; onValueChange: (value: number) => void; inputProps?: { id?: string } }) => {
    if (props.inputProps?.id) calculators.set(props.inputProps.id, props);
    return <input id={props.inputProps?.id} />;
  },
}));
vi.mock("@/hooks/useDistanceUnit", () => ({
  useDistanceUnit: () => ({ displayFt: (v: number) => v, toFeet: (v: number) => v, unitLabel: "m" }),
}));

const FORMS = [
  ["PC", StatisticsUpdate],
  ["NPC", NpcStatisticsUpdate],
] as const;

let form: UseFormReturn<FieldValues>;

const renderForm = (Component: (typeof FORMS)[number][1], values: FieldValues) =>
  render(
    <WithForm values={values}>
      {(f) => (form = f) && (
        <Component
          accentColor="text-blue"
          form={form}
        />
      )}
    </WithForm>,
  );

const maxField = () => calculators.get("health-max")!;

/** @see FR-character-statistics-card (edit mode — hit points fields) */
describe.each(FORMS)("%s statistics edit — hit points fields", (_, Component) => {
  it("nominal: current, max then temporary HP, in reading and tab order", () => {
    const html = renderForm(Component, { stats: { currentHitPoints: 10, maxHitPoints: 10 }, class: [] });
    const positions = ["health-current", "health-max", "health-temp"].map((id) => html.indexOf(`id="${id}"`));

    expect(positions.every((pos) => pos > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html.indexOf('for="health-current"')).toBeLessThan(html.indexOf('for="health-max"'));
  });

  it("edge: at full health, typing a lower then higher max carries current along (10 / 10 → 4 → 45)", () => {
    renderForm(Component, { stats: { currentHitPoints: 10, maxHitPoints: 10 }, class: [] });

    expect(maxField().min).toBe(0);
    maxField().onValueChange(4);
    maxField().onValueChange(45);

    expect(form.getValues("stats")).toMatchObject({ currentHitPoints: 45, maxHitPoints: 45 });
  });

  it("edge: an empty current takes the new max", () => {
    renderForm(Component, { stats: { maxHitPoints: 10 }, class: [] });

    maxField().onValueChange(30);

    expect(form.getValues("stats.currentHitPoints")).toBe(30);
  });

  it("failure: a wounded character keeps its current HP and max cannot go below it", () => {
    renderForm(Component, { stats: { currentHitPoints: 7, maxHitPoints: 10 }, class: [] });

    expect(maxField().min).toBe(7);
    maxField().onValueChange(45);

    expect(form.getValues("stats")).toMatchObject({ currentHitPoints: 7, maxHitPoints: 45 });
  });
});
