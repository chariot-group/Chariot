import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export interface SidebarState {
    openArchivedGroups: boolean;
    openSessionPlayers: boolean;
}

const initialState: SidebarState = {
    openArchivedGroups: false,
    openSessionPlayers: true,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setOpenArchivedGroups: (state, action: PayloadAction<boolean>) => {
            state.openArchivedGroups = action.payload;
        },
        setOpenSessionPlayers: (state, action: PayloadAction<boolean>) => {
            state.openSessionPlayers = action.payload;
        },
    },
});

export const {
    setOpenArchivedGroups,
    setOpenSessionPlayers,
} = sidebarSlice.actions;

// Selectors
export const selectOpenArchivedGroups = (state: RootState) => state.sidebar.openArchivedGroups;
export const selectOpenSessionPlayers = (state: RootState) => state.sidebar.openSessionPlayers;

export default sidebarSlice.reducer;
