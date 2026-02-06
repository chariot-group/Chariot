import { Character, Class, Player, Spell, Spellcasting } from "@/types/character";
import { calculateAbilityBonus, isPlayer } from "@/utils/global.utils";

/**
 * Vérifie si un sort de niveau 0 est présent dans la liste des sorts
 * @param spellcasting L'objet Spellcasting contenant la liste des sorts
 * @returns true si un sort de niveau 0 est présent, sinon false
 */
export function hasLevel0Spells(spellcasting: Spellcasting): boolean {
    return spellcasting.spells.some((spell) => spell.level === 0);
}

/**
 * Récupère la liste des sorts d'un niveau donné
 * @param selectedSpellcasting L'objet Spellcasting contenant la liste des sorts
 * @param level Le niveau des sorts à récupérer
 * @returns La liste des sorts du niveau spécifié
 */
export function getSpellByLevel(selectedSpellcasting: Spellcasting, level: number): Spell[] {
    if (!selectedSpellcasting) return [];
    return selectedSpellcasting.spells.filter((spell) => spell.level === level);
}

/**
 * Calcule le nombre de sorts préparés pour un personnage donné
 * @param selectedSpellcasting L'objet Spellcasting contenant la liste des sorts
 * @param character Le personnage pour lequel calculer le nombre de sorts préparés
 * @returns Le nombre total de sorts préparés
 */
export function numberSpellsPrepare(selectedSpellcasting: Spellcasting, character: Character): number {
    if (!selectedSpellcasting) return 0;
    let total: number = 0;

    if (isPlayer(character)) {
        const classObj: Class | undefined = (character as Player).class.find(
            (cls) => cls.name.toLocaleLowerCase() === selectedSpellcasting.className.toLocaleLowerCase(),
        );
        if (classObj?.name.toLocaleLowerCase() === "druid") {
            total = classObj.level + calculateAbilityBonus(character?.stats?.abilityScores?.wisdom);
        } else if (classObj?.name.toLocaleLowerCase() === "paladin") {
            total = Math.floor(classObj.level / 2) + calculateAbilityBonus(character?.stats?.abilityScores?.charisma);
        } else if (classObj?.name.toLocaleLowerCase() === "cleric") {
            total = classObj.level + calculateAbilityBonus(character?.stats?.abilityScores?.wisdom);
        } else if (classObj?.name.toLocaleLowerCase() === "mage") {
            total = classObj.level + calculateAbilityBonus(character?.stats?.abilityScores?.intelligence);
        }
    }

    return total;
}