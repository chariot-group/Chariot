import type { BattleStateSnapshot } from '@/store/slices/sessionSlice';

/** Planificateur défini par le client session (effet acquisition socket). */
let battleStateBroadcastScheduler: ((snapshot: BattleStateSnapshot) => void) | null = null;

/** Réponse du MJ à une demande de snapshot (reconnexion / nouveau joueur). */
let battleStateRequestResponder: (() => BattleStateSnapshot | null) | null = null;

export function registerBattleStateBroadcastScheduler(
    scheduler: ((snapshot: BattleStateSnapshot) => void) | null,
): void {
    battleStateBroadcastScheduler = scheduler;
}

export function registerBattleStateRequestResponder(
    responder: (() => BattleStateSnapshot | null) | null,
): void {
    battleStateRequestResponder = responder;
}

export function emitBattleStateUpdate(snapshot: BattleStateSnapshot): void {
    battleStateBroadcastScheduler?.(snapshot);
}

export function respondToBattleStateRequest(): BattleStateSnapshot | null {
    return battleStateRequestResponder?.() ?? null;
}
