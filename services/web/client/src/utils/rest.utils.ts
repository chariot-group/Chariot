import type { Class, Player, Spellcasting } from "@/types/character";

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

/**
 * Construit le corps PATCH pour un repos long PJ (toutes les structures imbriquées
 * nécessaires afin de ne pas écraser d’autres champs côté API).
 */
export function buildLongRestUpdatePayload(
    player: Player,
): Pick<Player, "stats" | "spellcasting" | "abilities" | "exhaustionLevel" | "class"> {
    const stats = {
        ...player.stats,
        currentHitPoints: player.stats.maxHitPoints,
        tempHitPoints: 0,
    };

    const spellcasting = (player.spellcasting ?? []).map((sc) => {
        const byLevel = { ...(sc.spellSlotsByLevel ?? {}) };
        for (const key of Object.keys(byLevel)) {
            const slot = byLevel[key];
            if (slot && typeof slot === "object") {
                byLevel[key] = { ...slot, used: 0 };
            }
        }

        const spells = (sc.spells ?? []).map((spell) => (spell.usesPerDay != null ? { ...spell, used: 0 } : spell));

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

        return { ...sc, spellSlotsByLevel: byLevel, spells, spellSlotsByUses };
    });

    const abilities = (player.abilities ?? []).map((a) => {
        if (a.hasCounter && a.counterResetsOnLongRest === true) {
            return { ...a, counterCurrent: 0 };
        }
        return a;
    });

    const exhaustionLevel = player.exhaustionLevel > 0 ? player.exhaustionLevel - 1 : player.exhaustionLevel;

    const classList = (player.class ?? []).map((c) => ({
        ...c,
        hitDiceRemaining: Math.max(0, Math.floor(c.level ?? 0)),
    }));

    return { stats, spellcasting, abilities, exhaustionLevel, class: classList };
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
