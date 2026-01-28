import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type ActionButtonState =
    | 'initBattle'
    | 'launchSession'
    | 'joinSession'
    | 'startBattle'
    | 'reset'
    | 'returnToBattle'
    | 'returnToSheet';

export interface ActionButtonSliceState {
    currentAction: ActionButtonState;
    isDisabled: boolean;
    sessionStarted: boolean;
    battleInitialized: boolean;
    battleStarted: boolean;
    currentPage: string;
}

const initialState: ActionButtonSliceState = {
    currentAction: 'launchSession',
    isDisabled: false,
    sessionStarted: false,
    battleInitialized: false,
    battleStarted: false,
    currentPage: '/',
};

const actionButtonSlice = createSlice({
    name: 'actionButton',
    initialState,
    reducers: {
        setActionButton: (state, action: PayloadAction<ActionButtonState>) => {
            state.currentAction = action.payload;
        },
        setActionButtonDisabled: (state, action: PayloadAction<boolean>) => {
            state.isDisabled = action.payload;
        },
        setSessionStarted: (state, action: PayloadAction<boolean>) => {
            state.sessionStarted = action.payload;
        },
        setBattleInitialized: (state, action: PayloadAction<boolean>) => {
            state.battleInitialized = action.payload;
        },
        setBattleStarted: (state, action: PayloadAction<boolean>) => {
            state.battleStarted = action.payload;
        },
        setCurrentPage: (state, action: PayloadAction<string>) => {
            state.currentPage = action.payload;
        },
        resetActionButton: (state) => {
            state.currentAction = initialState.currentAction;
            state.isDisabled = false;
            state.sessionStarted = false;
            state.battleInitialized = false;
            state.battleStarted = false;
            state.currentPage = '/';
        },
    },
});

export const {
    setActionButton,
    setActionButtonDisabled,
    setSessionStarted,
    setBattleInitialized,
    setBattleStarted,
    setCurrentPage,
    resetActionButton,
} = actionButtonSlice.actions;

// Selectors
export const selectActionButton = (state: RootState) => state.actionButton.currentAction;
export const selectActionButtonDisabled = (state: RootState) => state.actionButton.isDisabled;
export const selectSessionStarted = (state: RootState) => state.actionButton.sessionStarted;
export const selectBattleInitialized = (state: RootState) => state.actionButton.battleInitialized;
export const selectBattleStarted = (state: RootState) => state.actionButton.battleStarted;
export const selectCurrentPage = (state: RootState) => state.actionButton.currentPage;

export default actionButtonSlice.reducer;
