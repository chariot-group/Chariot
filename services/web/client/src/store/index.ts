import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import environmentReducer from './slices/environmentSlice';
import campaignReducer from './slices/campaignSlice';
import actionButtonReducer from './slices/actionButtonSlice';
import campaignContextReducer from './slices/campaignContextSlice';
import groupReducer from './slices/groupSlice';
import sidebarReducer from './slices/sidebarSlice';

// Configuration de redux-persist
const persistConfig = {
    key: 'chariot',
    storage,
    // Persister les données de navigation ET les données API pour éviter le saut visuel
    whitelist: ['environment', 'campaignContext', 'sidebar', 'group', 'actionButton', 'campaign'],
};

// Combine all reducers
const rootReducer = combineReducers({
    environment: environmentReducer,
    campaign: campaignReducer,
    actionButton: actionButtonReducer,
    campaignContext: campaignContextReducer,
    group: groupReducer,
    sidebar: sidebarReducer,
});

// Créer le reducer persisté
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Export RootState type
export type RootState = ReturnType<typeof rootReducer>;

// Export makeStore function
export const makeStore = () => {
    const store = configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                },
            }),
        devTools: process.env.NODE_ENV !== 'production',
    });

    const persistor = persistStore(store);

    return { store, persistor };
};

// Infer types from store
export type AppStore = ReturnType<typeof makeStore>['store'];
export type AppDispatch = AppStore['dispatch'];
