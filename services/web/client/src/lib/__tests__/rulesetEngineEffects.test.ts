import { describe, expect, it } from "vitest";
import { applyEffect, replaceKeyPlaceholder } from "@/lib/rulesetEngine/effects";
import { evaluateExpression, findForbiddenOperator } from "@/lib/rulesetEngine/expressions";
import { setPath } from "@/lib/rulesetEngine/paths";

describe("applyEffect — FR-ruleset-character-builder (effects)", () => {
  it("nominal: add sums numbers, set replaces, grant appends missing keys only", () => {
    const state: Record<string, unknown> = {};
    applyEffect(state, { op: "add", target: "bonus.dex", value: 2 });
    applyEffect(state, { op: "add", target: "bonus.dex", value: 1 });
    applyEffect(state, { op: "set", target: "size", value: "Small" });
    applyEffect(state, { op: "grant", target: "languages", value: ["common", "elvish"] });
    applyEffect(state, { op: "grant", target: "languages", value: ["elvish", "giant"] });

    expect(state).toEqual({ bonus: { dex: 3 }, size: "Small", languages: ["common", "elvish", "giant"] });
  });

  it("edge: remove takes keys out of a list or deletes the target; grant deduplicates objects", () => {
    const state: Record<string, unknown> = { languages: ["common", "orc"], speed: { walk: 30 } };
    applyEffect(state, { op: "remove", target: "languages", value: ["orc"] });
    applyEffect(state, { op: "remove", target: "speed.walk" });
    applyEffect(state, { op: "grant", target: "items", value: [{ key: "rope", quantity: 1 }] });
    applyEffect(state, { op: "grant", target: "items", value: [{ key: "rope", quantity: 1 }] });

    expect(state).toEqual({ languages: ["common"], speed: {}, items: [{ key: "rope", quantity: 1 }] });
  });

  it("edge: {key} is replaced in targets and values", () => {
    expect(replaceKeyPlaceholder([{ op: "set", target: "skills.{key}", value: "{key}" }], "stealth")).toEqual([
      { op: "set", target: "skills.stealth", value: "stealth" },
    ]);
  });

  it("failure: unsafe paths and incompatible additions are refused", () => {
    const state: Record<string, unknown> = { size: "Small" };

    expect(applyEffect(state, { op: "set", target: "__proto__.polluted", value: true })).toBe(false);
    expect(applyEffect(state, { op: "add", target: "size", value: 1 })).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(state).toEqual({ size: "Small" });
  });
});

describe("setPath — FR-ruleset-character-builder (collection item paths)", () => {
  it("nominal: a segment 0 creates an array, other segments objects", () => {
    const target: Record<string, unknown> = {};
    setPath(target, "damage.0.dice", "1d8");
    setPath(target, "damage.0.type", "piercing");
    setPath(target, "uses.max", 2);

    expect(target).toEqual({ damage: [{ dice: "1d8", type: "piercing" }], uses: { max: 2 } });
  });

  it("edge: a numeric segment other than 0 keeps an object keyed by number (slots by spell level)", () => {
    const target: Record<string, unknown> = {};
    setPath(target, "spellSlotsByLevel.1.total", 4);
    setPath(target, "spellSlotsByLevel.3.total", 2);

    expect(target).toEqual({ spellSlotsByLevel: { "1": { total: 4 }, "3": { total: 2 } } });
  });

  it("failure: an unsafe or empty segment is refused", () => {
    expect(setPath({}, "a..b", 1)).toBe(false);
    expect(setPath({}, "constructor.prototype.x", 1)).toBe(false);
  });
});

describe("evaluateExpression — FR-ruleset-character-builder (logic and expressions)", () => {
  it("nominal: evaluates standard JSON Logic and returns literals as is", () => {
    expect(evaluateExpression({ "+": [{ var: "a" }, 2] }, { a: 3 })).toEqual({ ok: true, value: 5 });
    expect(evaluateExpression("Medium", {})).toEqual({ ok: true, value: "Medium" });
  });

  it("edge: reads nested operators inside arrays", () => {
    expect(findForbiddenOperator({ if: [true, [{ log: 1 }], 0] })).toBe("log");
    expect(findForbiddenOperator({ max: [1, { var: "x" }] })).toBeUndefined();
  });

  it("failure: forbidden operators and non-finite numbers are errors, not exceptions", () => {
    expect(evaluateExpression({ log: "x" }, {})).toMatchObject({ ok: false });
    expect(evaluateExpression({ "/": [1, 0] }, {})).toMatchObject({ ok: false });
    expect(evaluateExpression({ unknownOp: [1] }, {})).toMatchObject({ ok: false });
  });
});
