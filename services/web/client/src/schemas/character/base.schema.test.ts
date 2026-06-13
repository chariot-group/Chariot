import { describe, expect, it } from "vitest";
import { makeZodMessages } from "@/lib/zodErrorMap";
import { SpellcastingSchema } from "@/schemas/character/base.schema";

const messages: Record<string, string> = {
  invalidOption: "Option traduite invalide",
};

const zm = makeZodMessages((key) => messages[key] ?? key);

describe("SpellcastingSchema", () => {
  it("normalizes localized spell effect type labels before validation", () => {
    const result = SpellcastingSchema(zm).parse({
      spells: [{ name: "Lumiere", effectType: "Utilitaire" }],
    });

    expect(result.spells?.[0]?.effectType).toBe("utility");
  });

  it("returns the translated message for invalid spell effect type options", () => {
    const result = SpellcastingSchema(zm).safeParse({
      spells: [{ name: "Lumiere", effectType: "invalid" }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Option traduite invalide");
  });
});
