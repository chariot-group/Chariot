import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, Persistor, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import environmentReducer from './slices/environmentSlice';
import campaignReducer from './slices/campaignSlice';
import actionButtonReducer from './slices/actionButtonSlice';
import campaignContextReducer from './slices/campaignContextSlice';
import groupReducer from './slices/groupSlice';
import sidebarReducer from './slices/sidebarSlice';
import characterReducer from './slices/characterSlice';
import userReducer from './slices/userSlice';
import { CampaignState, GroupState } from '@/types/campaign';
import { UserState } from '@/types/user';

// Transform to exclude transient states from persistence
// Transient states (loading, error, etc.) should always start fresh
const campaignTransform = createTransform(
    // Transform state on save (outbound)
    (inboundState: CampaignState) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { loading, loadingMore, error, ...rest } = inboundState;
        return rest;
    },
    // Transform state on load (inbound) - restore defaults for excluded fields
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Configuration de redux-persist
const persistConfig = {
    key: 'chariot',
    storage,
    // Persister les données de navigation ET les données API pour éviter le saut visuel
    whitelist: ['environment', 'campaignContext', 'sidebar', 'group', 'actionButton', 'campaign', 'character', 'user'],
    transforms: [campaignTransform, groupTransform, characterTransform, userTransform],
};

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
});

// Créer le reducer persisté
// @ts-expect-error - Redux Persist type compatibility issue with transforms
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Export RootState type
export type RootState = ReturnType<typeof rootReducer>;

// Global persistor reference (singleton pattern)
let globalPersistor: Persistor | null = null;

// Export makeStore function
export const makeStore = () => {
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

    // Stockage du persistor en global pour accès ultérieur
    globalPersistor = persistor;

    return { store, persistor };
};

/**
 * Purge all persisted state from localStorage
 * Should be called on user logout to prevent data leakage between different users
 */
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

// Infer types from store
export type AppStore = ReturnType<typeof makeStore>['store'];
export type AppDispatch = AppStore['dispatch'];
