import type { CharacterWriteData } from "@/services/CharacterService";
import type { Ability, Character, Class, NPC, Player, Spellcasting } from "@/types/character";

export function hitDieSide(c: Class): number {
    const n = c.hitDice;
    return typeof n === "number" && n > 0 ? n : 8;
}

/** Dés de vie restants pour une entrée de classe (donnée persistée ou niveau par défaut). */
export function getHitDiceRemainingForClass(c: Class): number {
    const level = Math.max(0, Math.floor(c.level ?? 0));
    if (level === 0) return 0;
    const stored = c.hitDiceRemaining;
    if (typeof stored === "number" && !Number.isNaN(stored)) {
        return Math.max(0, Math.min(level, Math.floor(stored)));
    }
    return level;
}

function resetWarlockSpellSlots(sc: Spellcasting): Spellcasting {
    const byLevel = { ...(sc.spellSlotsByLevel ?? {}) };
    for (const key of Object.keys(byLevel)) {
        const slot = byLevel[key];
        if (slot && typeof slot === "object") {
            byLevel[key] = { ...slot, used: 0 };
        }
    }
    let spellSlotsByUses = sc.spellSlotsByUses;
    if (spellSlotsByUses && typeof spellSlotsByUses === "object" && !Array.isArray(spellSlotsByUses)) {
        spellSlotsByUses = { ...spellSlotsByUses };
        for (const key of Object.keys(spellSlotsByUses)) {
            const v = spellSlotsByUses[key];
            if (typeof v === "number") {
                spellSlotsByUses[key] = 0;
            }
        }
    }
    return { ...sc, spellSlotsByLevel: byLevel, spellSlotsByUses };
}

export interface ShortRestHitDiceRoll {
    classIndex: number;
    value: number;
}

function isPlayer(character: Character): character is Player {
    return "progression" in character;
}

function resetLongRestSpellcasting(list: Spellcasting[] | undefined): Spellcasting[] {
    return (list ?? []).map((sc) => {
        const reset = resetWarlockSpellSlots(sc);
        const spells = (sc.spells ?? []).map((spell) => (spell.usesPerDay != null ? { ...spell, used: 0 } : spell));
        return { ...reset, spells };
    });
}

function resetLongRestAbilities(list: Ability[] | undefined): Ability[] {
    return (list ?? []).map((a) => (a.hasCounter && a.counterResetsOnLongRest === true ? { ...a, counterCurrent: 0 } : a));
}

/**
 * Corps PATCH commun PJ / PNJ d'un repos long : PV au max, PV temporaires à 0,
 * compteurs « repos long » et ressources de sorts rechargés.
 * @see FR-character-long-rest
 */
export function buildBaseLongRestUpdatePayload(
    character: Character,
): Pick<Character, "stats" | "spellcasting" | "abilities"> {
    return {
        stats: {
            ...character.stats,
            currentHitPoints: character.stats.maxHitPoints,
            tempHitPoints: 0,
        },
        spellcasting: resetLongRestSpellcasting(character.spellcasting),
        abilities: resetLongRestAbilities(character.abilities),
    };
}

/**
 * Construit le corps PATCH pour un repos long PJ (toutes les structures imbriquées
 * nécessaires afin de ne pas écraser d’autres champs côté API).
 * @see FR-character-long-rest
 */
export function buildLongRestUpdatePayload(
    player: Player,
): Pick<Player, "stats" | "spellcasting" | "abilities" | "exhaustionLevel" | "class"> {
    const common = buildBaseLongRestUpdatePayload(player);
    const exhaustionLevel = player.exhaustionLevel > 0 ? player.exhaustionLevel - 1 : player.exhaustionLevel;

    const classList = (player.class ?? []).map((c) => ({
        ...c,
        hitDiceRemaining: Math.max(0, Math.floor(c.level ?? 0)),
    }));

    return { ...common, stats: { ...player.stats, ...common.stats }, exhaustionLevel, class: classList };
}

/** Payload PATCH du repos long selon le type de personnage. @see FR-character-long-rest */
export function buildCharacterLongRestUpdatePayload(character: Player | NPC): CharacterWriteData {
    return (isPlayer(character)
        ? buildLongRestUpdatePayload(character)
        : buildBaseLongRestUpdatePayload(character)) as CharacterWriteData;
}

export type LongRestEffect = "spell-slots" | "abilities" | "hit-dice" | "hp" | "temp-hp" | "exhaustion";

