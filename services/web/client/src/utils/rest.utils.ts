import type { Player } from "@/types/character";

/**
 * Construit le corps PATCH pour un repos long PJ (toutes les structures imbriquées
 * nécessaires afin de ne pas écraser d’autres champs côté API).
 */
export function buildLongRestUpdatePayload(player: Player): Pick<Player, "stats" | "spellcasting" | "abilities" | "exhaustionLevel"> {
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

        const spells = (sc.spells ?? []).map((spell) =>
            spell.usesPerDay != null ? { ...spell, used: 0 } : spell,
        );

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

    return { stats, spellcasting, abilities, exhaustionLevel };
}
