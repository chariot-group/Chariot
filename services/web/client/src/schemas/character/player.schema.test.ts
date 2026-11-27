import { describe, expect, it } from "vitest";
import { makeZodMessages } from "@/lib/zodErrorMap";
import { createPlayerSchema } from "@/schemas/character/player.schema";

/** @see FR-game-system — Ruleset reference (kept by the creation form) */
const schema = createPlayerSchema(makeZodMessages((key) => key));

describe("createPlayerSchema — rulesetId", () => {
  it("nominal: keeps the ruleset id sent by the builder", () => {
    const parsed = schema.parse({ firstname: "Tia", rulesetId: "507f1f77bcf86cd799439011" });
    expect(parsed.rulesetId).toBe("507f1f77bcf86cd799439011");
  });

  it("edge: a manual creation has no rulesetId (the API sets the default)", () => {
    expect(schema.parse({ firstname: "Tia" })).not.toHaveProperty("rulesetId");
  });

  it("failure: a value that is not an id is rejected", () => {
    expect(schema.safeParse({ firstname: "Tia", rulesetId: "dnd5e-2014" }).success).toBe(false);
  });
});
