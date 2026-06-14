import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: getMock,
    }),
  },
}));

describe("CodexService.searchSpells — class filter", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: {
        message: "ok",
        data: [],
        pagination: { page: 1, offset: 20, totalItems: 0 },
      },
    });
    vi.stubEnv("NEXT_PUBLIC_CODEX_URL", "https://codex.test");
  });

  it("nominal: forwards selected classes with repeat array serialization", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("", "fr", 1, 20, ["wizard", "paladin"]);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        classes: ["Wizard", "Paladin"],
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: omits classes param when the filter is empty", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("fire", null, 2, 10, []);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 2,
        offset: 10,
        name: "fire",
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("error: propagates API failures", async () => {
    getMock.mockRejectedValue(new Error("network down"));
    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.searchSpells("bolt", "en", 1, 10, ["sorcerer"])).rejects.toThrow("network down");
  });
});
