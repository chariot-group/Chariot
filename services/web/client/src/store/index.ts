import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, Persistor, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import environmentReducer from '@/store/slices/environmentSlice';
import campaignReducer from '@/store/slices/campaignSlice';
import campaignContextReducer from '@/store/slices/campaignContextSlice';
import groupReducer from '@/store/slices/groupSlice';
import sidebarReducer from '@/store/slices/sidebarSlice';
import characterReducer from '@/store/slices/characterSlice';
import userReducer from '@/store/slices/userSlice';
import codexDraftReducer from '@/store/slices/codexDraftSlice';
import { ensureConditionEntryRemainingSeconds } from '@/components/initiativeTracker/conditionDuration';
import { defaultPlayerDisplayNameForRow } from '@/components/initiativeTracker/utils';
import sessionReducer, {
    normalizeInitiativeTrackerConditionEntry,
    normalizePlayerFieldVisibility,
    type CurrentSessionState,
    type InitiativeTrackerRowKind,
} from '@/store/slices/sessionSlice';
import { CampaignState, GroupState } from '@/types/campaign';
import { UserState } from '@/types/user';

function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('chariot_user_id');
}

const campaignTransform = createTransform(
    (inboundState: CampaignState) => {
        const { loading, loadingMore, error, ...rest } = inboundState;
        void loading;
        void loadingMore;
        void error;
        return rest;
    },
    (outboundState: Partial<CampaignState>) => {
        return {
            ...outboundState,
            loading: false,
            loadingMore: false,
            error: null,
        } as CampaignState;
    },
    { whitelist: ['campaign'] }
);

const groupTransform = createTransform(
    (inboundState: GroupState) => {
        const { loading, error, ...rest } = inboundState;
        void loading;
        void error;
        return rest;
    },
    (outboundState: Partial<GroupState>) => {
        return {
            ...outboundState,
            loading: false,
            error: null,
        } as GroupState;
    },
    { whitelist: ['group'] }
);

/**
 * Nettoie un tableau de personnages persistés : conserve l'ordre, supprime les `_id` dupliqués (premier vu gagne)
 * et écarte les entrées sans `_id`. Indispensable pour purger des états persistés pollués avant l'ajout du dedupe
 * côté reducer (sinon la cooldown `characters.length > 0` empêche le refetch et l'erreur de clé dupliquée persiste).
 */
const sanitizePersistedCharacters = (value: unknown): unknown => {
    if (!Array.isArray(value)) return value;
    const seen = new Set<string>();
    const cleaned: unknown[] = [];
    for (const item of value) {
        const id = (item as { _id?: unknown } | null)?._id;
        if (typeof id !== 'string' || id.length === 0) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        cleaned.push(item);
    }
    return cleaned;
};

const characterTransform = createTransform(
    (inboundState: Record<string, unknown>) => {
        const { loadingWithoutGroup, loadingMoreWithoutGroup, errorWithoutGroup, loadingAll, errorAll, ...rest } = inboundState;
        void loadingWithoutGroup;
        void loadingMoreWithoutGroup;
        void errorWithoutGroup;
        void loadingAll;
        void errorAll;
        return rest;
    },
    (outboundState: Record<string, unknown>) => {
        return {
            ...outboundState,
            charactersWithoutGroup: sanitizePersistedCharacters(outboundState.charactersWithoutGroup),
            allCharacters: sanitizePersistedCharacters(outboundState.allCharacters),
            loadingWithoutGroup: false,
            loadingMoreWithoutGroup: false,
            errorWithoutGroup: null,
            loadingAll: false,
            errorAll: null,
        };
    },
    { whitelist: ['character'] }
);

const userTransform = createTransform(
    (inboundState: UserState) => {
        const { loading, error, ...rest } = inboundState;
        void loading;
        void error;
        return rest;
    },
    (outboundState: Partial<UserState>) => {
        return {
            ...outboundState,
            loading: false,
            error: null,
        } as UserState;
    },
    { whitelist: ['user'] }
);

