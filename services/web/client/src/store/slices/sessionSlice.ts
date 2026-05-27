import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/index';
import type { SessionParticipant, SessionStatus } from '@/services/SessionService';
import {
    ROUND_DURATION_SECONDS,
    durationToRemainingSeconds,
    removeUntilCombatEndConditions,
    tickConditionEntries,
} from '@/components/initiativeTracker/conditionDuration';
import { buildBattleTurnKey, canUndoBattleTurn, sortInitiativeTrackerRows } from '@/components/initiativeTracker/utils';

export interface SessionInitBattleDraft {
    showAllOpponents: boolean;
    selectedGroupIds: string[];
    expandedGroupIds: string[];
    excludedMembersByGroup: Record<string, string[]>;
}

export type InitiativeTrackerCondition =
    | 'none'
    | 'prone'
    | 'grappled'
    | 'deafened'
    | 'blinded'
    | 'charmed'
    | 'frightened'
    | 'poisoned'
    | 'restrained'
    | 'stunned'
    | 'incapacitated'
    | 'unconscious'
    | 'invisible'
    | 'paralyzed'
    | 'petrified';

export type InitiativeTrackerConditionDurationUnit =
    | 'seconds'
    | 'minutes'
    | 'hours'
    | 'rounds'
    | 'untilCombatEnd';

export interface InitiativeTrackerConditionDuration {
    amount: number;
    unit: InitiativeTrackerConditionDurationUnit;
}

export interface InitiativeTrackerConditionEntry {
    condition: Exclude<InitiativeTrackerCondition, 'none'>;
    duration?: InitiativeTrackerConditionDuration;
    /** Temps restant en secondes de jeu (minimum 6 s). */
    remainingSeconds?: number;
}

export function normalizeInitiativeTrackerConditionEntry(
    entry: unknown,
): InitiativeTrackerConditionEntry | null {
    if (typeof entry === 'string' && entry !== 'none') {
        return { condition: entry as Exclude<InitiativeTrackerCondition, 'none'> };
    }

    if (!entry || typeof entry !== 'object' || !('condition' in entry)) {
        return null;
    }

    const candidate = entry as InitiativeTrackerConditionEntry;
    if (!candidate.condition) {
        return null;
    }

    if (!candidate.duration) {
        return { condition: candidate.condition };
    }

    const { amount, unit } = candidate.duration;
    if (unit === 'untilCombatEnd') {
        return { condition: candidate.condition, duration: { amount: 1, unit } };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return { condition: candidate.condition };
    }

    const duration = { amount, unit };
    return {
        condition: candidate.condition,
        duration,
        remainingSeconds: durationToRemainingSeconds(duration),
    };
}

export interface InitiativeTrackerRow {
    id: string;
    characterId: string;
    firstname: string;
    lastname: string;
    surname: string;
    avatar: string;
    initiative: number;
    hitPoints: number;
    armorClass: number;
    conditions: InitiativeTrackerConditionEntry[];
    groupId: string;
    groupLabel: string;
    visible: boolean;
}

const initialInitBattleDraft: SessionInitBattleDraft = {
    showAllOpponents: false,
    selectedGroupIds: [],
    expandedGroupIds: [],
    excludedMembersByGroup: {},
};

export interface CurrentSessionState {
    code: string | null;
    campaignId: string | null;
    isInSession: boolean;
    status: SessionStatus | null;
    expiresAt: string | null;
    participants: SessionParticipant[];
    tokensByUser: Record<string, number>;
    initBattleDraft: SessionInitBattleDraft;
    initiativeTrackerRows: InitiativeTrackerRow[];
    battleInitialized: boolean;
    battleStarted: boolean;
    /** Id de la ligne dont c'est le tour (null tant que le combat n'est pas lancé). */
    activeTurnRowId: string | null;
    /** Numéro de tour de combat (incrémenté quand tous les participants ont joué). */
    currentRound: number;
    /** Clés `${round}:${rowId}` des tours où une action tracker a été effectuée. */
    turnsWithActions: string[];
    /** Incrémenté à chaque synchro WS distante pour une fiche (temps réel hors rechargement). */
    characterSheetRemoteVersions: Record<string, number>;
}

