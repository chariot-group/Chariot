import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface SidebarState {
    openEnvironment: boolean;
    openActiveGroups: boolean;
    openArchivedGroups: boolean;
}

const initialState: SidebarState = {
    openEnvironment: false,
    openActiveGroups: false,
    openArchivedGroups: false,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setOpenEnvironment: (state, action: PayloadAction<boolean>) => {
            state.openEnvironment = action.payload;
            // Fermer les autres menus quand on ouvre l'environnement
            if (action.payload) {
                state.openActiveGroups = false;
                state.openArchivedGroups = false;
            }
        },
        setOpenActiveGroups: (state, action: PayloadAction<boolean>) => {
            state.openActiveGroups = action.payload;
            // Fermer archived groups et environment quand on ouvre active groups
            if (action.payload) {
                state.openArchivedGroups = false;
                state.openEnvironment = false;
            }
        },
        setOpenArchivedGroups: (state, action: PayloadAction<boolean>) => {
            state.openArchivedGroups = action.payload;
            // Fermer active groups et environment quand on ouvre archived groups
            if (action.payload) {
                state.openActiveGroups = false;
                state.openEnvironment = false;
            }
        },
        closeAllMenus: (state) => {
            state.openEnvironment = false;
            state.openActiveGroups = false;
            state.openArchivedGroups = false;
        },
    },
});

export const {
    setOpenEnvironment,
    setOpenActiveGroups,
    setOpenArchivedGroups,
    closeAllMenus,
} = sidebarSlice.actions;

// Selectors
export const selectOpenEnvironment = (state: RootState) => state.sidebar.openEnvironment;
export const selectOpenActiveGroups = (state: RootState) => state.sidebar.openActiveGroups;
export const selectOpenArchivedGroups = (state: RootState) => state.sidebar.openArchivedGroups;

export default sidebarSlice.reducer;
