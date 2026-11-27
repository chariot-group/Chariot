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

  it("edge: without game system, every published ruleset is listed (no game system written in the builder)", async () => {
    getMock.mockResolvedValue({ data: { message: "ok", data: [{ _id: "a", status: "published" }] } });
    const { default: rulesetService } = await import("@/services/RulesetService");

    await expect(rulesetService.listRulesets()).resolves.toEqual([{ _id: "a", status: "published" }]);
    expect(getMock).toHaveBeenCalledWith("/rulesets", undefined);
  });

  it("failure: an API error is propagated to the builder (error state with retry)", async () => {
    const networkError = new Error("Network Error");
    getMock.mockImplementation(() => Promise.reject(networkError));
    const { default: rulesetService } = await import("@/services/RulesetService");

    const failure = await rulesetService.getRuleset("r1").catch((error: unknown) => error);
    expect(failure).toBe(networkError);
  });

  describe("resolveRuleset — FR-game-system (Ruleset reference)", () => {
    it("nominal: resolves the ruleset of a campaign reference", async () => {
      getMock.mockResolvedValue({ data: { message: "ok", data: { _id: "v5", status: "published" } } });
      const { default: rulesetService } = await import("@/services/RulesetService");

      await expect(rulesetService.resolveRuleset({ rulesetId: "v4", gameSystem: "DND_5E" })).resolves.toEqual({
        _id: "v5",
        status: "published",
      });
      expect(getMock).toHaveBeenCalledWith("/rulesets/resolve", { params: { rulesetId: "v4", gameSystem: "DND_5E" } });
    });

    it("edge: a campaign without rulesetId sends its game system only; 404 means none published", async () => {
      getMock.mockRejectedValue({ response: { status: 404 } });
      const { default: rulesetService } = await import("@/services/RulesetService");

      await expect(rulesetService.resolveRuleset({ rulesetId: null, gameSystem: "DND_5E" })).resolves.toBeNull();
      expect(getMock).toHaveBeenCalledWith("/rulesets/resolve", { params: { gameSystem: "DND_5E" } });
    });

    it("failure: any other error is thrown", async () => {
      getMock.mockRejectedValue({ response: { status: 500 } });
      const { default: rulesetService } = await import("@/services/RulesetService");

      await expect(rulesetService.resolveRuleset({ gameSystem: "DND_5E" })).rejects.toEqual({
        response: { status: 500 },
      });
    });
  });
});
