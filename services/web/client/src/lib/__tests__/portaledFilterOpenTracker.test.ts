import { describe, expect, it } from "vitest";
import {
  createPortaledFilterOpenTracker,
  isPortaledFilterInteractionTarget,
  shouldPreventDialogDismissForPortaledFilter,
} from "@/lib/portaledFilterOpenTracker";

describe("createPortaledFilterOpenTracker", () => {
  it("nominal: reports open while a portaled filter is open", () => {
    const tracker = createPortaledFilterOpenTracker();

    tracker.notifyOpenChange(true);
    expect(tracker.hasOpen()).toBe(true);
  });

  it("edge: keeps open count until the close microtask runs", async () => {
    const tracker = createPortaledFilterOpenTracker();

    tracker.notifyOpenChange(true);
    tracker.notifyOpenChange(false);

    expect(tracker.hasOpen()).toBe(true);

    await Promise.resolve();
    expect(tracker.hasOpen()).toBe(false);
  });

  it("edge: supports multiple nested/open filters", async () => {
    const tracker = createPortaledFilterOpenTracker();

    tracker.notifyOpenChange(true);
    tracker.notifyOpenChange(true);
    tracker.notifyOpenChange(false);

    await Promise.resolve();
    expect(tracker.hasOpen()).toBe(true);

    tracker.notifyOpenChange(false);
    await Promise.resolve();
    expect(tracker.hasOpen()).toBe(false);
  });

  it("reset clears the open count immediately", async () => {
    const tracker = createPortaledFilterOpenTracker();

    tracker.notifyOpenChange(true);
    tracker.reset();

    expect(tracker.hasOpen()).toBe(false);

    await Promise.resolve();
    expect(tracker.hasOpen()).toBe(false);
  });
});

describe("shouldPreventDialogDismissForPortaledFilter", () => {
  it("nominal: prevents dismiss when tracker reports an open filter", () => {
    const tracker = createPortaledFilterOpenTracker();
    tracker.notifyOpenChange(true);

    expect(shouldPreventDialogDismissForPortaledFilter(tracker, null)).toBe(true);
  });

  it("edge: prevents dismiss when the event target is portaled filter content", () => {
    const tracker = createPortaledFilterOpenTracker();
    const target = {
      closest: (selector: string) => (selector.includes("select-content") ? target : null),
    };

    expect(shouldPreventDialogDismissForPortaledFilter(tracker, target as EventTarget)).toBe(true);
  });

  it("failure: allows dismiss when no filter is open and target is unrelated", () => {
    const tracker = createPortaledFilterOpenTracker();
    const target = {
      closest: () => null,
    };

    expect(shouldPreventDialogDismissForPortaledFilter(tracker, target as EventTarget)).toBe(false);
  });
});

describe("isPortaledFilterInteractionTarget", () => {
  it("returns false for null targets", () => {
    expect(isPortaledFilterInteractionTarget(null)).toBe(false);
  });
});
