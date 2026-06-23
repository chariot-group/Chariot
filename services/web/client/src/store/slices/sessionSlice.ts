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
import { SESSION_PARTICIPANT_NAME_LOADING } from '@/lib/formatSessionParticipantUserLabel';
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
    allowPlayerInitiativeInput: boolean;
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

/** FR-session-combat-navigation / FR-tracker-hp-life-status-decoupling — champs visibles pour les joueurs sur une ligne du tracker. */
export interface InitiativeTrackerPlayerFieldVisibility {
    initiative: boolean;
    name: boolean;
    hitPoints: boolean;
    lifeStatus: boolean;
    armorClass: boolean;
    conditions: boolean;
    groupLabel: boolean;
}

export const DEFAULT_NPC_PLAYER_FIELD_VISIBILITY: InitiativeTrackerPlayerFieldVisibility = {
    initiative: false,
    name: true,
    hitPoints: false,
    lifeStatus: false,
    armorClass: false,
    conditions: false,
    groupLabel: false,
};

export const DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY: InitiativeTrackerPlayerFieldVisibility = {
    initiative: true,
    name: true,
    hitPoints: true,
    lifeStatus: true,
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
        lifeStatus: typeof value.lifeStatus === 'boolean' ? value.lifeStatus : defaults.lifeStatus,
        armorClass: typeof value.armorClass === 'boolean' ? value.armorClass : defaults.armorClass,
        conditions: typeof value.conditions === 'boolean' ? value.conditions : defaults.conditions,
        groupLabel: typeof value.groupLabel === 'boolean' ? value.groupLabel : defaults.groupLabel,
    };
}

/** FR-session-combat-navigation / FR-session-gm-guest-character — seuls les PJ non-MJ du groupe « participants session » sont non masquables. */
export function applyPlayerRowVisibilityRules(row: InitiativeTrackerRow): InitiativeTrackerRow {
    if (!isSessionParticipantTrackerRow(row) || row.isGmGuest) {
        return row;
    }
    return {
        ...row,
        visible: true,
        playerFieldVisibility: { ...DEFAULT_PLAYER_PLAYER_FIELD_VISIBILITY },
    };
}

/** FR-session-combat-navigation — snapshot diffusé par le MJ aux joueurs via WebSocket. */
export interface BattleStateSnapshot {
    initiativeTrackerRows: InitiativeTrackerRow[];
    battleInitialized: boolean;
    battleStarted: boolean;
    activeTurnRowId: string | null;
    currentRound: number;
    allowPlayerInitiativeInput: boolean;
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
    /** FR-session-combat-navigation — alias affiché aux joueurs quand le vrai nom est masqué (non persisté sur la fiche). */
    playerDisplayName: string;
    /** FR-session-combat-navigation — visibilité granulaire des champs pour la vue joueur. */
    playerFieldVisibility: InitiativeTrackerPlayerFieldVisibility;
    /** FR-tracker-vital-status — discriminant pour appliquer la règle de mort/inconscience adaptée. */
    kind: InitiativeTrackerRowKind;
    /** FR-tracker-vital-status — miroir de `deathSaves.failures` (uniquement pertinent pour `kind === 'player'`). */
    deathSavesFailures: number;
    /** FR-session-gm-guest-character — personnage MJ promu temporairement dans le groupe participants session. */
    isGmGuest?: boolean;
}

/** FR-combat-initiative-tracker / FR-session-combat-navigation — fabrique une ligne tracker (setup ou ajout en cours de combat). */
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
    allowPlayerInitiativeInput: false,
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
    /** FR-session-combat-navigation — dernière fiche consultée par le MJ pendant la session (chemin absolu avec locale). */
    lastConsultedSheetPath: string | null;
    /** Libellés affichables des participants (username ou prénom + nom). */
    participantDisplayNames: Record<string, string>;
    /** FR-session-gm-guest-character — IDs des personnages MJ temporairement promus dans le groupe participants session. */
    gmGuestCharacterIds: string[];
    /** FR-042 — contrôle l'ouverture de la modale lobby session (non persisté). */
    sessionLobbyOpen: boolean;
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
    participantDisplayNames: {},
    gmGuestCharacterIds: [],
    sessionLobbyOpen: false,
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

