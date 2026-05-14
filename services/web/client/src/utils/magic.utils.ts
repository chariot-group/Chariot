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
    return selectedSpellcasting.spells.filter((spell) => Number(spell.level) === level);
}

/**
 * Trie les sorts d’un même niveau : préparés d’abord (si mécanique active), puis par nom.
 */
export function sortSpellsPreparedFirst(spells: Spell[], spellLevel: number, appliesPreparedMechanic: boolean): Spell[] {
    const copy = [...spells];
    if (spellLevel <= 0 || !appliesPreparedMechanic) {
        copy.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
        return copy;
    }
    copy.sort((a, b) => {
        const pa = a.prepared === true ? 0 : 1;
        const pb = b.prepared === true ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
    return copy;
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

/**
 * Nombre de sorts de niveau ≥ 1 marqués comme préparés (`prepared === true`).
 */
export function countPreparedSpellsInList(spells: Spell[]): number {
    return spells.filter((s) => Number(s.level) > 0 && s.prepared === true).length;
}

/**
 * Pour une classe à sorts préparés : un sort de niveau ≥ 1 n’est lançable que s’il est explicitement préparé.
 */
export function canCastSpellWithPreparedRules(spell: Spell, spellcasting: Spellcasting): boolean {
    if ((spell.level ?? 0) === 0) return true;
    if (!classWithSpellPrepared(spellcasting)) return true;
    return spell.prepared === true;
}

// ─── NPC spell helpers ────────────────────────────────────────────────────────

/**
 * Sentinel value for "at will" spells in NPC spellcasting.
 * Stored as null / undefined on the spell, displayed as "À volonté".
 */
export const NPC_AT_WILL_KEY = "atWill" as const;

/**
 * Returns the sorted list of unique uses-per-day groups for a NPC spellcasting.
 * "At will" (null/undefined) comes first, then numeric groups sorted ascending.
 */
export function getNpcUsesGroups(spellcasting: Spellcasting): Array<number | null> {
    const seen = new Set<number | null>();
    for (const spell of spellcasting.spells) {
        const u = spell.usesPerDay ?? null;
        seen.add(u);
    }
    const groups = Array.from(seen);
    groups.sort((a, b) => {
        if (a === null) return -1;
        if (b === null) return 1;
        return a - b;
    });
    return groups;
}

/**
 * Returns spells for a given usesPerDay group.
 * Pass null for "at will" spells.
 * Spells are sorted alphabetically by name.
 */
export function getSpellsByUses(spellcasting: Spellcasting, usesPerDay: number | null): Spell[] {
    return spellcasting.spells
        .filter((spell) => (spell.usesPerDay ?? null) === usesPerDay)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns the accordion key for a uses-per-day group.
 */
export function npcUsesKey(usesPerDay: number | null): string {
    return usesPerDay === null ? "uses-atWill" : `uses-${usesPerDay}`;
}

/** Niveaux d’emplacements pour lesquels le personnage a au moins un emplacement total (> 0). */
export function getMasteredSpellSlotLevels(spellcasting: Spellcasting): number[] {
    const slots = spellcasting.spellSlotsByLevel;
    if (!slots) return [];
    const levels: number[] = [];
    for (const [key, entry] of Object.entries(slots)) {
        const level = Number(key);
        if (!Number.isFinite(level) || level < 1) continue;
        const total = entry?.total ?? 0;
        if (total > 0) levels.push(level);
    }
    levels.sort((a, b) => a - b);
    return levels;
}

/**
 * Niveaux d’emplacements utilisables pour un sort surcoaliser : strictement au-dessus du niveau du sort
 * et parmi les niveaux maîtrisés (emplacements total > 0).
 */
export function getUpcastSlotLevels(spellcasting: Spellcasting, spellBaseLevel: number): number[] {
    if (spellBaseLevel <= 0 || spellBaseLevel >= 9) return [];
    const mastered = getMasteredSpellSlotLevels(spellcasting);
    return mastered.filter((L) => L > spellBaseLevel);
}

export function getSpellSlotEntry(
    spellcasting: Spellcasting,
    level: number,
): { total: number; used: number } | null {
    const key = String(level);
    const slot = spellcasting.spellSlotsByLevel?.[key];
    if (!slot) return null;
    return { total: slot.total ?? 0, used: slot.used ?? 0 };
}

export function hasAvailableSpellSlot(spellcasting: Spellcasting, level: number): boolean {
    const s = getSpellSlotEntry(spellcasting, level);
    if (!s) return false;
    return s.used < s.total;
}

/** Incrémente `used` pour l’emplacement de niveau `slotLevel` sur la ligne d’incantation identifiée par `className`. */
export function incrementSpellSlotUsedInSpellcastingList(
    spellcastingList: Spellcasting[],
    className: string,
    slotLevel: number,
): Spellcasting[] {
    const key = String(slotLevel);
    const target = className.trim().toLowerCase();
    return spellcastingList.map((sc) => {
        if (sc.className.trim().toLowerCase() !== target) {
            return sc;
        }
        const slot = sc.spellSlotsByLevel?.[key];
        if (!slot) return sc;
        const nextUsed = (slot.used ?? 0) + 1;
        return {
            ...sc,
            spellSlotsByLevel: {
                ...sc.spellSlotsByLevel,
                [key]: {
                    ...slot,
                    used: nextUsed,
                },
            },
        };
    });
}

/** Index du sort (référence d’objet, puis nom + niveau + usesPerDay). */
export function findSpellIndexInList(spells: Spell[], selected: Spell): number {
    const byRef = spells.indexOf(selected);
    if (byRef >= 0) return byRef;
    return spells.findIndex(
        (s) =>
            s.name === selected.name &&
            s.level === selected.level &&
            (s.usesPerDay ?? null) === (selected.usesPerDay ?? null),
    );
}

/** Incrémente `used` sur un sort inné limité (usesPerDay défini). */
export function incrementNpcInnateSpellUses(
    spellcastingList: Spellcasting[],
    className: string,
    selectedSpell: Spell,
): Spellcasting[] {
    const targetClass = className.trim().toLowerCase();
    return spellcastingList.map((sc) => {
        if (sc.className.trim().toLowerCase() !== targetClass) return sc;
        const idx = findSpellIndexInList(sc.spells, selectedSpell);
        if (idx < 0) return sc;
        const s = sc.spells[idx];
        const max = s.usesPerDay;
        if (max == null) return sc;
        const used = s.used ?? 0;
        if (used >= max) return sc;
        const nextSpells = [...sc.spells];
        nextSpells[idx] = { ...s, used: used + 1 };
        return { ...sc, spells: nextSpells };
    });
}

/** Sort inné avec quota journalier : il reste au moins une utilisation. */
export function hasNpcInnateUsesRemaining(spell: Spell): boolean {
    const max = spell.usesPerDay;
    if (max == null) return false;
    return (spell.used ?? 0) < max;
}