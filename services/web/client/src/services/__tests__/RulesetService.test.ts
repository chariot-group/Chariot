import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@/services/ApiService", () => ({
  default: () => ({ get: getMock }),
}));

describe("RulesetService — FR-ruleset-character-builder (Access)", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("nominal: loads the catalog of a ruleset in one request", async () => {
    getMock.mockResolvedValue({ data: { message: "ok", data: [{ type: "race", key: "elf" }] } });
    const { default: rulesetService } = await import("@/services/RulesetService");

    await expect(rulesetService.getCatalog("r1")).resolves.toEqual([{ type: "race", key: "elf" }]);
    expect(getMock).toHaveBeenCalledWith("/rulesets/r1/catalog");
  });

  it("edge: lists the published rulesets of a game system only", async () => {
    getMock.mockResolvedValue({
      data: {
        message: "ok",
        data: [
          { _id: "a", status: "published" },
          { _id: "b", status: "draft" },
        ],
      },
    });
    const { default: rulesetService } = await import("@/services/RulesetService");

    await expect(rulesetService.listRulesets("DND_5E")).resolves.toEqual([{ _id: "a", status: "published" }]);
    expect(getMock).toHaveBeenCalledWith("/rulesets", { params: { gameSystem: "DND_5E" } });
  });

  it("failure: an API error is propagated to the builder (error state with retry)", async () => {
    const networkError = new Error("Network Error");
    getMock.mockImplementation(() => Promise.reject(networkError));
    const { default: rulesetService } = await import("@/services/RulesetService");

    const failure = await rulesetService.getRuleset("r1").catch((error: unknown) => error);
    expect(failure).toBe(networkError);
  });
});