const initialState: CurrentSessionState = {
    code: null,
    campaignId: null,
    isInSession: false,
    status: null,
    expiresAt: null,
    participants: [],
    tokensByUser: {},
    initBattleDraft: initialInitBattleDraft,
    initiativeTrackerRows: [],
    battleInitialized: false,
    battleStarted: false,
    activeTurnRowId: null,
    currentRound: 1,
    turnsWithActions: [],
    characterSheetRemoteVersions: {},
};

const resetBattleTurnState = (state: CurrentSessionState) => {
    state.battleStarted = false;
    state.activeTurnRowId = null;
    state.currentRound = 1;
    state.turnsWithActions = [];
};

const markActiveTurnWithActions = (state: CurrentSessionState) => {
    if (!state.battleStarted || !state.activeTurnRowId) return;

    const turnKey = buildBattleTurnKey(state.currentRound, state.activeTurnRowId);
    if (!state.turnsWithActions.includes(turnKey)) {
        state.turnsWithActions.push(turnKey);
    }
};

const tickAllInitiativeTrackerConditions = (state: CurrentSessionState, deltaSeconds: number) => {
    for (const row of state.initiativeTrackerRows) {
        row.conditions = tickConditionEntries(row.conditions ?? [], deltaSeconds);
    }
};

const clearUntilCombatEndConditions = (state: CurrentSessionState) => {
    for (const row of state.initiativeTrackerRows) {
        row.conditions = removeUntilCombatEndConditions(row.conditions ?? []);
    }
};

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setCurrentSession: (state, action: PayloadAction<{ code: string; campaignId: string }>) => {
            state.code = action.payload.code;
            state.campaignId = action.payload.campaignId;
            state.isInSession = true;
        },
        clearCurrentSession: (state) => {
            state.code = null;
            state.campaignId = null;
            state.isInSession = false;
            state.status = null;
            state.expiresAt = null;
            state.participants = [];
            state.tokensByUser = {};
            state.initBattleDraft = initialInitBattleDraft;
            state.initiativeTrackerRows = [];
            state.battleInitialized = false;
            resetBattleTurnState(state);
            state.characterSheetRemoteVersions = {};
        },
        setSessionStatus: (state, action: PayloadAction<SessionStatus>) => {
            state.status = action.payload;
        },
        setSessionExpiresAt: (state, action: PayloadAction<string | null>) => {
            state.expiresAt = action.payload;
        },
        setSessionParticipants: (state, action: PayloadAction<SessionParticipant[]>) => {
            state.participants = action.payload;
        },
        /** Retire un participant du roster (ex. événement WS hors page session). */
        removeSessionParticipantByUserId: (state, action: PayloadAction<string>) => {
            const userId = action.payload;
            state.participants = state.participants.filter((p) => p.userId !== userId);
        },
        setSessionTokensByUser: (state, action: PayloadAction<Record<string, number>>) => {
            state.tokensByUser = action.payload;
        },
        setSessionInitBattleDraft: (state, action: PayloadAction<Partial<SessionInitBattleDraft>>) => {
            state.initBattleDraft = {
                ...state.initBattleDraft,
                ...action.payload,
            };
        },
        resetSessionInitBattleDraft: (state) => {
            state.initBattleDraft = initialInitBattleDraft;
        },
        setInitiativeTrackerRows: (state, action: PayloadAction<InitiativeTrackerRow[]>) => {
            state.initiativeTrackerRows = action.payload;
            state.battleInitialized = action.payload.length > 0;
            resetBattleTurnState(state);
        },
        updateInitiativeTrackerRow: (
            state,
            action: PayloadAction<{ id: string; changes: Partial<Omit<InitiativeTrackerRow, 'id'>> }>,
        ) => {
            const row = state.initiativeTrackerRows.find((item) => item.id === action.payload.id);
            if (!row) return;
            Object.assign(row, action.payload.changes);
            if (state.battleStarted) {
                markActiveTurnWithActions(state);
            }
        },
        resetInitiativeTracker: (state) => {
            state.initiativeTrackerRows = [];
            state.battleInitialized = false;
            resetBattleTurnState(state);
        },
        startBattle: (state) => {
            if (state.initiativeTrackerRows.length === 0) return;
            state.battleStarted = true;
            state.currentRound = 1;
            state.turnsWithActions = [];
            const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
            state.activeTurnRowId = sorted[0]?.id ?? null;
        },
        endBattle: (state) => {
            clearUntilCombatEndConditions(state);
            resetBattleTurnState(state);
        },
        nextBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
            const currentIndex = sorted.findIndex((row) => row.id === state.activeTurnRowId);
            const safeIndex = currentIndex >= 0 ? currentIndex : 0;

            if (safeIndex >= sorted.length - 1) {
                state.activeTurnRowId = sorted[0]?.id ?? null;
                state.currentRound += 1;
                tickAllInitiativeTrackerConditions(state, -ROUND_DURATION_SECONDS);
            } else {
                state.activeTurnRowId = sorted[safeIndex + 1]?.id ?? null;
            }
        },
        previousBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
            if (!canUndoBattleTurn(sorted, state.currentRound, state.activeTurnRowId, state.turnsWithActions)) {
                return;
            }

            const currentIndex = sorted.findIndex((row) => row.id === state.activeTurnRowId);
            const safeIndex = currentIndex >= 0 ? currentIndex : 0;

            if (safeIndex <= 0) {
                if (state.currentRound <= 1) return;
                state.activeTurnRowId = sorted[sorted.length - 1]?.id ?? null;
                state.currentRound -= 1;
                tickAllInitiativeTrackerConditions(state, ROUND_DURATION_SECONDS);
            } else {
                state.activeTurnRowId = sorted[safeIndex - 1]?.id ?? null;
            }
        },
        touchRemoteCharacterSheet: (state, action: PayloadAction<string>) => {
            if (!state.characterSheetRemoteVersions) {
                state.characterSheetRemoteVersions = {};
            }
            const id = action.payload.trim();
            if (!id) return;
            state.characterSheetRemoteVersions[id] = (state.characterSheetRemoteVersions[id] ?? 0) + 1;
        },
    },
});

