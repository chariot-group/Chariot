import { describe, expect, it } from "vitest";
import {
  CREATE_CHARACTER_LIBRARY_STRIP,
  getManualCharacterButtonClasses,
} from "@/components/dialogs/createCharacterDialogStyles";

describe("CreateCharacterDialog — createCharacterDialogStyles", () => {
  it("nominal: manual player button uses compact outline styling", () => {
    const classes = getManualCharacterButtonClasses("player");

    expect(classes).toContain("rounded-[12px]");
    expect(classes).toContain("hover:border-blue/40");
    expect(classes).toContain("py-3.5");
  });

  it("nominal: manual npc button uses pink hover accent", () => {
    const classes = getManualCharacterButtonClasses("npc");

    expect(classes).toContain("hover:border-pink/40");
  });

  it("nominal: library strip stacks content vertically", () => {
    expect(CREATE_CHARACTER_LIBRARY_STRIP).toContain("bg-gray-middle-light/90");
    expect(CREATE_CHARACTER_LIBRARY_STRIP).toContain("flex-col");
    expect(CREATE_CHARACTER_LIBRARY_STRIP).toContain("rounded-[12px]");
  });
});