/** Effets qui changent réellement quelque chose pour ce personnage (dialogue de confirmation). */
export function getLongRestEffects(character: Player | NPC): LongRestEffect[] {
    const effects: LongRestEffect[] = [];
    const hasSpellRecovery = (character.spellcasting ?? []).some((sc) => {
        const byLevel = Object.values(sc.spellSlotsByLevel ?? {}).some((slot) => (slot?.used ?? 0) > 0);
        const byDay = (sc.spells ?? []).some((spell) => spell.usesPerDay != null && (spell.used ?? 0) > 0);
        const byUses = Object.values(sc.spellSlotsByUses ?? {}).some((used) => typeof used === "number" && used > 0);
        return byLevel || byDay || byUses;
    });
    if (hasSpellRecovery) effects.push("spell-slots");
    if (
        (character.abilities ?? []).some(
            (a) => a.hasCounter === true && a.counterResetsOnLongRest === true && (a.counterCurrent ?? 0) > 0,
        )
    ) {
        effects.push("abilities");
    }
    if (
        isPlayer(character) &&
        (character.class ?? []).some(
            (c) => getHitDiceRemainingForClass(c) < Math.max(0, Math.floor(c.level ?? 0)),
        )
    ) {
        effects.push("hit-dice");
    }
    if (character.stats.currentHitPoints < character.stats.maxHitPoints) effects.push("hp");
    if (character.stats.tempHitPoints > 0) effects.push("temp-hp");
    if (isPlayer(character) && character.exhaustionLevel > 0) effects.push("exhaustion");
    return effects;
}

export interface LongRestAvailabilityInput {
    isPlayerCharacter: boolean;
    isSessionLaunched: boolean;
    isPlayerSpace: boolean;
    /** Le personnage appartient à l'utilisateur courant (`createdBy`). */
    isOwnCharacter: boolean;
}

/**
 * Repos long disponible sur une fiche : en session comme avant (PJ), et hors session
 * uniquement dans l'espace MJ pour ses propres personnages. Un PNJ n'est reposé que depuis l'espace MJ.
 * @see FR-character-long-rest
 */
export function canUseLongRest({
    isPlayerCharacter,
    isSessionLaunched,
    isPlayerSpace,
    isOwnCharacter,
}: LongRestAvailabilityInput): boolean {
    if (!isPlayerCharacter && isPlayerSpace) return false;
    if (isSessionLaunched) return true;
    return !isPlayerSpace && isOwnCharacter;
}

/**
 * Repos court : compteurs repos court, emplacements occultiste, soins par dés de vie (optionnel).
 */
export function buildShortRestUpdatePayload(
    player: Player,
    hitDiceRolls: ShortRestHitDiceRoll[],
): Pick<Player, "stats" | "spellcasting" | "abilities" | "class"> {
    const classes = [...(player.class ?? [])];

    const remainingBefore = classes.map((c) => getHitDiceRemainingForClass(c));
    const spentByClass: number[] = classes.map(() => 0);

    for (const roll of hitDiceRolls) {
        const idx = roll.classIndex;
        if (idx < 0 || idx >= classes.length) {
            throw new Error("Invalid class index for hit die");
        }
        const side = hitDieSide(classes[idx]);
        if (!Number.isInteger(roll.value) || roll.value < 1 || roll.value > side) {
            throw new Error("Invalid hit die value");
        }
        spentByClass[idx] += 1;
        if (spentByClass[idx] > remainingBefore[idx]) {
            throw new Error("Not enough hit dice");
        }
    }

    const abilities = (player.abilities ?? []).map((a) => {
        if (a.hasCounter && a.counterResetsOnShortRest === true) {
            return { ...a, counterCurrent: 0 };
        }
        return a;
    });

    const spellcasting = (player.spellcasting ?? []).map((sc) =>
        sc.className?.toLowerCase() === "warlock" ? resetWarlockSpellSlots(sc) : sc,
    );

    const healing = hitDiceRolls.reduce((s, r) => s + r.value, 0);
    const newHp = Math.min(
        player.stats.maxHitPoints,
        Math.max(0, player.stats.currentHitPoints) + healing,
    );

    const classUpdated = classes.map((c, i) => ({
        ...c,
        hitDiceRemaining: Math.max(0, remainingBefore[i] - spentByClass[i]),
    }));

    return {
        abilities,
        spellcasting,
        class: classUpdated,
        stats: {
            ...player.stats,
            currentHitPoints: newHp,
        },
    };
}

/**
 * Aperçu des PV récupérés pendant la saisie d'un repos court : somme des valeurs
 * de dés déjà valides (entier dans [1, face du dé]) ; une saisie vide ou invalide compte pour 0.
 */
export function sumShortRestHitDicePreview(
    rows: ReadonlyArray<{ classIndex: number; value: string }>,
    classesList: ReadonlyArray<Class>,
): number {
    let total = 0;
    for (const row of rows) {
        const c = classesList[row.classIndex];
        if (!c) continue;
        const v = Number.parseInt(row.value.trim(), 10);
        if (Number.isInteger(v) && v >= 1 && v <= hitDieSide(c)) total += v;
    }
    return total;
}
