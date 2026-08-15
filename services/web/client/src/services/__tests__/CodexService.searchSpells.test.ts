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

describe("CodexService.searchSpells — game system filter", () => {
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

  it("nominal: forwards selected game system as query param", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("", "fr", 1, 20, undefined, undefined, undefined, "DND_5E");

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        gameSystem: "DND_5E",
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });

  it("edge: omits gameSystem param when unset", async () => {
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

  it("edge: combines gameSystem with other filters", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchSpells("fire", "en", 1, 10, ["wizard"], 3, ["evocation"], "DND_5E");

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: {
        page: 1,
        offset: 10,
        lang: "en",
        name: "fire",
        classes: ["Wizard"],
        level: 3,
        schools: ["evocation"],
        gameSystem: "DND_5E",
      },
      paramsSerializer: {
        indexes: null,
      },
    });
  });
});

describe("CodexService.searchMonsters — game system filter", () => {
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

  it("nominal: forwards selected game system as query param", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchMonsters("", "fr", 1, 20, "DND_5E");

    expect(getMock).toHaveBeenCalledWith("/monsters", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        gameSystem: "DND_5E",
      },
    });
  });

  it("edge: omits gameSystem param when unset", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchMonsters("goblin", null, 2, 10);

    expect(getMock).toHaveBeenCalledWith("/monsters", {
      params: {
        page: 2,
        offset: 10,
        name: "goblin",
      },
    });
  });

  it("error: propagates API failures", async () => {
    getMock.mockRejectedValue(new Error("network down"));
    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.searchMonsters("dragon", "en", 1, 10, "DND_5E")).rejects.toThrow("network down");
  });
});

describe("CodexService.searchPlayers — game system filter", () => {
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

  it("nominal: forwards selected game system as query param", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchPlayers("", "fr", 1, 20, "DND_5E");

    expect(getMock).toHaveBeenCalledWith("/players", {
      params: {
        page: 1,
        offset: 20,
        lang: "fr",
        gameSystem: "DND_5E",
      },
    });
  });

  it("edge: omits gameSystem param when unset", async () => {
    const { default: CodexService } = await import("../CodexService");

    await CodexService.searchPlayers("aragorn", null, 2, 10);

    expect(getMock).toHaveBeenCalledWith("/players", {
      params: {
        page: 2,
        offset: 10,
        name: "aragorn",
      },
    });
  });

  it("error: propagates API failures", async () => {
    getMock.mockRejectedValue(new Error("network down"));
    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.searchPlayers("fighter", "en", 1, 10, "DND_5E")).rejects.toThrow("network down");
  });
});

describe("CodexService.convertCodexPlayerToChariotNPC", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CODEX_URL", "https://codex.test");
  });

  it("nominal: maps player translation to NPC draft shape", async () => {
    const { default: CodexService } = await import("../CodexService");

    const npc = CodexService.convertCodexPlayerToChariotNPC(
      {
        _id: "player-1",
        tag: 1,
        languages: ["en"],
        translations: {
          en: {
            firstname: "Aragorn",
            lastname: "Elessar",
            surname: "",
            avatar: "",
            stats: {
              size: "Medium",
              maxHitPoints: 52,
              currentHitPoints: 52,
              tempHitPoints: 0,
              initiative: 2,
              armorClass: 16,
              passivePerception: 14,
              speed: { walk: 30 },
              languages: ["Common", "Elvish"],
              abilityScores: {
                strength: 16,
                dexterity: 14,
                constitution: 14,
                intelligence: 12,
                wisdom: 13,
                charisma: 10,
              },
              savingThrows: {
                strength: 0,
                dexterity: 0,
                constitution: 0,
                intelligence: 0,
                wisdom: 0,
                charisma: 0,
              },
              skills: {
                athletics: 0,
                acrobatics: 0,
                sleightHand: 0,
                stealth: 0,
                arcana: 0,
                history: 0,
                investigation: 0,
                nature: 0,
                religion: 0,
                animalHandling: 0,
                insight: 0,
                medicine: 0,
                perception: 0,
                survival: 0,
                deception: 0,
                intimidation: 0,
                performance: 0,
                persuasion: 0,
              },
              senses: [],
              proficiencyBonus: 3,
              masteries: {
                athletics: 0,
                acrobatics: 0,
                sleightHand: 0,
                stealth: 0,
                arcana: 0,
                history: 0,
                investigation: 0,
                nature: 0,
                religion: 0,
                animalHandling: 0,
                insight: 0,
                medicine: 0,
                perception: 2,
                survival: 0,
                deception: 0,
                intimidation: 0,
                performance: 0,
                persuasion: 0,
              },
            },
            affinities: { resistances: [], immunities: [], vulnerabilities: [] },
            abilities: [],
            spellcasting: [],
            actions: [{ name: "Longsword", type: "melee", attackBonus: 6, range: "5 ft." }],
            class: [{ name: "Fighter", level: 5 }],
            progression: { level: 5, experience: 6500 },
            profile: { alignment: "Lawful Good", race: "Human", subrace: "", history: "" },
            createdAt: "",
            updatedAt: "",
          },
        },
        deletedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      "en",
    );

    expect(npc.firstname).toBe("Aragorn");
    expect(npc.profile?.type).toBe("Human");
    expect(npc.actions?.standard).toHaveLength(1);
    expect(npc.stats?.skills?.perception).toBe(2);
    expect(npc.challenge?.challengeRating).toBe(0);
  });

  it("error: throws when translation is missing", async () => {
    const { default: CodexService } = await import("../CodexService");

    expect(() =>
      CodexService.convertCodexPlayerToChariotNPC(
        {
          _id: "player-2",
          tag: 0,
          languages: ["en"],
          translations: {},
          deletedAt: null,
          createdAt: "",
          updatedAt: "",
        },
        "en",
      ),
    ).toThrow("No translation available for this player");
  });
});
