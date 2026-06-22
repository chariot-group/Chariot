import { describe, expect, it } from "vitest";
import { makeZodMessages } from "@/lib/zodErrorMap";
import { AbilitySchema, SpellcastingSchema } from "@/schemas/character/base.schema";

const messages: Record<string, string> = {
  invalidOption: "Option traduite invalide",
  required: "Champ requis",
  abilityCounterOrder: "L'utilisation courante ne peut pas dépasser le plafond",
};

const zm = makeZodMessages((key) => messages[key] ?? key);

describe("AbilitySchema", () => {
  const schema = AbilitySchema(zm);

  it("accepts an empty counterMax while editing when hasCounter is true", () => {
    const result = schema.safeParse({
      name: "Second Wind",
      hasCounter: true,
      counterMax: undefined,
      counterCurrent: 0,
    });

    expect(result.success).toBe(true);
  });

  it("does not require counterMax when the field is cleared to an empty string", () => {
    const result = schema.safeParse({
      name: "Second Wind",
      hasCounter: true,
      counterMax: "",
      counterCurrent: 0,
    });

    expect(result.success).toBe(true);
  });

  it("skips counter order validation when counterMax is empty during editing", () => {
    const result = schema.safeParse({
      name: "Rage",
      hasCounter: true,
      counterMax: undefined,
      counterCurrent: 5,
    });

    expect(result.success).toBe(true);
  });

  it("rejects counterCurrent greater than counterMax when the ceiling is set", () => {
    const result = schema.safeParse({
      name: "Rage",
      hasCounter: true,
      counterMax: 3,
      counterCurrent: 5,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["counterCurrent"]);
    expect(result.error?.issues[0]?.message).toBe(messages.abilityCounterOrder);
  });
});

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
