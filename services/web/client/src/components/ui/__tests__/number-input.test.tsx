import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { computeSteppedValue, NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";

const stepInput = (value: string, { step = "", min = "", max = "" } = {}) => ({ value, step, min, max });

describe("NumberInput — stepper value", () => {
  it("nominal: increments and decrements by the step", () => {
    expect(computeSteppedValue(stepInput("4", { step: "2" }), "up")).toBe("6");
    expect(computeSteppedValue(stepInput("4", { step: "2" }), "down")).toBe("2");
  });

  it("edge: clamps to min and max", () => {
    expect(computeSteppedValue(stepInput("0", { min: "0" }), "down")).toBe("0");
    expect(computeSteppedValue(stepInput("20", { max: "20" }), "up")).toBe("20");
  });

  it("edge: keeps the decimal precision of the value or the step", () => {
    expect(computeSteppedValue(stepInput("1.5", { step: "0.1" }), "up")).toBe("1.6");
    expect(computeSteppedValue(stepInput("9.14"), "down")).toBe("8.14");
  });

  it("failure: falls back to step 1 and base 0 on invalid attributes or empty value", () => {
    expect(computeSteppedValue(stepInput("3", { step: "any" }), "up")).toBe("4");
    expect(computeSteppedValue(stepInput("", { step: "-2" }), "up")).toBe("1");
  });
});

describe("NumberInput — field frame", () => {
  it("nominal: icon, input, unit and stepper live in one frame that owns focus and invalid state", () => {
    const html = renderToStaticMarkup(
      <NumberInput
        id="speed"
        aria-invalid
        startAdornment={<svg data-testid="icon" />}
        endAdornment="m"
      />,
    );

    const frame = html.match(/<div data-slot="number-input"[^>]*>/)?.[0] ?? "";
    expect(frame).toContain("focus-within:border");
    expect(frame).toContain("has-[input[aria-invalid=true]]:border-destructive");
    expect(html.indexOf('data-slot="number-input-start"')).toBeLessThan(html.indexOf('id="speed"'));
    expect(html.indexOf('id="speed"')).toBeLessThan(html.indexOf('data-slot="number-input-end"'));
    expect(html.indexOf('data-slot="number-input-end"')).toBeLessThan(html.indexOf('data-slot="number-input-stepper"'));
    expect(html).toContain('aria-invalid="true"');
  });

  it("edge: stepper has no border or divider and stays out of the tab order", () => {
    const html = renderToStaticMarkup(<NumberInput aria-label="Level" />);
    const stepper = html.slice(html.indexOf('data-slot="number-input-stepper"'));

    expect(stepper).not.toContain("border-l");
    expect(stepper).not.toContain("h-px");
    expect(stepper.match(/tabindex="-1"/g)).toHaveLength(2);
    expect(html).not.toContain('data-slot="number-input-start"');
    expect(html).not.toContain('data-slot="number-input-end"');
  });

  it("failure: disabled field disables the input and both stepper buttons", () => {
    const html = renderToStaticMarkup(
      <NumberInput
        aria-label="Level"
        disabled
      />,
    );

    expect(html).toContain("data-disabled");
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });

  it("nominal: Input type=number delegates to NumberInput, other types stay native", () => {
    expect(renderToStaticMarkup(<Input type="number" />)).toContain('data-slot="number-input"');
    expect(renderToStaticMarkup(<Input type="text" />)).not.toContain('data-slot="number-input"');
  });
});
