import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/index';
import type { SessionParticipant, SessionStatus } from '@/services/SessionService';

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
    conditions: InitiativeTrackerCondition[];
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
    characterSheetRemoteVersions: {},
};

const resetBattleTurnState = (state: CurrentSessionState) => {
    state.battleStarted = false;
    state.activeTurnRowId = null;
    state.currentRound = 1;
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
            const sorted = [...state.initiativeTrackerRows].sort(
                (a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel),
            );
            state.activeTurnRowId = sorted[0]?.id ?? null;
        },
        endBattle: (state) => {
            resetBattleTurnState(state);
        },
        nextBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = [...state.initiativeTrackerRows].sort(
                (a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel),
            );
            const currentIndex = sorted.findIndex((row) => row.id === state.activeTurnRowId);
            const safeIndex = currentIndex >= 0 ? currentIndex : 0;

            if (safeIndex >= sorted.length - 1) {
                state.activeTurnRowId = sorted[0]?.id ?? null;
                state.currentRound += 1;
            } else {
                state.activeTurnRowId = sorted[safeIndex + 1]?.id ?? null;
            }
        },
        previousBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = [...state.initiativeTrackerRows].sort(
                (a, b) => b.initiative - a.initiative || a.groupLabel.localeCompare(b.groupLabel),
            );
            const currentIndex = sorted.findIndex((row) => row.id === state.activeTurnRowId);
            const safeIndex = currentIndex >= 0 ? currentIndex : 0;

            if (safeIndex <= 0) {
                if (state.currentRound <= 1) return;
                state.activeTurnRowId = sorted[sorted.length - 1]?.id ?? null;
                state.currentRound -= 1;
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

export const selectCurrentUserParticipant = (state: RootState, userId: string) =>
    state.session.participants.find((participant: SessionParticipant) => participant.userId === userId) || null;

export const selectSessionTokensByUser = (state: RootState) => state.session.tokensByUser;
export const selectCharacterSheetRemoteVersions = (state: RootState) =>
    state.session.characterSheetRemoteVersions ?? {};

export default sessionSlice.reducer;
