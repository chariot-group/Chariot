import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, Persistor, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import environmentReducer from '@/store/slices/environmentSlice';
import campaignReducer from '@/store/slices/campaignSlice';
import actionButtonReducer from '@/store/slices/actionButtonSlice';
import campaignContextReducer from '@/store/slices/campaignContextSlice';
import groupReducer from '@/store/slices/groupSlice';
import sidebarReducer from '@/store/slices/sidebarSlice';
import characterReducer from '@/store/slices/characterSlice';
import userReducer from '@/store/slices/userSlice';
import codexDraftReducer from '@/store/slices/codexDraftSlice';
import { CampaignState, GroupState } from '@/types/campaign';
import { UserState } from '@/types/user';

function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('chariot_user_id');
}

const campaignTransform = createTransform(
    (inboundState: CampaignState) => {
        const { loading, loadingMore, error, ...rest } = inboundState;
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

const characterTransform = createTransform(
    (inboundState: Record<string, unknown>) => {
        const { loadingWithoutGroup, loadingMoreWithoutGroup, errorWithoutGroup, loadingAll, errorAll, ...rest } = inboundState;
        return rest;
    },
    (outboundState: Record<string, unknown>) => {
        return {
            ...outboundState,
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

function makePersistConfig(userId: string | null) {
    const storageKey = userId ? `chariot_user_${userId}` : 'chariot_anonymous';

    return {
        key: storageKey,
        storage,
        whitelist: ['environment', 'campaignContext', 'sidebar', 'group', 'actionButton', 'campaign', 'character', 'user'],
        transforms: [campaignTransform, groupTransform, characterTransform, userTransform],
    };
}

// Combine all reducers
const rootReducer = combineReducers({
    environment: environmentReducer,
    campaign: campaignReducer,
    actionButton: actionButtonReducer,
    campaignContext: campaignContextReducer,
    group: groupReducer,
    sidebar: sidebarReducer,
    character: characterReducer,
    user: userReducer,
    codexDraft: codexDraftReducer,
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
