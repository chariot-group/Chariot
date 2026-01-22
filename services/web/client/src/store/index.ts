import { configureStore, combineReducers } from '@reduxjs/toolkit';
import environmentReducer from './slices/environmentSlice';
import campaignReducer from './slices/campaignSlice';
import actionButtonReducer from './slices/actionButtonSlice';
import campaignContextReducer from './slices/campaignContextSlice';
import groupReducer from './slices/groupSlice';
import sidebarReducer from './slices/sidebarSlice';

// Combine all reducers
const rootReducer = combineReducers({
    environment: environmentReducer,
    campaign: campaignReducer,
    actionButton: actionButtonReducer,
    campaignContext: campaignContextReducer,
    group: groupReducer,
    sidebar: sidebarReducer,
});

// Export RootState type
export type RootState = ReturnType<typeof rootReducer>;

// Export makeStore function
export const makeStore = () => {
    return configureStore({
        reducer: rootReducer,
        devTools: process.env.NODE_ENV !== 'production',
    });
};

// Infer types from store
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
