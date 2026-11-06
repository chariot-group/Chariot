import { describe, expect, it } from "vitest";
import { normalizeCharacterId } from "@/lib/normalizeCharacterId";

describe("normalizeCharacterId", () => {
  it("nominal: trims string ids", () => {
    expect(normalizeCharacterId(" 507f1f77bcf86cd799439011 ")).toBe("507f1f77bcf86cd799439011");
  });

  it("edge: normalizes ObjectId-like values", () => {
    expect(
      normalizeCharacterId({
        toHexString: () => "507f1f77bcf86cd799439011",
      }),
    ).toBe("507f1f77bcf86cd799439011");
  });

  it("failure: blank values become null", () => {
    expect(normalizeCharacterId("  ")).toBeNull();
    expect(normalizeCharacterId(null)).toBeNull();
  });
});
