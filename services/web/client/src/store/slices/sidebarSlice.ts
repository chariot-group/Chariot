import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export interface SidebarState {
    openArchivedGroups: boolean;
    openSessionPlayers: boolean;
    /** Player ids whose nested linked-NPC list is collapsed (default expanded). @see FR-sidebar-linked-npc-nesting-collapse */
    collapsedCompanionNestPlayerIds: string[];
}

const initialState: SidebarState = {
    openArchivedGroups: false,
    openSessionPlayers: true,
    collapsedCompanionNestPlayerIds: [],
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
        setCompanionNestCollapsed: (
            state,
            action: PayloadAction<{ playerId: string; collapsed: boolean }>,
        ) => {
            const { playerId, collapsed } = action.payload;
            const current = state.collapsedCompanionNestPlayerIds ?? [];
            if (collapsed) {
                if (!current.includes(playerId)) {
                    state.collapsedCompanionNestPlayerIds = [...current, playerId];
                }
                return;
            }
            state.collapsedCompanionNestPlayerIds = current.filter((id) => id !== playerId);
        },
    },
});

export const {
    setOpenArchivedGroups,
    setOpenSessionPlayers,
    setCompanionNestCollapsed,
} = sidebarSlice.actions;

// Selectors
export const selectOpenArchivedGroups = (state: RootState) => state.sidebar.openArchivedGroups;
export const selectOpenSessionPlayers = (state: RootState) => state.sidebar.openSessionPlayers;
export const selectCollapsedCompanionNestPlayerIds = (state: RootState) =>
    state.sidebar.collapsedCompanionNestPlayerIds ?? [];

export default sidebarSlice.reducer;
