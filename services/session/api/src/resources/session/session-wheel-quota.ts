/**
 * Invariant de quota wheels en lobby (FR-session-lobby-wheel-quota-invariant).
 */

export function sumTokenMap(tokensByUser: Record<string, number>): number {
    return Object.values(tokensByUser).reduce((sum, count) => {
        const n = Math.max(0, Math.floor(Number(count) || 0));
        return sum + n;
    }, 0);
}

/**
 * Réduit les dépôts jusqu’à `maxSlots` : d’abord les plus gros dépôts,
 * égalité → `userId` croissant.
 */
export function clampTokensToParticipantQuota(
    tokensByUser: Record<string, number>,
    maxSlots: number,
): { tokens: Record<string, number>; released: number } {
    const sanitized: Record<string, number> = {};
    for (const [userId, count] of Object.entries(tokensByUser)) {
        const n = Math.max(0, Math.floor(Number(count) || 0));
        if (n > 0) sanitized[userId] = n;
    }

    const total = sumTokenMap(sanitized);
    const target = Math.max(0, Math.floor(maxSlots));
    if (total <= target) {
        return { tokens: sanitized, released: 0 };
    }

    let excess = total - target;
    const order = Object.keys(sanitized).sort((a, b) => {
        const byDeposit = sanitized[b]! - sanitized[a]!;
        if (byDeposit !== 0) return byDeposit;
        return a.localeCompare(b);
    });

    for (const userId of order) {
        if (excess <= 0) break;
        const current = sanitized[userId]!;
        const take = Math.min(current, excess);
        const next = current - take;
        excess -= take;
        if (next <= 0) {
            delete sanitized[userId];
        } else {
            sanitized[userId] = next;
        }
    }

    return { tokens: sanitized, released: total - target };
}
