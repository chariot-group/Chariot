import { describe, expect, it } from "vitest";
import {
  DEATH_SAVES_FAILURE_THRESHOLD,
  defaultPlayerDisplayNameForRow,
  filterRowsForPlayerView,
  getInitiativeTrackerRowStatus,
  resolvePlayerDisplayNameForSave,
  resolvePlayerTrackerDisplayName,
  sanitizeBattleStateSnapshotForPlayers,
  sanitizeInitiativeTrackerRowForPlayer,
  shouldShowGmPlayerAliasSubtitle,
  trackerDeathSavesFailuresFromCharacter,
  trackerKindFromCharacter,
  trackerMirrorFieldsFromCharacter,
  trackerStatusFieldsFromCharacter,
  resolveInitiativeModifier,
  resolveInitiativeModifierFromStats,
  initiativeRollFromTotal,
  initiativeTotalFromRoll,
} from "@/components/initiativeTracker/utils";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
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

describe("FR-tracker-vital-status — getInitiativeTrackerRowStatus", () => {
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

describe("FR-tracker-vital-status — character → tracker mirror helpers", () => {
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

  it("nominal: trackerMirrorFieldsFromCharacter also mirrors identity, avatar, and armor class", () => {
    const player = buildPlayerCharacter({
      firstname: "Lyra",
      lastname: "Vale",
      surname: "The Whisper",
      avatar: "https://example.test/lyra.png",
      stats: {
        maxHitPoints: 22,
        currentHitPoints: 16,
        tempHitPoints: 5,
        armorClass: 17,
        initiative: 3,
      } as Player["stats"],
      deathSaves: { successes: 0, failures: 0 },
    });

    expect(trackerMirrorFieldsFromCharacter(player)).toEqual({
      firstname: "Lyra",
      lastname: "Vale",
      surname: "The Whisper",
      avatar: "https://example.test/lyra.png",
      armorClass: 17,
      initiativeModifier: 3,
      hitPoints: 16,
      maxHitPoints: 22,
      tempHitPoints: 5,
      kind: "player",
      deathSavesFailures: 0,
    });
  });

  it("edge: resolveInitiativeModifierFromStats defaults missing values to 0", () => {
    expect(resolveInitiativeModifierFromStats(undefined)).toBe(0);
    expect(resolveInitiativeModifierFromStats({ initiative: undefined })).toBe(0);
    expect(resolveInitiativeModifierFromStats({ initiative: -1 })).toBe(-1);
  });

  it("nominal: roll + modifier produces the persisted total", () => {
    expect(initiativeTotalFromRoll(15, 2)).toBe(17);
    expect(initiativeRollFromTotal(17, 2)).toBe(15);
  });

  it("edge: re-edit cycle does not double-apply the modifier", () => {
    const total = initiativeTotalFromRoll(12, 3);
    expect(total).toBe(15);
    expect(initiativeTotalFromRoll(initiativeRollFromTotal(total, 3), 3)).toBe(15);
  });

  it("failure: non-finite roll/modifier fall back safely", () => {
    expect(initiativeTotalFromRoll(Number.NaN, 2)).toBe(2);
    expect(initiativeRollFromTotal(Number.NaN, 2)).toBe(-2);
    expect(resolveInitiativeModifier(undefined)).toBe(0);
  });

  it("error/missing data: a player without deathSaves still produces a sane mirror (failures = 0)", () => {
    const player = buildPlayerCharacter({
      deathSaves: undefined as unknown as Player["deathSaves"],
    });
    expect(trackerDeathSavesFailuresFromCharacter(player)).toBe(0);
  });
});

describe("FR-session-combat-navigation — filterRowsForPlayerView", () => {
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

describe("FR-session-combat-navigation — player display name helpers", () => {
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

describe("FR-session-combat-navigation — resolvePlayerTrackerDisplayName", () => {
  const baseRow = {
    firstname: "Secret",
    lastname: "Goblin",
    surname: "",
    playerDisplayName: "",
    playerFieldVisibility: {
      initiative: false,
      name: false,
      hitPoints: false,
      lifeStatus: false,
      armorClass: false,
      conditions: false,
      groupLabel: false,
    },
  };

  it("nominal: returns configured display name when name visibility is enabled", () => {
    expect(
      resolvePlayerTrackerDisplayName({
        ...baseRow,
        playerDisplayName: "Créature des ombres",
        playerFieldVisibility: { ...baseRow.playerFieldVisibility, name: true },
      }),
    ).toBe("Créature des ombres");
  });

  it("edge: falls back to real name when name is visible and no display name is configured", () => {
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

describe("FR-session-combat-navigation / FR-session-combat-sync — player-safe battle snapshots", () => {
  const visibleRow = {
    id: "visible",
    characterId: "c-visible",
    firstname: "Secret",
    lastname: "Boss",
    surname: "",
    avatar: "",
    initiative: 18,
    hitPoints: 44,
    maxHitPoints: 50,
    tempHitPoints: 3,
    armorClass: 17,
    conditions: [{ condition: "poisoned" }],
    groupId: "g1",
    groupLabel: "Hidden lair",
    visible: true,
    playerDisplayName: "Masked boss",
    playerFieldVisibility: {
      initiative: false,
      name: false,
      hitPoints: false,
      lifeStatus: false,
      armorClass: false,
      conditions: false,
      concentration: false,
      groupLabel: false,
    },
    concentration: { spellName: "Bless", sinceRound: 2 },
    pendingConcentrationCheck: { damageAmount: 5, dc: 10 },
    kind: "npc",
    deathSavesFailures: 0,
  } as InitiativeTrackerRow;

  it("nominal: preserves player alias while stripping hidden real fields", () => {
    const sanitized = sanitizeInitiativeTrackerRowForPlayer(visibleRow);

    expect(sanitized.playerDisplayName).toBe("Masked boss");
    expect(sanitized.firstname).toBe("");
    expect(sanitized.lastname).toBe("");
    expect(sanitized.initiative).toBe(0);
    expect(sanitized.hitPoints).toBe(1);
    expect(sanitized.deathSavesFailures).toBe(0);
    expect(sanitized.armorClass).toBe(0);
    expect(sanitized.conditions).toEqual([]);
    expect(sanitized.concentration).toBeNull();
    expect(sanitized.pendingConcentrationCheck).toBeNull();
    expect(sanitized.groupLabel).toBe("");
  });

  it("edge: keeps fields explicitly visible to players", () => {
    const sanitized = sanitizeInitiativeTrackerRowForPlayer({
      ...visibleRow,
      playerFieldVisibility: {
        initiative: true,
        name: true,
        hitPoints: true,
        lifeStatus: true,
        armorClass: true,
        conditions: true,
        concentration: true,
        groupLabel: true,
      },
    });

    expect(sanitized.firstname).toBe("Secret");
    expect(sanitized.initiative).toBe(18);
    expect(sanitized.hitPoints).toBe(44);
    expect(sanitized.conditions).toHaveLength(1);
    expect(sanitized.concentration?.spellName).toBe("Bless");
    expect(sanitized.groupLabel).toBe("Hidden lair");
  });

  it("error: removes hidden rows and clears active turn when it is not visible", () => {
    const sanitized = sanitizeBattleStateSnapshotForPlayers({
      initiativeTrackerRows: [
        visibleRow,
        { ...visibleRow, id: "hidden", characterId: "c-hidden", visible: false },
      ],
      battleInitialized: true,
      battleStarted: true,
      activeTurnRowId: "hidden",
      currentRound: 2,
      allowPlayerInitiativeInput: false,
    });

    expect(sanitized.initiativeTrackerRows.map((row) => row.id)).toEqual(["visible"]);
    expect(sanitized.activeTurnRowId).toBeNull();
    expect(sanitized.battleStarted).toBe(true);
    expect(sanitized.currentRound).toBe(2);
  });

  it("nominal: preserves GM initiative order for players even when initiative is hidden", () => {
    const sanitized = sanitizeBattleStateSnapshotForPlayers({
      initiativeTrackerRows: [
        { ...visibleRow, id: "slow", characterId: "c-slow", initiative: 5, firstname: "Slow" },
        { ...visibleRow, id: "fast", characterId: "c-fast", initiative: 20, firstname: "Fast" },
      ],
      battleInitialized: true,
      battleStarted: true,
      activeTurnRowId: "fast",
      currentRound: 1,
      allowPlayerInitiativeInput: false,
    });

    expect(sanitized.initiativeTrackerRows.map((row) => row.id)).toEqual(["fast", "slow"]);
    expect(sanitized.initiativeTrackerRows.map((row) => row.initiative)).toEqual([0, 0]);
  });
});
