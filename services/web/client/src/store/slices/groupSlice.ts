import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { Group, GroupState } from '@/types/campaign';

const initialState: GroupState = {
    activeGroups: [],
    archivedGroups: [],
    loading: false,
    error: null,
    openGroupId: [],
    lastFetch: null,
};

const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        fetchGroupsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchGroupsSuccess: (state, action: PayloadAction<{ active: Group[]; archived: Group[] }>) => {
            state.activeGroups = action.payload.active;
            state.archivedGroups = action.payload.archived;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
        },
        fetchGroupsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        setOpenGroup: (state, action: PayloadAction<string | null>) => {
            const current = Array.isArray(state.openGroupId)
                ? state.openGroupId
                : state.openGroupId
                    ? [state.openGroupId as unknown as string]
                    : [];

            if (action.payload === null) {
                state.openGroupId = [];
                return;
            }

            const id = action.payload;
            if (current.includes(id)) {
                state.openGroupId = current.filter(groupId => groupId !== id);
            } else {
                state.openGroupId = [...current, id];
            }
        },
        clearGroups: (state) => {
            state.activeGroups = [];
            state.archivedGroups = [];
            state.error = null;
            state.openGroupId = [];
            state.lastFetch = null;
        },
        invalidateCache: (state) => {
            state.lastFetch = null;
        },
    },
});

export const {
    fetchGroupsStart,
    fetchGroupsSuccess,
    fetchGroupsFailure,
    setOpenGroup,
    clearGroups,
    invalidateCache,
} = groupSlice.actions;

// Selectors
export const selectActiveGroups = (state: RootState) => state.group.activeGroups;
export const selectArchivedGroups = (state: RootState) => state.group.archivedGroups;
export const selectGroupsLoading = (state: RootState) => state.group.loading;
export const selectGroupsError = (state: RootState) => state.group.error;
export const selectOpenGroupId = (state: RootState) => state.group.openGroupId;

export default groupSlice.reducer;
