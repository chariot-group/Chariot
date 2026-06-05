import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/index';
import type { SessionParticipant, SessionStatus } from '@/services/SessionService';
import {
    ROUND_DURATION_SECONDS,
    durationToRemainingSeconds,
    removeUntilCombatEndConditions,
    tickConditionEntries,
} from '@/components/initiativeTracker/conditionDuration';
import { SESSION_PARTICIPANTS_GROUP_ID } from '@/components/initiativeTracker/constants';
import {
    buildBattleTurnKey,
    canUndoBattleTurn,
    defaultPlayerDisplayNameForRow,
    getInitiativeTrackerRowStatus,
    isSessionParticipantTrackerRow,
    sortInitiativeTrackerRows,
} from '@/components/initiativeTracker/utils';

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

export type InitiativeTrackerRowKind = 'player' | 'npc';

/** FR-015 — champs visibles pour les joueurs sur une ligne du tracker. */
export interface InitiativeTrackerPlayerFieldVisibility {
    initiative: boolean;
    name: boolean;
    hitPoints: boolean;
    armorClass: boolean;
    conditions: boolean;
    groupLabel: boolean;
}

export const DEFAULT_NPC_PLAYER_FIELD_VISIBILITY: InitiativeTrackerPlayerFieldVisibility = {
    initiative: false,
    name: true,
    hitPoints: false,
    armorClass: false,
    conditions: false,
    groupLabel: false,
};

export const DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY: InitiativeTrackerPlayerFieldVisibility = {
    initiative: true,
    name: true,
    hitPoints: true,
    armorClass: true,
    conditions: true,
    groupLabel: true,
};

export function defaultPlayerFieldVisibilityForKind(
    kind: InitiativeTrackerRowKind,
    groupId?: string,
): InitiativeTrackerPlayerFieldVisibility {
    if (kind === 'player' && groupId === SESSION_PARTICIPANTS_GROUP_ID) {
        return { ...DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY };
    }
    return { ...DEFAULT_NPC_PLAYER_FIELD_VISIBILITY };
}

export function normalizePlayerFieldVisibility(
    value: Partial<InitiativeTrackerPlayerFieldVisibility> | undefined,
    kind: InitiativeTrackerRowKind,
    groupId: string = '',
): InitiativeTrackerPlayerFieldVisibility {
    if (kind === 'player' && groupId === SESSION_PARTICIPANTS_GROUP_ID) {
        return { ...DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY };
    }

    const defaults = defaultPlayerFieldVisibilityForKind(kind, groupId);
    if (!value || typeof value !== 'object') {
        return defaults;
    }
    return {
        initiative: typeof value.initiative === 'boolean' ? value.initiative : defaults.initiative,
        name: typeof value.name === 'boolean' ? value.name : defaults.name,
        hitPoints: typeof value.hitPoints === 'boolean' ? value.hitPoints : defaults.hitPoints,
        armorClass: typeof value.armorClass === 'boolean' ? value.armorClass : defaults.armorClass,
        conditions: typeof value.conditions === 'boolean' ? value.conditions : defaults.conditions,
        groupLabel: typeof value.groupLabel === 'boolean' ? value.groupLabel : defaults.groupLabel,
    };
}

/** FR-015 — seuls les PJ du groupe « participants session » restent visibles et non masquables. */
export function applyPlayerRowVisibilityRules(row: InitiativeTrackerRow): InitiativeTrackerRow {
    if (!isSessionParticipantTrackerRow(row)) {
        return row;
    }
    return {
        ...row,
        visible: true,
        playerFieldVisibility: { ...DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY },
    };
}

