/** @see FR-character-sheet-pdf-export */

import type { Action, NPC, Player, Spellcasting } from "@/types/character";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import { calculateSkillBonus, isPlayer } from "@/utils/global.utils";
import { formatAbilityModifier, formatSignedBonus } from "@/lib/characterSheetPdf/formatBonus";
import { ABILITY_KEYS, PDF_SKILL_CONFIG } from "@/lib/characterSheetPdf/skillConfig";
import type {
  CharacterSheetPdfData,
  CharacterSheetPdfLabels,
  PdfAttackRow,
  PdfSpellcastingBlock,
} from "@/lib/characterSheetPdf/types";

function orEmpty(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  return str;
}

function formatSpeed(speed: {
  walk?: number;
  climb?: number;
  swim?: number;
  fly?: number;
  burrow?: number;
}): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} ft`);
  if (speed.fly) parts.push(`fly ${speed.fly} ft`);
  if (speed.swim) parts.push(`swim ${speed.swim} ft`);
  if (speed.climb) parts.push(`climb ${speed.climb} ft`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft`);
  return parts.join(", ");
}

function formatDamage(action: Action): string {
  if (!action.damage?.length) return "";
  return action.damage
    .map((d) => {
      const dice = d.dice?.trim() ?? "";
      const type = d.type?.trim() ?? "";
      return [dice, type].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(" + ");
}

function mapAttacks(actions: Action[]): PdfAttackRow[] {
  return actions
    .filter((a) => a.name?.trim())
    .map((action) => ({
      name: action.name.trim(),
      bonus: formatSignedBonus(action.attackBonus ?? 0),
      damage: formatDamage(action),
      range: orEmpty(action.range),
    }));
}

function mapNpcAttacks(npc: NPC): PdfAttackRow[] {
  const all = [...(npc.actions?.standard ?? []), ...(npc.actions?.legendary ?? []), ...(npc.actions?.lair ?? [])];
  return mapAttacks(all);
}

function mapSpellcastingBlocks(spellcasting: Spellcasting[]): PdfSpellcastingBlock[] {
  return spellcasting
    .filter((block) => block.className?.trim() || (block.spells?.length ?? 0) > 0)
    .map((block) => {
      const cantrips = (block.spells ?? [])
        .filter((s) => s.level === 0)
        .map((s) => ({ name: s.name, level: 0, prepared: s.prepared === true }));

      const spellsByLevel: Record<number, typeof cantrips> = {};
      for (const spell of block.spells ?? []) {
        if (spell.level === 0) continue;
        if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
        spellsByLevel[spell.level].push({
          name: spell.name,
          level: spell.level,
          prepared: spell.prepared === true,
        });
      }

      const slotsByLevel: Record<number, { used: number; total: number }> = {};
      for (const [levelKey, slot] of Object.entries(block.spellSlotsByLevel ?? {})) {
        const level = Number(levelKey);
        if (!Number.isFinite(level)) continue;
        slotsByLevel[level] = { used: slot.used ?? 0, total: slot.total ?? 0 };
      }

      return {
        className: block.className ?? "",
        ability: block.ability ?? "",
        saveDc: block.saveDC != null ? String(block.saveDC) : "",
        attackBonus: block.attackBonus != null ? formatSignedBonus(block.attackBonus) : "",
        cantrips,
        spellsByLevel,
        slotsByLevel,
        isInnate: block.isInnate === true,
      };
    });
}

function hasSpellcastingContent(blocks: PdfSpellcastingBlock[]): boolean {
  return blocks.some(
    (b) =>
      b.cantrips.length > 0 ||
      Object.keys(b.spellsByLevel).length > 0 ||
      Object.keys(b.slotsByLevel).length > 0,
  );
}

export interface MapCharacterToPdfDataOptions {
  labels: CharacterSheetPdfLabels;
  playerName?: string;
  translateClass: (className: string) => string;
  formatClassLevel: (className: string, level: number) => string;
  translateAlignment: (alignment: string) => string;
  avatarDataUrl?: string | null;
  qrCodeDataUrl?: string | null;
  characterPageUrl?: string;
}

export function mapCharacterToPdfData(
  character: Player | NPC,
  options: MapCharacterToPdfDataOptions,
): CharacterSheetPdfData {
  const { labels, playerName = "", translateClass, formatClassLevel, translateAlignment, avatarDataUrl = null, qrCodeDataUrl = null, characterPageUrl = "" } = options;
  const stats = character.stats;
  const abilityScores = stats.abilityScores;

  const abilities = ABILITY_KEYS.map((key) => ({
    abbr: labels.abilityAbbr[key] ?? key.slice(0, 3).toUpperCase(),
    name: labels.abilityNames[key] ?? key,
    score: abilityScores[key] ?? 10,
    modifier: formatAbilityModifier(abilityScores[key] ?? 10),
  }));

  const savingThrows = ABILITY_KEYS.map((key) => {
    const abilityScore = abilityScores[key] ?? 10;
    const savingThrowValue = Number(stats.savingThrows[key] ?? 0);
    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    const proficiencyBonus = stats.proficiencyBonus ?? 2;
    const isLikelyFinalTotal =
      savingThrowValue === abilityModifier ||
      savingThrowValue === abilityModifier + proficiencyBonus ||
      savingThrowValue === abilityModifier + proficiencyBonus * 2;
    const isProficient =
      savingThrowValue !== 0 ||
      savingThrowValue === abilityModifier + proficiencyBonus ||
      savingThrowValue === abilityModifier + proficiencyBonus * 2;
    const bonus = isLikelyFinalTotal
      ? savingThrowValue
      : isProficient
        ? abilityModifier + savingThrowValue
        : abilityModifier;
    return {
      abbr: labels.abilityAbbr[key] ?? key.slice(0, 3).toUpperCase(),
      bonus: formatSignedBonus(bonus),
      proficient: isProficient,
    };
  });

  const skills = PDF_SKILL_CONFIG.map(({ key, abilityKey }) => {
    const abilityScore = abilityScores[abilityKey] ?? 10;
    let bonus: number;
    let proficient = false;

    if (isPlayer(character)) {
      const masteryLevel = character.stats.masteries[key as keyof typeof character.stats.masteries] ?? 0;
      bonus = calculateSkillBonus(masteryLevel, abilityScore, character.stats.proficiencyBonus ?? 2);
      proficient = masteryLevel > 0;
    } else {
      const stored = stats.skills[key as keyof typeof stats.skills];
      bonus = stored != null && stored !== 0 ? stored : Math.floor((abilityScore - 10) / 2);
      proficient = stored != null && stored !== 0 && stored !== Math.floor((abilityScore - 10) / 2);
    }

    return {
      name: labels.skillNames[key] ?? key,
      abilityAbbr: labels.abilityAbbr[abilityKey] ?? abilityKey.slice(0, 3).toUpperCase(),
      bonus: formatSignedBonus(bonus),
      proficient,
    };
  });

  const displayName = [character.firstname, character.lastname]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(" ");

  let raceOrType = "";
  let classOrCr = "";
  let backgroundOrSubtype = "";
  let experience = "";
  let inspiration = false;
  let proficiencyBonus = "+2";
  let hitDice = "";
  let deathSaveSuccesses = 0;
  let deathSaveFailures = 0;
  let attacks: PdfAttackRow[] = [];
  let proficiencies = "";

  if (isPlayer(character)) {
    raceOrType = [character.profile?.race, character.profile?.subrace].filter(Boolean).join(" ");
    classOrCr = character.class
      .map((cls) => formatClassLevel(translateClass(cls.name), cls.level))
      .join(" / ");
    backgroundOrSubtype = orEmpty(character.profile?.history);
    experience = String(character.progression?.experience ?? 0);
    inspiration = Boolean(character.inspiration);
    proficiencyBonus = formatSignedBonus(character.stats.proficiencyBonus ?? 2);
    hitDice = character.class
      .map((cls) => {
        const remaining = cls.hitDiceRemaining ?? cls.level;
        return `${remaining}d${cls.hitDice} (${translateClass(cls.name)})`;
      })
      .join(", ");
    deathSaveSuccesses = character.deathSaves?.successes ?? 0;
    deathSaveFailures = character.deathSaves?.failures ?? 0;
    attacks = mapAttacks(character.actions ?? []);
    const armor = (character.stats.armors ?? []).join(", ");
    const weapons = (character.stats.weapons ?? []).join(", ");
    const tools = (character.stats.tools ?? []).join(", ");
    proficiencies = [armor, weapons, tools].filter(Boolean).join(" · ");
  } else {
    raceOrType = [character.profile?.type, character.profile?.subtype].filter(Boolean).join(" / ");
    const cr = formatChallengeRating(character.challenge?.challengeRating);
    const xp = character.challenge?.experiencePoints ?? 0;
    classOrCr = `${labels.challengeRating} ${cr} (${xp} XP)`;
    backgroundOrSubtype = orEmpty(character.profile?.subtype);
    attacks = mapNpcAttacks(character);
    proficiencies = "";
  }

  const alignment = character.profile?.alignment
    ? translateAlignment(character.profile.alignment)
    : "";

  const spellcastingBlocks = mapSpellcastingBlocks(character.spellcasting ?? []);

  return {
    isPlayer: isPlayer(character),
    displayName,
    playerName,
    raceOrType,
    classOrCr,
    backgroundOrSubtype,
    alignment,
    experience,
    inspiration,
    proficiencyBonus,
    abilities,
    savingThrows,
    skills,
    passivePerception: String(stats.passivePerception ?? 0),
    armorClass: String(stats.armorClass ?? 0),
    initiative: formatSignedBonus(stats.initiative ?? 0),
    speed: formatSpeed(stats.speed ?? {}),
    maxHp: String(stats.maxHitPoints ?? 0),
    currentHp: String(stats.currentHitPoints ?? 0),
    tempHp: String(stats.tempHitPoints ?? 0),
    hitDice: isPlayer(character) ? hitDice : orEmpty(character.hitPointsRoll),
    deathSaveSuccesses,
    deathSaveFailures,
    attacks,
    equipment: orEmpty(character.treasure?.equipment),
    treasureText: orEmpty(character.treasure?.treasure),
    currencies: {
      cp: character.treasure?.cp ?? 0,
      sp: character.treasure?.sp ?? 0,
      ep: character.treasure?.ep ?? 0,
      gp: character.treasure?.gp ?? 0,
      pp: character.treasure?.pp ?? 0,
    },
    proficiencies,
    languages: (stats.languages ?? []).join(", "),
    features: (character.abilities ?? []).map((a) => ({
      name: a.name ?? "",
      description: a.description ?? "",
    })),
    appearance: {
      age: character.appearance?.age != null ? String(character.appearance.age) : "",
      height: character.appearance?.height != null ? String(character.appearance.height) : "",
      weight: character.appearance?.weight != null ? String(character.appearance.weight) : "",
      eyes: orEmpty(character.appearance?.eyes),
      skin: orEmpty(character.appearance?.skin),
      hair: orEmpty(character.appearance?.hair),
      description: orEmpty(character.appearance?.description),
    },
    personalityTraits: orEmpty(character.background?.personalityTraits),
    ideals: orEmpty(character.background?.ideals),
    bonds: orEmpty(character.background?.bonds),
    flaws: orEmpty(character.background?.flaws),
    alliesAndOrgs: orEmpty(character.background?.alliesAndOrgs),
    backstory: orEmpty(character.background?.backstory),
    spellcastingBlocks,
    hasSpellcasting: hasSpellcastingContent(spellcastingBlocks),
    avatarDataUrl,
    qrCodeDataUrl,
    characterPageUrl,
  };
}
