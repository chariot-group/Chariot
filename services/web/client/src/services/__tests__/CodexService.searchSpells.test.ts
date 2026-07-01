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

describe("CodexService.searchSpells — level filter", () => {
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

  it("nominal: forwards selected level as numeric query param", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("", "fr", 1, 20, undefined, 3);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        level: 3,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: forwards cantrip level 0", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("light", "en", 1, 10, ["wizard"], 0);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 10,
        lang: "en",
        name: "light",
        classes: ["Wizard"],
        level: 0,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: omits level param when unset", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("fire", null, 2, 10);

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
});

describe("CodexService.searchSpells — school filter", () => {
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

  it("nominal: forwards selected schools with repeat array serialization", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("", "fr", 1, 20, undefined, undefined, ["evocation", "abjuration"]);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        schools: ["evocation", "abjuration"],
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: combines schools with classes and level", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("fire", "en", 1, 10, ["wizard"], 3, ["necromancy"]);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 10,
        lang: "en",
        name: "fire",
        classes: ["Wizard"],
        level: 3,
        schools: ["necromancy"],
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: omits schools param when the filter is empty", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("bolt", "en", 1, 10, ["sorcerer"], 1, []);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 10,
        lang: "en",
        name: "bolt",
        classes: ["Sorcerer"],
        level: 1,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });
});
