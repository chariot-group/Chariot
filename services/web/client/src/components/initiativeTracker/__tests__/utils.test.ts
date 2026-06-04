import { describe, expect, it } from "vitest";
import {
  DEATH_SAVES_FAILURE_THRESHOLD,
  defaultPlayerDisplayNameForRow,
  filterRowsForPlayerView,
  getInitiativeTrackerRowStatus,
  resolvePlayerDisplayNameForSave,
  resolvePlayerTrackerDisplayName,
  shouldShowGmPlayerAliasSubtitle,
  trackerDeathSavesFailuresFromCharacter,
  trackerKindFromCharacter,
  trackerStatusFieldsFromCharacter,
} from "../utils";
import { SESSION_PARTICIPANTS_GROUP_ID } from "../constants";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import type { Character, NPC, Player } from "@/types/character";

const baseStatus = (
  overrides: Partial<Pick<InitiativeTrackerRow, "hitPoints" | "kind" | "deathSavesFailures">>,
): Pick<InitiativeTrackerRow, "hitPoints" | "kind" | "deathSavesFailures"> => ({
  hitPoints: 10,
  kind: "player",
  deathSavesFailures: 0,
  ...overrides,
});

describe("FR-014 — getInitiativeTrackerRowStatus", () => {
  it("nominal: an alive character keeps the alive status regardless of death save failures", () => {
    expect(
      getInitiativeTrackerRowStatus(
        baseStatus({ hitPoints: 12, kind: "player", deathSavesFailures: 2 }),
      ),
    ).toBe("alive");
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: 1, kind: "npc", deathSavesFailures: 0 })),
    ).toBe("alive");
  });

  it("dead NPC: NPC at 0 HP is always dead (no death saves apply)", () => {
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: 0, kind: "npc", deathSavesFailures: 0 })),
    ).toBe("dead");
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: -3, kind: "npc", deathSavesFailures: 0 })),
    ).toBe("dead");
  });

  it("unconscious player: PJ at 0 HP with failures < 3 is unconscious (edge: failures = 2)", () => {
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: 0, kind: "player", deathSavesFailures: 0 })),
    ).toBe("unconscious");
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: 0, kind: "player", deathSavesFailures: 2 })),
    ).toBe("unconscious");
  });

  it("dead player: PJ at 0 HP with failures >= 3 is dead (edge: exactly threshold and over)", () => {
    expect(
      getInitiativeTrackerRowStatus(
        baseStatus({
          hitPoints: 0,
          kind: "player",
          deathSavesFailures: DEATH_SAVES_FAILURE_THRESHOLD,
        }),
      ),
    ).toBe("dead");
    expect(
      getInitiativeTrackerRowStatus(baseStatus({ hitPoints: 0, kind: "player", deathSavesFailures: 5 })),
    ).toBe("dead");
  });

  it("error/invalid input: NaN HP is treated as 0 and falls back to dead/unconscious rule", () => {
    expect(
      getInitiativeTrackerRowStatus(
        baseStatus({ hitPoints: Number.NaN, kind: "npc", deathSavesFailures: 0 }),
      ),
    ).toBe("dead");
    expect(
      getInitiativeTrackerRowStatus(
        baseStatus({ hitPoints: Number.NaN, kind: "player", deathSavesFailures: 1 }),
      ),
    ).toBe("unconscious");
  });
});

const buildPlayerCharacter = (overrides: Partial<Player> = {}): Character => {
  const character = {
    _id: "p1",
    firstname: "Aria",
    lastname: "Thorn",
    surname: "",
    avatar: "",
    stats: {
      maxHitPoints: 10,
      currentHitPoints: 0,
      tempHitPoints: 0,
      armorClass: 12,
      initiative: 1,
    },
    progression: { level: 3, experience: 0 },
    deathSaves: { successes: 0, failures: 1 },
    ...overrides,
  };
  return character as unknown as Character;
};

const buildNpcCharacter = (overrides: Partial<NPC> = {}): Character => {
  const character = {
    _id: "n1",
    firstname: "",
    lastname: "",
    surname: "Goblin",
    avatar: "",
    stats: {
      maxHitPoints: 7,
      currentHitPoints: 0,
      tempHitPoints: 0,
      armorClass: 13,
      initiative: 2,
    },
    challenge: { challengeRating: 0.25, experiencePoints: 50 },
    profile: { type: "humanoid", subtype: "goblinoid", alignment: "Chaotic Evil" },
    ...overrides,
  };
  return character as unknown as Character;
};

