import { Character, Player } from "@/types/character";
import { EXPERIENCE_TABLE, MAX_LEVEL, MIN_LEVEL } from "@/constants/experienceTable";

import NoMastery from "@public/assets/mastery/no-mastery.svg";
import HalfMastery from "@public/assets/mastery/half-mastery.svg";
import BlueCircle from "@public/assets/icons/blue-circle.svg";
import RedCircle from "@public/assets/icons/red-circle.svg";
import Expert from "@public/assets/mastery/expert.svg";
import { toast } from "react-toastify";

/**
 * Vérifie si un joueur a maîtrisé une compétence spécifique
 * @param player Le joueur à vérifier
 * @param competence La compétence à vérifier
 * @returns true si la compétence est maîtrisée, sinon false
 */
export function isMastered(player: Player, competence: string): boolean {
    return player.stats.masteriesAbility[competence as keyof typeof player.stats.masteriesAbility] === true;
}

/**
 * Calcule le bonus d'une caractéristique
 * @param number La valeur de la caractéristique
 * @returns Le bonus calculé
 */
export function calculateAbilityBonus(number: number): number {
    return Math.floor((number - 10) / 2);
}

/**
 * Retourne l'icône correspondant à une valeur de maîtrise
 * @param value La valeur de maîtrise
 * @returns Le chemin de l'icône correspondant
 */
export function getIconForValue(value: number, accentColor: string): string {
    switch (value) {
        case 1:
            return HalfMastery;
        case 2:
            if (accentColor === "red") {
                return RedCircle;
            }
            return BlueCircle;
        case 3:
            return Expert;
        default:
            return NoMastery;
    }
}

/**
 * Calcule le niveau de maîtrise d'une compétence
 * @param masteryLevel Le niveau de maîtrise (0, 1, 2, etc.)
 * @param skills Le bonus de compétence
 * @param proficiencyBonus Le bonus de compétence du personnage
 * @param masteriesAbility La valeur de la caractéristique associée à la compétence
 * @returns Le niveau de maîtrise formaté en chaîne de caractères (ex: "+3")
 */
export function calculateMasteryLevel(masteryLevel: number, skills: number, proficiencyBonus: number, masteriesAbility: number): number {
    let result: number = 0;
    if (skills!) {
        result = skills;
    } else {
        if (!proficiencyBonus || !masteriesAbility) return 0;
        let value = calculateAbilityBonus(masteriesAbility) + proficiencyBonus * 2;
        if (masteryLevel === 0) value = calculateAbilityBonus(masteriesAbility);
        if (masteryLevel === 1) value = calculateAbilityBonus(masteriesAbility) + proficiencyBonus / 2;
        if (masteryLevel === 2) value = calculateAbilityBonus(masteriesAbility) + proficiencyBonus;
        result = value;
    }
    const arroundedResult = Math.floor(result);
    return arroundedResult;
}

/**
    * Calcule le bonus total d'une compétence selon son niveau de maîtrise
    * @param masteryLevel 0 = non maîtrisé, 1 = demi-maîtrise, 2 = maîtrisé, 3 = expertise
    * @param abilityScore Score de la caractéristique
    * @param proficiencyBonus Bonus de maîtrise
    * @returns Le bonus total calculé
*/
export function calculateSkillBonus(masteryLevel: number, abilityScore: number, proficiencyBonus: number): number {
    const abilityModifier = Math.floor((abilityScore - 10) / 2);

    if (masteryLevel === 0) {
        // Pas de maîtrise : seulement le modificateur
        return abilityModifier;
    } else if (masteryLevel === 1) {
        // Demi-maîtrise : modificateur + (bonus de maîtrise / 2 arrondi à l'inférieur)
        return abilityModifier + Math.floor(proficiencyBonus / 2);
    } else if (masteryLevel === 2) {
        // Maîtrise : modificateur + bonus de maîtrise
        return abilityModifier + proficiencyBonus;
    } else if (masteryLevel === 3) {
        // Expertise : modificateur + (bonus de maîtrise * 2)
        return abilityModifier + proficiencyBonus * 2;
    }

    return abilityModifier;
};

/**
 * Vérifie si un personnage est un joueur
 * @param character Le personnage à vérifier
 * @returns true si le personnage est un joueur, sinon false
 */
export function isPlayer(character: Character): character is Player {
    return "progression" in character;
}

/**
 * Calcule le niveau à partir de l'expérience selon le tableau D&D 5e
 * @param experience Points d'expérience
 * @returns Niveau correspondant (1 à 20)
 */
export function getLevelFromExperience(experience: number): number {
    if (!experience || experience < 0) return MIN_LEVEL;

    // Parcourir le tableau pour trouver le niveau correspondant
    for (let level = MAX_LEVEL; level >= MIN_LEVEL; level--) {
        if (experience >= EXPERIENCE_TABLE[level]) {
            return level;
        }
    }

    return MIN_LEVEL;
}

/**
 * Retourne l'expérience minimale requise pour un niveau donné
 * @param level Niveau du personnage (1 à 20)
 * @returns Points d'expérience requis
 */
export function getExperienceForLevel(level: number): number {
    if (!level || level < MIN_LEVEL) return EXPERIENCE_TABLE[MIN_LEVEL];
    if (level > MAX_LEVEL) return EXPERIENCE_TABLE[MAX_LEVEL];

    return EXPERIENCE_TABLE[level];
}

/**
 * Vérifie si l'XP et le niveau sont synchronisés
 * @param experience Points d'expérience
 * @param level Niveau du personnage
 * @returns true si le niveau correspond à l'XP, false sinon
 */
export function isLevelXpSynced(experience: number, level: number): boolean {
    return getLevelFromExperience(experience) === level;
}

/**
 * Calcule le bonus de maîtrise à partir du niveau selon D&D 5e
 * @param level Niveau du personnage (1 à 20)
 * @returns Bonus de maîtrise (+2 à +6)
 */
export function getProficiencyBonusFromLevel(level: number): number {
    if (!level || level < MIN_LEVEL) return 2;
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
}

/**
 * Vérifie si le bonus de maîtrise et le niveau sont synchronisés
 * @param level Niveau du personnage
 * @param proficiencyBonus Bonus de maîtrise actuel
 * @returns true si le bonus correspond au niveau, false sinon
 */
export function isLevelProficiencyBonusSynced(level: number, proficiencyBonus: number): boolean {
    return getProficiencyBonusFromLevel(level) === proficiencyBonus;
}