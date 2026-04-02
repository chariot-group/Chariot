import { AbilityScores } from "@/types/character";
import { calculateAbilityBonus } from "@/utils/global.utils";

export const DEFAULT_DAMAGE_TYPES = [
    "Acide",
    "Contondant",
    "Feu",
    "Force",
    "Foudre",
    "Froid",
    "Nécrotique",
    "Perforant",
    "Poison",
    "Psychique",
    "Radiant",
    "Tonnerre",
    "Tranchant",
];

export const ABILITY_SCORE_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
export const ATTACK_ABILITY_SCORE_KEYS = ["strength", "dexterity"] as const;

export type AbilityScoreKey = (typeof ABILITY_SCORE_KEYS)[number];

export const ABILITY_SCORE_SHORT_LABELS: Record<AbilityScoreKey, string> = {
    strength: "FOR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "SAG",
    charisma: "CHA",
};

export function formatSignedBonus(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
}

export function getAbilityScoreModifier(score?: number | null): number {
    return calculateAbilityBonus(score ?? 10);
}

export function getProficiencyBonusFromChallengeRating(challengeRating?: number | null): number {
    const normalizedChallengeRating = Number(challengeRating ?? 0);

    if (normalizedChallengeRating >= 29) return 9;
    if (normalizedChallengeRating >= 25) return 8;
    if (normalizedChallengeRating >= 21) return 7;
    if (normalizedChallengeRating >= 17) return 6;
    if (normalizedChallengeRating >= 13) return 5;
    if (normalizedChallengeRating >= 9) return 4;
    if (normalizedChallengeRating >= 5) return 3;
    return 2;
}

export function getAttackSuggestionBonus(score?: number | null, proficiencyBonus = 0): number {
    return getAbilityScoreModifier(score) + proficiencyBonus;
}

export function getDamageSuggestionBonus(score?: number | null): number {
    return getAbilityScoreModifier(score);
}

export function getAttackSuggestionOptions(abilityScores?: Partial<AbilityScores> | null, proficiencyBonus = 0) {
    return ATTACK_ABILITY_SCORE_KEYS.map((abilityKey) => {
        const score = Number(abilityScores?.[abilityKey] ?? 10);
        const modifier = getAbilityScoreModifier(score);

        return {
            key: abilityKey,
            score,
            modifier,
            attackBonus: getAttackSuggestionBonus(score, proficiencyBonus),
            damageBonus: getDamageSuggestionBonus(score),
        };
    });
}