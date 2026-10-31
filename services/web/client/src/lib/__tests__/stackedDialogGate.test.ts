import { describe, expect, it } from "vitest";
import { createStackedDialogGate, hasForeignDialogOpen } from "@/lib/stackedDialogGate";

function fakeRoot(initial: boolean) {
  const state = { foreignOpen: initial };
  return { state, root: { querySelector: () => (state.foreignOpen ? ({} as Element) : null) } };
}

describe("FR-codex-share-link-preselection — stacked dialog gate", () => {
  it("nominal: ignores a dismiss while another dialog is open", () => {
    const { root } = fakeRoot(true);
    const gate = createStackedDialogGate(root);
    gate.snapshot();
    expect(gate.shouldIgnoreDismiss()).toBe(true);
  });

  it("edge: still ignores the gesture after the other dialog unmounted mid-event", () => {
    const { state, root } = fakeRoot(true);
    const gate = createStackedDialogGate(root);
    gate.snapshot();
    state.foreignOpen = false;
    expect(gate.shouldIgnoreDismiss()).toBe(true);
  });

  it("edge: a new gesture with no other dialog is not ignored", () => {
    const { state, root } = fakeRoot(true);
    const gate = createStackedDialogGate(root);
    gate.snapshot();
    state.foreignOpen = false;
    gate.snapshot();
    expect(gate.shouldIgnoreDismiss()).toBe(false);
  });

  it("guard: no other dialog means no foreign dialog", () => {
    expect(hasForeignDialogOpen(fakeRoot(false).root)).toBe(false);
  });
});