describe("FR-014 — character → tracker mirror helpers", () => {
  it("nominal: a player character resolves to kind 'player' and exposes its death save failures", () => {
    const player = buildPlayerCharacter();
    expect(trackerKindFromCharacter(player)).toBe("player");
    expect(trackerDeathSavesFailuresFromCharacter(player)).toBe(1);
  });

  it("edge: an NPC character resolves to kind 'npc' and reports 0 failures", () => {
    const npc = buildNpcCharacter();
    expect(trackerKindFromCharacter(npc)).toBe("npc");
    expect(trackerDeathSavesFailuresFromCharacter(npc)).toBe(0);
  });

  it("edge: trackerStatusFieldsFromCharacter projects HP + status mirror in a single call", () => {
    const player = buildPlayerCharacter({
      stats: {
        maxHitPoints: 18,
        currentHitPoints: 0,
        tempHitPoints: 4,
      } as Player["stats"],
      deathSaves: { successes: 1, failures: 3 },
    });

    expect(trackerStatusFieldsFromCharacter(player)).toEqual({
      hitPoints: 0,
      maxHitPoints: 18,
      tempHitPoints: 4,
      kind: "player",
      deathSavesFailures: 3,
    });
  });

  it("error/missing data: a player without deathSaves still produces a sane mirror (failures = 0)", () => {
    const player = buildPlayerCharacter({
      deathSaves: undefined as unknown as Player["deathSaves"],
    });
    expect(trackerDeathSavesFailuresFromCharacter(player)).toBe(0);
  });
});

describe("FR-015 — filterRowsForPlayerView", () => {
  it("nominal: keeps visible NPC rows", () => {
    const rows = [
      { id: "a", visible: true, kind: "npc" },
      { id: "b", visible: false, kind: "npc" },
    ] as InitiativeTrackerRow[];
    expect(filterRowsForPlayerView(rows).map((r) => r.id)).toEqual(["a"]);
  });

  it("nominal: always keeps session participant group rows", () => {
    const rows = [
      {
        id: "pj",
        visible: false,
        kind: "player",
        groupId: SESSION_PARTICIPANTS_GROUP_ID,
      },
    ] as InitiativeTrackerRow[];
    expect(filterRowsForPlayerView(rows).map((r) => r.id)).toEqual(["pj"]);
  });

  it("edge: hides non-session player rows when not visible", () => {
    const rows = [{ id: "pj", visible: false, kind: "player", groupId: "g1" }] as InitiativeTrackerRow[];
    expect(filterRowsForPlayerView(rows)).toHaveLength(0);
  });
});

describe("FR-015 — player display name helpers", () => {
  it("nominal: default alias equals character name", () => {
    expect(
      defaultPlayerDisplayNameForRow({ firstname: "Gobelin", lastname: "1", surname: "" }),
    ).toBe("Gobelin 1");
  });

  it("edge: save resolves empty input to GM name", () => {
    expect(resolvePlayerDisplayNameForSave("  ", "Gobelin 1")).toBe("Gobelin 1");
  });

  it("error: GM subtitle hidden when alias matches real name", () => {
    expect(shouldShowGmPlayerAliasSubtitle("Gobelin 1", "Gobelin 1")).toBe(false);
    expect(shouldShowGmPlayerAliasSubtitle("Gobelin 1", "Filbert le gobelin")).toBe(true);
  });
});

describe("FR-015 — resolvePlayerTrackerDisplayName", () => {
  const baseRow = {
    firstname: "Secret",
    lastname: "Goblin",
    surname: "",
    playerDisplayName: "",
    playerFieldVisibility: {
      initiative: false,
      name: false,
      hitPoints: false,
      armorClass: false,
      conditions: false,
      groupLabel: false,
    },
  };

  it("nominal: returns real name when name visibility is enabled", () => {
    expect(
      resolvePlayerTrackerDisplayName({
        ...baseRow,
        playerFieldVisibility: { ...baseRow.playerFieldVisibility, name: true },
      }),
    ).toBe("Secret Goblin");
  });

  it("edge: returns GM alias when name is hidden", () => {
    expect(
      resolvePlayerTrackerDisplayName({
        ...baseRow,
        playerDisplayName: "Créature des ombres",
      }),
    ).toBe("Créature des ombres");
  });

  it("error: returns null when name hidden and no alias", () => {
    expect(resolvePlayerTrackerDisplayName(baseRow)).toBeNull();
  });
});
