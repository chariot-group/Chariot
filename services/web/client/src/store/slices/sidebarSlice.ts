import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface SidebarState {
    openEnvironment: boolean;
    openActiveGroups: boolean;
    openArchivedGroups: boolean;
    openSessionPlayers: boolean;
}

const initialState: SidebarState = {
    openEnvironment: false,
    openActiveGroups: false,
    openArchivedGroups: false,
    openSessionPlayers: true,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setOpenEnvironment: (state, action: PayloadAction<boolean>) => {
            state.openEnvironment = action.payload;
            // Close other menus when opening environment
            if (action.payload) {
                state.openActiveGroups = false;
                state.openArchivedGroups = false;
            }
        },
        setOpenActiveGroups: (state, action: PayloadAction<boolean>) => {
            state.openActiveGroups = action.payload;
            // Close archived groups and environment when opening active groups
            if (action.payload) {
                state.openArchivedGroups = false;
                state.openEnvironment = true;
            }
        },
        setOpenArchivedGroups: (state, action: PayloadAction<boolean>) => {
            state.openArchivedGroups = action.payload;
            // Close active groups and environment when opening archived groups
            if (action.payload) {
                state.openActiveGroups = false;
                state.openEnvironment = true;
            }
        },
        setOpenSessionPlayers: (state, action: PayloadAction<boolean>) => {
            state.openSessionPlayers = action.payload;
        },
        closeAllMenus: (state) => {
            state.openEnvironment = false;
            state.openActiveGroups = false;
            state.openArchivedGroups = false;
            state.openSessionPlayers = false;
        },
    },
});

export const {
    setOpenEnvironment,
    setOpenActiveGroups,
    setOpenArchivedGroups,
    setOpenSessionPlayers,
    closeAllMenus,
} = sidebarSlice.actions;

// Selectors
export const selectOpenEnvironment = (state: RootState) => state.sidebar.openEnvironment;
export const selectOpenActiveGroups = (state: RootState) => state.sidebar.openActiveGroups;
export const selectOpenArchivedGroups = (state: RootState) => state.sidebar.openArchivedGroups;
export const selectOpenSessionPlayers = (state: RootState) => state.sidebar.openSessionPlayers;

export default sidebarSlice.reducer;