export const {
    setCurrentSession,
    clearCurrentSession,
    setSessionStatus,
    setSessionExpiresAt,
    setSessionParticipants,
    removeSessionParticipantByUserId,
    setSessionTokensByUser,
    setSessionInitBattleDraft,
    resetSessionInitBattleDraft,
    setInitiativeTrackerRows,
    updateInitiativeTrackerRow,
    resetInitiativeTracker,
    startBattle,
    endBattle,
    nextBattleTurn,
    previousBattleTurn,
    touchRemoteCharacterSheet,
} = sessionSlice.actions;

export const selectCurrentSession = (state: RootState) => state.session;
export const selectIsInSession = (state: RootState) => state.session.isInSession;
export const selectSessionCode = (state: RootState) => state.session.code;
export const selectSessionCampaignId = (state: RootState) => state.session.campaignId;
export const selectSessionStatus = (state: RootState) => state.session.status;
export const selectSessionExpiresAt = (state: RootState) => state.session.expiresAt;
export const selectSessionParticipants = (state: RootState) => state.session.participants;
export const selectSessionInitBattleDraft = (state: RootState) => state.session.initBattleDraft;
export const selectInitiativeTrackerRows = (state: RootState) => state.session.initiativeTrackerRows;
export const selectBattleInitialized = (state: RootState) => state.session.battleInitialized;
export const selectBattleStarted = (state: RootState) => state.session.battleStarted;
export const selectActiveTurnRowId = (state: RootState) => state.session.activeTurnRowId;
export const selectCurrentRound = (state: RootState) => state.session.currentRound;
export const selectTurnsWithActions = (state: RootState) => state.session.turnsWithActions ?? [];
export const selectCurrentTurnHasActions = (state: RootState) => {
    const { currentRound, activeTurnRowId, battleStarted, turnsWithActions } = state.session;
    if (!battleStarted || !activeTurnRowId) return false;
    return (turnsWithActions ?? []).includes(buildBattleTurnKey(currentRound, activeTurnRowId));
};

export const selectCurrentUserParticipant = (state: RootState, userId: string) =>
    state.session.participants.find((participant: SessionParticipant) => participant.userId === userId) || null;

export const selectSessionTokensByUser = (state: RootState) => state.session.tokensByUser;
export const selectCharacterSheetRemoteVersions = (state: RootState) =>
    state.session.characterSheetRemoteVersions ?? {};

export default sessionSlice.reducer;
