import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type ContextMode = 'player' | 'gm';

export interface EnvironmentSliceContext {
    contextMode: ContextMode;
}

const initialContext: EnvironmentSliceContext = {
    contextMode: 'player',
};

const environmentSlice = createSlice({
    name: 'environment',
    initialState: initialContext,
    reducers: {
        setContextMode: (state, action: PayloadAction<ContextMode>) => {
            state.contextMode = action.payload;
        },
        toggleContextMode: (state) => {
            state.contextMode = state.contextMode === 'player' ? 'gm' : 'player';
        }
    },
});

export const {
    setContextMode,
    toggleContextMode,
} = environmentSlice.actions;

// Selectors
export const selectContextMode = (state: RootState) => state.environment.contextMode;
export const selectIsGmMode = (state: RootState) => state.environment.contextMode === 'gm';
export const selectIsPlayerMode = (state: RootState) => state.environment.contextMode === 'player';

export default environmentSlice.reducer;