/** FR-015 — snapshot diffusé par le MJ aux joueurs via WebSocket. */
export interface BattleStateSnapshot {
    initiativeTrackerRows: InitiativeTrackerRow[];
    battleInitialized: boolean;
    battleStarted: boolean;
    activeTurnRowId: string | null;
    currentRound: number;
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
    maxHitPoints: number;
    tempHitPoints: number;
    armorClass: number;
    conditions: InitiativeTrackerConditionEntry[];
    groupId: string;
    groupLabel: string;
    visible: boolean;
    /** FR-015 — alias affiché aux joueurs quand le vrai nom est masqué (non persisté sur la fiche). */
    playerDisplayName: string;
    /** FR-015 — visibilité granulaire des champs pour la vue joueur. */
    playerFieldVisibility: InitiativeTrackerPlayerFieldVisibility;
    /** FR-014 — discriminant pour appliquer la règle de mort/inconscience adaptée. */
    kind: InitiativeTrackerRowKind;
    /** FR-014 — miroir de `deathSaves.failures` (uniquement pertinent pour `kind === 'player'`). */
    deathSavesFailures: number;
}

/** FR-012 / FR-015 — fabrique une ligne tracker (setup ou ajout en cours de combat). */
export function createInitiativeTrackerRow(input: {
    groupId: string;
    groupLabel: string;
    characterId: string;
    firstname: string;
    lastname: string;
    surname: string;
    avatar?: string;
    initiative?: number;
    hitPoints: number;
    maxHitPoints: number;
    tempHitPoints?: number;
    armorClass: number;
    kind: InitiativeTrackerRowKind;
    deathSavesFailures?: number;
    visible?: boolean;
    playerFieldVisibility?: InitiativeTrackerPlayerFieldVisibility;
}): InitiativeTrackerRow {
    const firstname = input.firstname ?? '';
    const lastname = input.lastname ?? '';
    const surname = input.surname ?? '';
    const gmName = defaultPlayerDisplayNameForRow({ firstname, lastname, surname });

    return {
        id: `${input.groupId}:${input.characterId}`,
        characterId: input.characterId,
        firstname,
        lastname,
        surname,
        avatar: input.avatar ?? '',
        initiative: input.initiative ?? 0,
        hitPoints: input.hitPoints,
        maxHitPoints: input.maxHitPoints,
        tempHitPoints: input.tempHitPoints ?? 0,
        armorClass: input.armorClass,
        conditions: [],
        groupId: input.groupId,
        groupLabel: input.groupLabel,
        visible: input.visible ?? true,
        playerDisplayName: gmName,
        playerFieldVisibility:
            input.playerFieldVisibility ??
            defaultPlayerFieldVisibilityForKind(input.kind, input.groupId),
        kind: input.kind,
        deathSavesFailures: input.deathSavesFailures ?? 0,
    };
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
    /** FR-015 — dernière fiche consultée par le MJ pendant la session (chemin absolu avec locale). */
    lastConsultedSheetPath: string | null;
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
    lastConsultedSheetPath: null,
};

const normalizeTrackerRow = (row: InitiativeTrackerRow): InitiativeTrackerRow => {
    const kind = row.kind === 'player' || row.kind === 'npc' ? row.kind : 'npc';
    const gmName = defaultPlayerDisplayNameForRow(row);
    const rawAlias = typeof row.playerDisplayName === 'string' ? row.playerDisplayName.trim() : '';
    return applyPlayerRowVisibilityRules({
        ...row,
        kind,
        playerDisplayName: rawAlias.length > 0 ? rawAlias : gmName,
        playerFieldVisibility: normalizePlayerFieldVisibility(
            row.playerFieldVisibility,
            kind,
            row.groupId,
        ),
        visible: row.visible,
    });
};

