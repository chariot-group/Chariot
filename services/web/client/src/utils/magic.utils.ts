import { Character, Class, Player, Spell, Spellcasting } from "@/types/character";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";

/** Classes that use the prepared-spells mechanic */
export const CLASSES_WITH_SPELL_PREPARED = ["artificer", "cleric", "druid", "paladin", "wizard"] as const;


export const SPELL_SCHOOLS = [
    "Abjuration",
    "Conjuration",
    "Divination",
    "Enchantement",
    "Évocation",
    "Illusion",
    "Nécromancie",
    "Transmutation",
];

export const DICE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

/**
 * Vérifie si un sort de niveau 0 est présent dans la liste des sorts
 */
export function hasLevel0Spells(spellcasting: Spellcasting): boolean {
    return spellcasting.spells.some((spell) => spell.level === 0);
}

/**
 * Récupère la liste des sorts d'un niveau donné
 */
export function getSpellByLevel(selectedSpellcasting: Spellcasting, level: number): Spell[] {
    if (!selectedSpellcasting) return [];
    return selectedSpellcasting.spells.filter((spell) => spell.level === level);
}

/**
 * Calcule le nombre de sorts préparés à partir des données brutes
 * (utilisé tant dans la vue que dans l'édition)
 *
 * @param className   Nom de la classe d'incantation
 * @param classLevel  Niveau dans cette classe
 * @param abilityScores  Scores de caractéristique complet
 */
export function calculatePreparedSpells(
    className: string,
    classLevel: number,
    abilityScores: { intelligence?: number; wisdom?: number; charisma?: number },
): number {
    if (!classLevel) return 0;
    const name = className.toLowerCase();
    if (name === "druid" || name === "cleric") {
        return classLevel + calculateAbilityBonus(abilityScores.wisdom ?? 10);
    }
    if (name === "wizard") {
        return classLevel + calculateAbilityBonus(abilityScores.intelligence ?? 10);
    }
    if (name === "paladin") {
        return Math.floor(classLevel / 2) + calculateAbilityBonus(abilityScores.charisma ?? 10);
    }
    if (name === "artificer") {
        return Math.floor(classLevel / 2) + calculateAbilityBonus(abilityScores.intelligence ?? 10);
    }
    return 0;
}

/**
 * Calcule le nombre de sorts préparés pour un personnage donné (wrapper vue)
 */
export function numberSpellsPrepare(selectedSpellcasting: Spellcasting, character: Character): number {
    if (!selectedSpellcasting) return 0;
    if (!isPlayer(character)) return 0;

    const classObj: Class | undefined = (character as Player).class.find(
        (cls) => cls.name.toLowerCase() === selectedSpellcasting.className.toLowerCase(),
    );
    if (!classObj) return 0;

    return calculatePreparedSpells(
        classObj.name,
        classObj.level,
        character.stats?.abilityScores ?? {},
    );
}

/**
 * Calcule le DD de sauvegarde de sort
 * DD = 8 + bonus de maîtrise + modificateur de caractéristique
 */
export function calculateSpellSaveDC(proficiencyBonus: number, abilityScore: number): number {
    return 8 + proficiencyBonus + calculateAbilityBonus(abilityScore);
}

/**
 * Calcule le bonus d'attaque de sort
 * Bonus = bonus de maîtrise + modificateur de caractéristique
 */
export function calculateSpellAttackBonus(proficiencyBonus: number, abilityScore: number): number {
    return proficiencyBonus + calculateAbilityBonus(abilityScore);
}

/**
 * Vérifie si une classe utilise des sorts préparés
 */
export function classWithSpellPrepared(spellCasting: Spellcasting): boolean {
    return CLASSES_WITH_SPELL_PREPARED.includes(
        spellCasting.className.toLowerCase() as (typeof CLASSES_WITH_SPELL_PREPARED)[number],
    );
}