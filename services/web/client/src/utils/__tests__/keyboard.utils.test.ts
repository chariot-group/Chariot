import { describe, expect, it } from "vitest";
import { isModalOverlayOpen } from "@/utils/keyboard.utils";

type FakeAttrs = Record<string, string>;

class FakeElement {
  constructor(private readonly attrs: FakeAttrs = {}) { }

  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
}

class FakeRoot {
  constructor(private readonly elements: FakeElement[]) { }

  querySelectorAll(selector: string): FakeElement[] {
    void selector;
    return this.elements;
  }
}

/** @see FR-character-form-nested-escape: Character Form Escape vs Nested Dialogs */
describe("FR-character-form-nested-escape — isModalOverlayOpen", () => {
  it("nominal: returns false when no dialog is present (form Escape may cancel)", () => {
    const root = new FakeRoot([]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(false);
  });

  it("nominal: returns true for an open dialog (Codex / confirm must consume Escape)", () => {
    const root = new FakeRoot([new FakeElement({ role: "dialog", "data-state": "open" })]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(true);
  });

  it("edge: returns false for a closed dialog (data-state=closed)", () => {
    const root = new FakeRoot([new FakeElement({ role: "dialog", "data-state": "closed" })]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(false);
  });

  it("edge: returns false when dialog is aria-hidden", () => {
    const root = new FakeRoot([new FakeElement({ role: "dialog", "aria-hidden": "true" })]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(false);
  });

  it("edge: returns true for dialog-content slot without explicit closed state", () => {
    const root = new FakeRoot([new FakeElement({ "data-slot": "dialog-content", "data-state": "open" })]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(true);
  });

  it("failure/guard: returns true for alertdialog so form Escape does not run", () => {
    const root = new FakeRoot([new FakeElement({ role: "alertdialog" })]);
    expect(isModalOverlayOpen(root as unknown as ParentNode)).toBe(true);
  });
});
