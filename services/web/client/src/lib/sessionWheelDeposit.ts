/** Pure helpers for session lobby wheel deposit limits (FR-user-balance-history, FR-session-lobby-wheel-deposit). */

export function computeMaxAddableWheels(params: {
    balance: number;
    myDeposited: number;
    totalDeposited: number;
    maxSlots: number;
}): number {
    const { balance, myDeposited, totalDeposited, maxSlots } = params;
    return Math.max(0, Math.min(balance - myDeposited, maxSlots - totalDeposited));
}

export function computeDepositRemainingAmount(params: {
    balance: number;
    myDeposited: number;
    totalDeposited: number;
    maxSlots: number;
}): number {
    return computeMaxAddableWheels(params);
}

export function clampWheelAmount(amount: number, max: number): number {
    const safe = Math.max(0, Math.floor(amount));
    if (max <= 0) return 0;
    return Math.min(safe, max);
}

export function computeWheelProgressPercent(totalDeposited: number, maxSlots: number): number {
    if (maxSlots <= 0) return 0;
    return Math.min(100, Math.round((totalDeposited / maxSlots) * 100));
}

export function computeRemainingBalanceAfterDeposit(balance: number, myDeposited: number): number {
    return Math.max(0, balance - myDeposited);
}

export function sumDepositedWheels(tokensByUser: Record<string, number>): number {
    return Object.values(tokensByUser).reduce((sum, count) => sum + count, 0);
}
