import { describe, expect, it, vi, afterEach } from "vitest";
import {
  flushPendingInitiativeInputs,
  registerInitiativeInputFlush,
} from "@/lib/flushPendingInitiativeInputs";
import { parseInitiativeRollText } from "@/components/initiativeTracker/useInitiativeTextInput";

/** @see FR-tracker-initiative-modifier-display */
describe("FR-tracker-initiative-modifier-display — flushPendingInitiativeInputs", () => {
  afterEach(() => {
    flushPendingInitiativeInputs();
  });

  it("nominal: runs all registered flushers", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unregisterFirst = registerInitiativeInputFlush(first);
    const unregisterSecond = registerInitiativeInputFlush(second);

    flushPendingInitiativeInputs();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unregisterFirst();
    unregisterSecond();
  });

  it("edge: unregistered flushers are not called", () => {
    const flusher = vi.fn();
    const unregister = registerInitiativeInputFlush(flusher);
    unregister();

    flushPendingInitiativeInputs();

    expect(flusher).not.toHaveBeenCalled();
  });

  it("failure: empty registry is a no-op", () => {
    expect(() => flushPendingInitiativeInputs()).not.toThrow();
  });
});

describe("FR-tracker-initiative-modifier-display — parseInitiativeRollText", () => {
  it("nominal: parses integer rolls", () => {
    expect(parseInitiativeRollText("15")).toBe(15);
    expect(parseInitiativeRollText("-3")).toBe(-3);
  });

  it("edge: incomplete values stay pending", () => {
    expect(parseInitiativeRollText("")).toBeNull();
    expect(parseInitiativeRollText("-")).toBeNull();
    expect(parseInitiativeRollText("+")).toBeNull();
  });

  it("failure: non-numeric text is rejected", () => {
    expect(parseInitiativeRollText("abc")).toBeNull();
  });
});
