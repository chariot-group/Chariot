import { configureStore } from '@reduxjs/toolkit';
import environmentReducer from './slices/environmentSlice';
import campaignReducer from './slices/campaignSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            environment: environmentReducer,
            campaign: campaignReducer,
        },
        devTools: process.env.NODE_ENV !== 'production',
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