const mergePlayerFieldVisibilityChange = (
    row: InitiativeTrackerRow,
    nextVisibility: Partial<InitiativeTrackerPlayerFieldVisibility> | undefined,
) => {
    if (!nextVisibility) return row.playerFieldVisibility;
    return {
        ...row.playerFieldVisibility,
        ...nextVisibility,
    };
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
 * FR-tracker-vital-status — retourne le prochain tour vivant en respectant l'ordre tri\u00e9 et le wrap.
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
            state.participantDisplayNames = {};
            state.gmGuestCharacterIds = [];
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
            delete state.participantDisplayNames[userId];
        },
        mergeSessionParticipantDisplayNames: (state, action: PayloadAction<Record<string, string>>) => {
            for (const [userId, label] of Object.entries(action.payload)) {
                const trimmed = label?.trim();
                if (!trimmed || trimmed === SESSION_PARTICIPANT_NAME_LOADING) continue;
                state.participantDisplayNames[userId] = trimmed;
            }
        },
        pruneSessionParticipantDisplayNames: (state) => {
            const activeUserIds = new Set(state.participants.map((p) => p.userId));
            for (const userId of Object.keys(state.participantDisplayNames)) {
                if (!activeUserIds.has(userId)) {
                    delete state.participantDisplayNames[userId];
                }
            }
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
        removeInitiativeTrackerRows: (state, action: PayloadAction<string[]>) => {
            const rowIds = new Set(action.payload);
            if (rowIds.size === 0) return;

            const beforeLength = state.initiativeTrackerRows.length;
            const removedActiveTurn = state.activeTurnRowId != null && rowIds.has(state.activeTurnRowId);
            state.initiativeTrackerRows = state.initiativeTrackerRows.filter((row) => !rowIds.has(row.id));
            if (state.initiativeTrackerRows.length === beforeLength) return;

            state.turnsWithActions = state.turnsWithActions.filter((key) => {
                const rowId = key.slice(key.indexOf(':') + 1);
                return !rowIds.has(rowId);
            });

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
                if (removedActiveTurn || !activeStillPresent) {
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
            const nextPlayerFieldVisibility = mergePlayerFieldVisibilityChange(
                row,
                action.payload.changes.playerFieldVisibility,
            );
            Object.assign(row, action.payload.changes);
            if (action.payload.changes.playerFieldVisibility || action.payload.changes.kind) {
                row.playerFieldVisibility = normalizePlayerFieldVisibility(
                    nextPlayerFieldVisibility,
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
        updateInitiativeTrackerRowsBulk: (
            state,
            action: PayloadAction<{
                ids: string[];
                changes: Omit<Partial<Omit<InitiativeTrackerRow, 'id' | 'playerDisplayName'>>, 'playerFieldVisibility'> & {
                    playerFieldVisibility?: Partial<InitiativeTrackerPlayerFieldVisibility>;
                };
                playerDisplayName?: string;
            }>,
        ) => {
            const rowIds = new Set(action.payload.ids);
            if (rowIds.size === 0) return;

            let changed = false;
            for (const row of state.initiativeTrackerRows) {
                if (!rowIds.has(row.id)) continue;
                const nextPlayerFieldVisibility = mergePlayerFieldVisibilityChange(
                    row,
                    action.payload.changes.playerFieldVisibility,
                );
                Object.assign(row, action.payload.changes);
                if (typeof action.payload.playerDisplayName === 'string') {
                    const trimmedDisplayName = action.payload.playerDisplayName.trim();
                    if (trimmedDisplayName.length > 0) {
                        row.playerDisplayName = trimmedDisplayName;
                    }
                }
                if (action.payload.changes.playerFieldVisibility || action.payload.changes.kind) {
                    row.playerFieldVisibility = normalizePlayerFieldVisibility(
                        nextPlayerFieldVisibility,
                        row.kind,
                        row.groupId,
                    );
                }
                const normalized = applyPlayerRowVisibilityRules(row);
                row.visible = normalized.visible;
                row.playerFieldVisibility = normalized.playerFieldVisibility;
                changed = true;
            }

            if (changed && state.battleStarted) {
                markActiveTurnWithActions(state);
            }
        },
        /** FR-session-combat-navigation — état combat reçu du MJ (joueurs) : remplace sans toucher au turn-lock GM. */
        applyRemoteBattleState: (state, action: PayloadAction<BattleStateSnapshot>) => {
            const payload = action.payload;
            state.initiativeTrackerRows = (payload.initiativeTrackerRows ?? []).map(normalizeTrackerRow);
            state.battleInitialized = payload.battleInitialized ?? state.initiativeTrackerRows.length > 0;
            state.battleStarted = payload.battleStarted ?? false;
            state.activeTurnRowId = payload.activeTurnRowId ?? null;
            state.currentRound = payload.currentRound ?? 1;
            state.initBattleDraft = {
                ...state.initBattleDraft,
                allowPlayerInitiativeInput: payload.allowPlayerInitiativeInput ?? false,
            };
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
            // FR-tracker-vital-status — un personnage `dead` est ignoré ; tout passage qui traverse la fin du
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
        /** FR-session-gm-guest-character — ajoute un personnage MJ dans le groupe participants session. */
        addGmGuestCharacterToSession: (state, action: PayloadAction<string>) => {
            const id = action.payload.trim();
            if (!id || (state.gmGuestCharacterIds ?? []).includes(id)) return;
            if (!state.gmGuestCharacterIds) state.gmGuestCharacterIds = [];
            state.gmGuestCharacterIds.push(id);
        },
        /** FR-session-gm-guest-character — retire un personnage MJ du groupe participants session. */
        removeGmGuestCharacterFromSession: (state, action: PayloadAction<string>) => {
            const id = action.payload.trim();
            if (!id) return;
            state.gmGuestCharacterIds = (state.gmGuestCharacterIds ?? []).filter((cid) => cid !== id);
        },
        /** FR-042 — ouvre la modale lobby session. */
        openSessionLobby: (state) => {
            state.sessionLobbyOpen = true;
        },
        /** FR-042 — ferme la modale lobby session. */
        closeSessionLobby: (state) => {
            state.sessionLobbyOpen = false;
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
    removeInitiativeTrackerRows,
    updateInitiativeTrackerRow,
    updateInitiativeTrackerRowsBulk,
    resetInitiativeTracker,
    startBattle,
    endBattle,
    nextBattleTurn,
    previousBattleTurn,
    touchRemoteCharacterSheet,
    applyRemoteBattleState,
    setLastConsultedSheetPath,
    mergeSessionParticipantDisplayNames,
    pruneSessionParticipantDisplayNames,
    addGmGuestCharacterToSession,
    removeGmGuestCharacterFromSession,
    openSessionLobby,
    closeSessionLobby,
} = sessionSlice.actions;

export const selectCurrentSession = (state: RootState) => state.session;
export const selectIsInSession = (state: RootState) => state.session.isInSession;
export const selectSessionCode = (state: RootState) => state.session.code;
export const selectSessionCampaignId = (state: RootState) => state.session.campaignId;
export const selectSessionStatus = (state: RootState) => state.session.status;
export const selectSessionExpiresAt = (state: RootState) => state.session.expiresAt;
export const selectSessionParticipants = (state: RootState) => state.session.participants;
export const selectSessionParticipantDisplayNames = (state: RootState) =>
    state.session.participantDisplayNames ?? {};
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
export const selectGmGuestCharacterIds = (state: RootState) =>
    state.session.gmGuestCharacterIds ?? [];

export const selectLastConsultedSheetPath = (state: RootState) =>
    state.session.lastConsultedSheetPath ?? null;

export const selectSessionLobbyOpen = (state: RootState) => state.session.sessionLobbyOpen ?? false;

export const selectBattleStateSnapshot = (state: RootState): BattleStateSnapshot => ({
    initiativeTrackerRows: state.session.initiativeTrackerRows,
    battleInitialized: state.session.battleInitialized,
    battleStarted: state.session.battleStarted,
    activeTurnRowId: state.session.activeTurnRowId,
    currentRound: state.session.currentRound,
    allowPlayerInitiativeInput: state.session.initBattleDraft.allowPlayerInitiativeInput ?? false,
});

export default sessionSlice.reducer;
