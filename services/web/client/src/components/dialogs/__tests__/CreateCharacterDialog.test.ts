import { describe, expect, it } from "vitest";
import {
  CHARACTER_TYPE_OPTION_ICON_WRAPPER,
  getCharacterTypeOptionClasses,
} from "@/components/dialogs/createCharacterDialogStyles";

describe("CreateCharacterDialog — createCharacterDialogStyles", () => {
  it("nominal: enabled option uses project card surface and neutral hover", () => {
    const classes = getCharacterTypeOptionClasses();

    expect(classes).toContain("bg-gray-middle-light/90");
    expect(classes).toContain("rounded-[12px]");
    expect(classes).toContain("hover:border-white/25");
    expect(classes).toContain("hover:bg-gray-middle-light");
    expect(classes).toContain("hover:-translate-y-0.5");
  });

  it("edge: disabled option removes hover affordances", () => {
    const classes = getCharacterTypeOptionClasses(true);

    expect(classes).toContain("opacity-50");
    expect(classes).toContain("pointer-events-none");
    expect(classes).not.toContain("hover:border-primary/55");
  });

  it("nominal: icon wrapper reacts on group hover", () => {
    expect(CHARACTER_TYPE_OPTION_ICON_WRAPPER).toContain("group-hover:ring-white/20");
    expect(CHARACTER_TYPE_OPTION_ICON_WRAPPER).toContain("group-hover:scale-105");
  });
});