/** Données persistées avant l’introduction de characterSheetRemoteVersions : normalisation à la réhydratation. */
const sessionTransform = createTransform(
    (inboundState: CurrentSessionState) => inboundState,
    (outbound: Partial<CurrentSessionState> | undefined): CurrentSessionState => ({
        code: outbound?.code ?? null,
        campaignId: outbound?.campaignId ?? null,
        isInSession: outbound?.isInSession ?? false,
        status: outbound?.status ?? null,
        expiresAt: outbound?.expiresAt ?? null,
        participants: outbound?.participants ?? [],
        tokensByUser: outbound?.tokensByUser ?? {},
        initBattleDraft: {
            showAllOpponents: outbound?.initBattleDraft?.showAllOpponents ?? false,
            allowPlayerInitiativeInput: outbound?.initBattleDraft?.allowPlayerInitiativeInput ?? false,
            selectedGroupIds: outbound?.initBattleDraft?.selectedGroupIds ?? [],
            expandedGroupIds: outbound?.initBattleDraft?.expandedGroupIds ?? [],
            excludedMembersByGroup: outbound?.initBattleDraft?.excludedMembersByGroup ?? {},
        },
        initiativeTrackerRows: (outbound?.initiativeTrackerRows ?? []).map((row) => {
            const legacyConditions =
                "condition" in row && row.condition && row.condition !== "none" ? [row.condition] : [];
            const rawConditions = row.conditions ?? legacyConditions;
            const kind: InitiativeTrackerRowKind =
                row.kind === 'player' || row.kind === 'npc' ? row.kind : 'npc';

            return {
                ...row,
                maxHitPoints: Number.isFinite(row.maxHitPoints) ? row.maxHitPoints : row.hitPoints ?? 0,
                tempHitPoints: Number.isFinite(row.tempHitPoints) ? row.tempHitPoints : 0,
                kind,
                deathSavesFailures: Number.isFinite(row.deathSavesFailures)
                    ? Math.max(0, Math.floor(Number(row.deathSavesFailures)))
                    : 0,
                playerFieldVisibility: normalizePlayerFieldVisibility(
                    row.playerFieldVisibility,
                    kind,
                    row.groupId ?? '',
                ),
                playerDisplayName: (() => {
                    const gmName = defaultPlayerDisplayNameForRow({
                        firstname: row.firstname ?? '',
                        lastname: row.lastname ?? '',
                        surname: row.surname ?? '',
                    });
                    const raw =
                        typeof row.playerDisplayName === 'string' ? row.playerDisplayName.trim() : '';
                    return raw.length > 0 ? raw : gmName;
                })(),
                conditions: rawConditions
                    .map((entry) => normalizeInitiativeTrackerConditionEntry(entry))
                    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
                    .map((entry) => ensureConditionEntryRemainingSeconds(entry)),
            };
        }),
        battleInitialized: outbound?.battleInitialized ?? (outbound?.initiativeTrackerRows?.length ?? 0) > 0,
        battleStarted: outbound?.battleStarted ?? false,
        activeTurnRowId: outbound?.activeTurnRowId ?? null,
        currentRound: outbound?.currentRound ?? 1,
        turnsWithActions: outbound?.turnsWithActions ?? [],
        characterSheetRemoteVersions:
            outbound?.characterSheetRemoteVersions && typeof outbound.characterSheetRemoteVersions === 'object'
                ? outbound.characterSheetRemoteVersions
                : {},
        lastConsultedSheetPath: outbound?.lastConsultedSheetPath ?? null,
    }),
    { whitelist: ['session'] },
);

function makePersistConfig(userId: string | null) {
    const storageKey = userId ? `chariot_user_${userId}` : 'chariot_anonymous';

    return {
        version: 2,
        key: storageKey,
        storage,
        whitelist: ['environment', 'campaignContext', 'sidebar', 'group', 'campaign', 'character', 'user', 'session'],
        transforms: [campaignTransform, groupTransform, characterTransform, userTransform, sessionTransform],
        migrate: (state: unknown) => {
            if (!state || typeof state !== 'object') {
                return Promise.resolve(state);
            }

            const { actionButton, ...rest } = state as Record<string, unknown>;
            void actionButton;
            return Promise.resolve(rest);
        },
    };
}

// Combine all reducers
const rootReducer = combineReducers({
    environment: environmentReducer,
    campaign: campaignReducer,
    campaignContext: campaignContextReducer,
    group: groupReducer,
    sidebar: sidebarReducer,
    character: characterReducer,
    user: userReducer,
    codexDraft: codexDraftReducer,
    session: sessionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

let globalPersistor: Persistor | null = null;
let currentStoreUserId: string | null = null;

export const makeStore = (userId: string | null = null) => {
    const effectiveUserId = userId ?? getCurrentUserId();

    const persistConfig = makePersistConfig(effectiveUserId);

    // @ts-expect-error - Redux Persist type compatibility issue with transforms
    const persistedReducer = persistReducer(persistConfig, rootReducer);

    const store = configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
                },
            }),
        devTools: process.env.NODE_ENV !== 'production',
    });

    const persistor = persistStore(store);

    globalPersistor = persistor;
    currentStoreUserId = effectiveUserId;

    return { store, persistor };
};

export const isStoreForCurrentUser = (userId: string | null): boolean => {
    return currentStoreUserId === userId;
};

export const purgePersistedState = async (): Promise<void> => {
    if (!globalPersistor) {
        console.warn('Persistor not initialized, cannot purge state');
        return;
    }

    try {
        await globalPersistor.purge();
        console.log('Redux persisted state successfully purged');
    } catch (error) {
        console.error('Failed to purge persisted state:', error);
        throw error;
    }
};

export type AppStore = ReturnType<typeof makeStore>['store'];
export type AppDispatch = AppStore['dispatch'];
