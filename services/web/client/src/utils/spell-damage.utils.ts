/**
 * Parse a damage/healing string like "3d8+2 lightning" or "1d6" into structured components
 * @param formula - The damage formula string (e.g., "3d8+2 lightning", "1d6-1", "2d10")
 * @returns An object with diceCount, diceType, bonus, and damageType (if present)
 */
export function parseDamageFormula(formula: string | null | undefined): {
    diceCount: number | null;
    diceType: string | null;
    bonus: number | null;
    damageType: string | null;
} {
    if (!formula || typeof formula !== 'string' || formula.trim() === '') {
        return { diceCount: null, diceType: null, bonus: null, damageType: null };
    }

    // Regex to match patterns like "3d8+2 lightning" or "1d6-1" or "2d10"
    // Groups: (diceCount)d(diceType)(+/-bonus)? (damageType)?
    const regex = /^(\d+)d(\d+|%|100)([+-]\d+)?\s*(.*)$/i;
    const match = formula.trim().match(regex);

    if (!match) {
        return { diceCount: null, diceType: null, bonus: null, damageType: null };
    }

    const diceCount = parseInt(match[1], 10);
    let diceType = match[2];

    // Normalize dice type
    if (diceType === '%' || diceType === '100') {
        diceType = 'd100';
    } else {
        diceType = `d${diceType}`;
    }

    const bonusString = match[3];
    const bonus = bonusString ? parseInt(bonusString, 10) : null;

    const damageType = match[4]?.trim() || null;

    return {
        diceCount: isNaN(diceCount) ? null : diceCount,
        diceType,
        bonus: bonus === null || isNaN(bonus) ? null : bonus,
        damageType: damageType || null,
    };
}

/**
 * Format structured damage/healing components into a readable string like "3d8+2 lightning"
 * @param diceCount - Number of dice
 * @param diceType - Type of dice (e.g., "d6", "d8")
 * @param bonus - Bonus modifier (can be positive or negative)
 * @param damageType - Type of damage (optional, e.g., "lightning", "fire")
 * @returns Formatted string or null if no valid data
 */
export function formatDamageFormula(
    diceCount: number | null | undefined,
    diceType: string | null | undefined,
    bonus: number | null | undefined,
    damageType?: string | null
): string | null {
    // Need at least dice information
    if (!diceCount || !diceType) {
        return null;
    }

    let formula = `${diceCount}${diceType}`;

    if (bonus !== null && bonus !== undefined && bonus !== 0) {
        if (bonus > 0) {
            formula += `+${bonus}`;
        } else {
            formula += `${bonus}`;
        }
    }

    if (damageType && damageType.trim() !== '') {
        formula += ` ${damageType.trim()}`;
    }

    return formula;
}
