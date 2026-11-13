import { DEFAULT_GAME_SYSTEM } from "@/constants/gameSystems";
import { buildCodexImportedCombatStats } from "@/lib/codexImportedCombatStats";
import type { CodexCreateSelection } from "@/lib/codexCharacterCreate";
import type { Class, ClassName, NPC, Player, PlayerStats, Stats } from "@/types/character";

const DEFAULT_NPC_SKILLS = {
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
};

const DEFAULT_MASTERIES = { ...DEFAULT_NPC_SKILLS };

const DEFAULT_MASTERIES_ABILITY = {
  strength: false,
  dexterity: false,
  constitution: false,
  intelligence: false,
  wisdom: false,
  charisma: false,
};

const DEFAULT_SAVING_THROWS = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

export interface CodexCharacterCreateContext {
  groupId?: string | null;
  linkedPlayerId?: string | null;
}

function resolveGroups(draftGroups: unknown, groupId?: string | null): string[] {
  if (groupId?.trim()) return [groupId.trim()];
  if (Array.isArray(draftGroups) && draftGroups.length > 0) {
    return draftGroups.map((group) =>
      typeof group === "object" && group !== null && "_id" in group
        ? String((group as { _id: string })._id)
        : String(group),
    );
  }
  return [];
}

/**
 * Pre-validation payloads: same shape as the Codex-prefilled create form values, before the Zod create schema
 * coerces them (group ids as strings, empty class name placeholder, partial stats).
 */
export type CodexPlayerCreatePayload = Omit<Partial<Player>, "groups" | "class" | "stats"> & {
  groups: string[];
  class: (Omit<Class, "name"> & { name: ClassName | "" })[];
  stats: Partial<PlayerStats>;
};
export type CodexNpcCreatePayload = Omit<Partial<NPC>, "groups" | "stats"> & {
  groups: string[];
  stats: Partial<Stats>;
};

/** Maps a Codex draft to the same shape used by CharacterFormView before create. */
export function prepareCodexCharacterCreateData(
  selection: CodexCreateSelection,
  context: CodexCharacterCreateContext,
): CodexPlayerCreatePayload | CodexNpcCreatePayload {
  const combatStats = buildCodexImportedCombatStats(selection.draft);
  const groups = resolveGroups(selection.draft.groups, context.groupId);

  if (selection.kind === "player") {
    const draft = selection.draft;
    return {
      ...draft,
      gameSystem: draft.gameSystem ?? DEFAULT_GAME_SYSTEM,
      groups,
      class: draft.class?.length ? draft.class : [{ name: "", subclass: "", level: 1, hitDice: 0 }],
      profile: {
        alignment: draft.profile?.alignment ?? "True Neutral",
        race: draft.profile?.race ?? "",
        subrace: draft.profile?.subrace ?? "",
        history: draft.profile?.history ?? "",
      },
      stats: {
        ...(draft.stats || {}),
        ...combatStats,
        masteries: {
          ...DEFAULT_MASTERIES,
          ...(draft.stats?.masteries || {}),
        },
        masteriesAbility: {
          ...DEFAULT_MASTERIES_ABILITY,
          ...(draft.stats?.masteriesAbility || {}),
        },
      },
      actions: Array.isArray(draft.actions) ? draft.actions : [],
    };
  }

  const draft = selection.draft;
  const linkedPlayerId = context.linkedPlayerId?.trim() || null;
  return {
    ...draft,
    gameSystem: draft.gameSystem ?? DEFAULT_GAME_SYSTEM,
    groups,
    linkedPlayerId,
    challenge: draft.challenge ?? { challengeRating: 0, experiencePoints: 0 },
    actions: draft.actions ?? { standard: [], legendary: [], lair: [] },
    profile: {
      alignment: draft.profile?.alignment ?? "True Neutral",
      type: draft.profile?.type ?? "",
      subtype: draft.profile?.subtype ?? "",
    },
    hitPointsRoll: draft.hitPointsRoll ?? "",
    stats: {
      ...(draft.stats || {}),
      ...combatStats,
      size: draft.stats?.size ?? "Medium",
      maxHitPoints: draft.stats?.maxHitPoints ?? draft.stats?.currentHitPoints ?? 10,
      currentHitPoints: draft.stats?.currentHitPoints ?? draft.stats?.maxHitPoints ?? 10,
      tempHitPoints: draft.stats?.tempHitPoints ?? 0,
      initiative: draft.stats?.initiative ?? 0,
      languages: draft.stats?.languages ?? [],
      passivePerception: draft.stats?.passivePerception ?? 10,
      savingThrows: {
        ...DEFAULT_SAVING_THROWS,
        ...(draft.stats?.savingThrows || {}),
      },
      skills: {
        ...DEFAULT_NPC_SKILLS,
        ...(draft.stats?.skills || {}),
      },
      senses: draft.stats?.senses ?? [],
    },
  };
}