const purgeTurnKeysForRow = (turnsWithActions: string[], rowId: string): string[] => {
    const suffix = `:${rowId}`;
    return turnsWithActions.filter((key) => !key.endsWith(suffix));
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

const isRowDead = (row: InitiativeTrackerRow): boolean => getInitiativeTrackerRowStatus(row) === 'dead';

const findFirstAliveRowId = (sortedRows: InitiativeTrackerRow[]): string | null => {
    const alive = sortedRows.find((row) => !isRowDead(row));
    return alive?.id ?? null;
};

/**
 * FR-014 — retourne le prochain tour vivant en respectant l'ordre tri\u00e9 et le wrap.
 * `wrapped: true` indique qu'au moins un wrap a eu lieu et qu'un seul tick de round doit \u00eatre appliqu\u00e9.
 */
const findNextAliveTurn = (
    sortedRows: InitiativeTrackerRow[],
    activeTurnRowId: string | null,
): { rowId: string; wrapped: boolean } | null => {
    if (sortedRows.length === 0) return null;
    if (sortedRows.every(isRowDead)) return null;

    const currentIndex = sortedRows.findIndex((row) => row.id === activeTurnRowId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

    let wrapped = false;
    for (let offset = 1; offset <= sortedRows.length; offset += 1) {
        const rawIndex = safeIndex + offset;
        const wrappedIndex = rawIndex % sortedRows.length;
        if (rawIndex >= sortedRows.length) {
            wrapped = true;
        }
        const candidate = sortedRows[wrappedIndex];
        if (candidate && !isRowDead(candidate)) {
            return { rowId: candidate.id, wrapped };
        }
    }

    return null;
};

const findPreviousAliveTurn = (
    sortedRows: InitiativeTrackerRow[],
    activeTurnRowId: string | null,
    currentRound: number,
): { rowId: string; wrapped: boolean } | null => {
    if (sortedRows.length === 0 || !activeTurnRowId) return null;
    if (sortedRows.every(isRowDead)) return null;

    const currentIndex = sortedRows.findIndex((row) => row.id === activeTurnRowId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

    let wrapped = false;
    for (let offset = 1; offset <= sortedRows.length; offset += 1) {
        const rawIndex = safeIndex - offset;
        if (rawIndex < 0) {
            wrapped = true;
            if (currentRound <= 1) return null;
        }
        const wrappedIndex = ((rawIndex % sortedRows.length) + sortedRows.length) % sortedRows.length;
        const candidate = sortedRows[wrappedIndex];
        if (candidate && !isRowDead(candidate)) {
            return { rowId: candidate.id, wrapped };
        }
    }

    return null;
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
            state.lastConsultedSheetPath = null;
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
            state.initiativeTrackerRows = action.payload.map(normalizeTrackerRow);
            state.battleInitialized = action.payload.length > 0;
            resetBattleTurnState(state);
        },
        appendInitiativeTrackerRows: (state, action: PayloadAction<InitiativeTrackerRow[]>) => {
            const existingCharacterIds = new Set(
                state.initiativeTrackerRows.map((row) => row.characterId),
            );
            const incoming = action.payload
                .map(normalizeTrackerRow)
                .filter((row) => !existingCharacterIds.has(row.characterId));
            if (incoming.length === 0) return;

            state.initiativeTrackerRows.push(...incoming);
            state.battleInitialized = true;
            if (state.battleStarted) {
                markActiveTurnWithActions(state);
            }
        },
        removeInitiativeTrackerRow: (state, action: PayloadAction<string>) => {
            const rowId = action.payload;
            const index = state.initiativeTrackerRows.findIndex((row) => row.id === rowId);
            if (index < 0) return;

            const wasActiveTurn = state.activeTurnRowId === rowId;
            state.initiativeTrackerRows.splice(index, 1);
            state.turnsWithActions = purgeTurnKeysForRow(state.turnsWithActions, rowId);

            if (state.initiativeTrackerRows.length === 0) {
                state.battleInitialized = false;
                resetBattleTurnState(state);
                return;
            }

            if (state.battleStarted) {
                const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
                const activeStillPresent = state.activeTurnRowId
                    ? sorted.some((row) => row.id === state.activeTurnRowId)
                    : false;
                if (wasActiveTurn || !activeStillPresent) {
                    state.activeTurnRowId = findFirstAliveRowId(sorted);
                }
                markActiveTurnWithActions(state);
            }
        },
        updateInitiativeTrackerRow: (
            state,
            action: PayloadAction<{ id: string; changes: Partial<Omit<InitiativeTrackerRow, 'id'>> }>,
        ) => {
            const row = state.initiativeTrackerRows.find((item) => item.id === action.payload.id);
            if (!row) return;
            Object.assign(row, action.payload.changes);
            if (action.payload.changes.playerFieldVisibility || action.payload.changes.kind) {
                row.playerFieldVisibility = normalizePlayerFieldVisibility(
                    row.playerFieldVisibility,
                    row.kind,
                    row.groupId,
                );
            }
            const normalized = applyPlayerRowVisibilityRules(row);
            row.visible = normalized.visible;
            row.playerFieldVisibility = normalized.playerFieldVisibility;
            if (state.battleStarted) {
                markActiveTurnWithActions(state);
            }
        },
        /** FR-015 — état combat reçu du MJ (joueurs) : remplace sans toucher au turn-lock GM. */
        applyRemoteBattleState: (state, action: PayloadAction<BattleStateSnapshot>) => {
            const payload = action.payload;
            state.initiativeTrackerRows = (payload.initiativeTrackerRows ?? []).map(normalizeTrackerRow);
            state.battleInitialized = payload.battleInitialized ?? state.initiativeTrackerRows.length > 0;
            state.battleStarted = payload.battleStarted ?? false;
            state.activeTurnRowId = payload.activeTurnRowId ?? null;
            state.currentRound = payload.currentRound ?? 1;
        },
        setLastConsultedSheetPath: (state, action: PayloadAction<string | null>) => {
            const path = action.payload?.trim() ?? '';
            state.lastConsultedSheetPath = path.length > 0 ? path : null;
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
            state.activeTurnRowId = findFirstAliveRowId(sorted);
        },
        endBattle: (state) => {
            clearUntilCombatEndConditions(state);
            state.initBattleDraft = initialInitBattleDraft;
            state.initiativeTrackerRows = [];
            state.battleInitialized = false;
            resetBattleTurnState(state);
        },
        nextBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
            // FR-014 — un personnage `dead` est ignoré ; tout passage qui traverse la fin du
            // tableau incrémente d'un cran l'horloge des conditions, peu importe combien de
            // morts ont été sautés sur le chemin.
            const next = findNextAliveTurn(sorted, state.activeTurnRowId);
            if (!next) {
                state.activeTurnRowId = null;
                return;
            }

            if (next.wrapped) {
                state.currentRound += 1;
                tickAllInitiativeTrackerConditions(state, -ROUND_DURATION_SECONDS);
            }
            state.activeTurnRowId = next.rowId;
        },
        previousBattleTurn: (state) => {
            if (!state.battleStarted || state.initiativeTrackerRows.length === 0) return;

            const sorted = sortInitiativeTrackerRows(state.initiativeTrackerRows);
            if (!canUndoBattleTurn(sorted, state.currentRound, state.activeTurnRowId, state.turnsWithActions)) {
                return;
            }

            const previous = findPreviousAliveTurn(sorted, state.activeTurnRowId, state.currentRound);
            if (!previous) return;

            if (previous.wrapped) {
                state.currentRound -= 1;
                tickAllInitiativeTrackerConditions(state, ROUND_DURATION_SECONDS);
            }
            state.activeTurnRowId = previous.rowId;
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
    appendInitiativeTrackerRows,
    removeInitiativeTrackerRow,
    updateInitiativeTrackerRow,
    resetInitiativeTracker,
    startBattle,
    endBattle,
    nextBattleTurn,
    previousBattleTurn,
    touchRemoteCharacterSheet,
    applyRemoteBattleState,
    setLastConsultedSheetPath,
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

export const selectLastConsultedSheetPath = (state: RootState) =>
    state.session.lastConsultedSheetPath ?? null;

export const selectBattleStateSnapshot = (state: RootState): BattleStateSnapshot => ({
    initiativeTrackerRows: state.session.initiativeTrackerRows,
    battleInitialized: state.session.battleInitialized,
    battleStarted: state.session.battleStarted,
    activeTurnRowId: state.session.activeTurnRowId,
    currentRound: state.session.currentRound,
});

export default sessionSlice.reducer;
