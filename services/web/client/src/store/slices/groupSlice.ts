import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { Group, GroupState } from '@/types/campaign';

const initialState: GroupState = {
    activeGroups: [],
    archivedGroups: [],
    groupsCampaignId: null,
    loading: false,
    loadingMoreActive: false,
    loadingMoreArchived: false,
    error: null,
    openGroupId: [],
    lastFetch: null,
    activePage: 1,
    activeHasMore: true,
    activeTotal: 0,
    archivedPage: 1,
    archivedHasMore: true,
    archivedTotal: 0,
};

const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        fetchGroupsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchGroupsSuccess: (
            state,
            action: PayloadAction<{
                campaignId: string;
                active: Group[];
                archived: Group[];
                pageSize: number;
                activeTotal?: number;
                archivedTotal?: number;
            }>,
        ) => {
            const { campaignId, active, archived, pageSize, activeTotal, archivedTotal } = action.payload;
            state.activeGroups = active;
            state.archivedGroups = archived;
            state.groupsCampaignId = campaignId;
            state.loading = false;
            state.loadingMoreActive = false;
            state.loadingMoreArchived = false;
            state.error = null;
            state.lastFetch = Date.now();
            state.activePage = 1;
            state.archivedPage = 1;
            if (typeof activeTotal === 'number' && Number.isFinite(activeTotal) && activeTotal >= 0) {
                state.activeTotal = activeTotal;
                state.activeHasMore = active.length < activeTotal;
            } else {
                state.activeTotal = active.length;
                state.activeHasMore = active.length >= pageSize;
            }
            if (typeof archivedTotal === 'number' && Number.isFinite(archivedTotal) && archivedTotal >= 0) {
                state.archivedTotal = archivedTotal;
                state.archivedHasMore = archived.length < archivedTotal;
            } else {
                state.archivedTotal = archived.length;
                state.archivedHasMore = archived.length >= pageSize;
            }
        },
        loadMoreActiveGroupsStart: (state) => {
            state.loadingMoreActive = true;
            state.error = null;
        },
        loadMoreActiveGroupsSuccess: (
            state,
            action: PayloadAction<{ groups: Group[]; total?: number; pageSize: number }>,
        ) => {
            const { groups: incoming, total, pageSize } = action.payload;
            const existingIds = new Set(state.activeGroups.map((g) => g._id));
            const batch = incoming.filter((g) => !existingIds.has(g._id));
            state.activeGroups = [...state.activeGroups, ...batch];
            state.loadingMoreActive = false;
            state.error = null;
            state.lastFetch = Date.now();
            state.activePage += 1;
            if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
                state.activeTotal = total;
                state.activeHasMore = state.activeGroups.length < total;
            } else {
                state.activeTotal = state.activeGroups.length;
                state.activeHasMore = batch.length >= pageSize && batch.length > 0;
            }
        },
        loadMoreArchivedGroupsStart: (state) => {
            state.loadingMoreArchived = true;
            state.error = null;
        },
        loadMoreArchivedGroupsSuccess: (
            state,
            action: PayloadAction<{ groups: Group[]; total?: number; pageSize: number }>,
        ) => {
            const { groups: incoming, total, pageSize } = action.payload;
            const existingIds = new Set(state.archivedGroups.map((g) => g._id));
            const batch = incoming.filter((g) => !existingIds.has(g._id));
            state.archivedGroups = [...state.archivedGroups, ...batch];
            state.loadingMoreArchived = false;
            state.error = null;
            state.lastFetch = Date.now();
            state.archivedPage += 1;
            if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
                state.archivedTotal = total;
                state.archivedHasMore = state.archivedGroups.length < total;
            } else {
                state.archivedTotal = state.archivedGroups.length;
                state.archivedHasMore = batch.length >= pageSize && batch.length > 0;
            }
        },
        fetchGroupsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.loadingMoreActive = false;
            state.loadingMoreArchived = false;
            state.error = action.payload;
            state.lastFetch = null;
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
                state.openGroupId = current.filter((groupId) => groupId !== id);
            } else {
                state.openGroupId = [...current, id];
            }
        },
        clearGroups: (state) => {
            state.activeGroups = [];
            state.archivedGroups = [];
            state.groupsCampaignId = null;
            state.loading = false;
            state.error = null;
            state.openGroupId = [];
            state.lastFetch = null;
            state.activePage = 1;
            state.archivedPage = 1;
            state.activeHasMore = true;
            state.archivedHasMore = true;
            state.activeTotal = 0;
            state.archivedTotal = 0;
            state.loadingMoreActive = false;
            state.loadingMoreArchived = false;
        },
        invalidateCache: (state) => {
            state.lastFetch = null;
        },
        addCharacterToGroup: (
            state,
            action: PayloadAction<{
                groupId: string;
                character: { _id: string; firstname: string; lastname: string; surname: string; userId?: string };
            }>,
        ) => {
            const { groupId, character } = action.payload;

            const targetGroup =
                state.activeGroups.find((group) => group._id === groupId) ??
                state.archivedGroups.find((group) => group._id === groupId);

            if (!targetGroup) {
                return;
            }

            const alreadyExists = targetGroup.characters.some((existing) => existing._id === character._id);
            if (alreadyExists) {
                return;
            }

            targetGroup.characters = [
                ...targetGroup.characters,
                {
                    _id: character._id,
                    firstname: character.firstname,
                    lastname: character.lastname,
                    surname: character.surname,
                    userId: character.userId ?? '',
                },
            ];
        },
        upsertCharacterInGroups: (
            state,
            action: PayloadAction<{
                _id: string;
                firstname: string;
                lastname: string;
                surname: string;
                userId?: string;
            }>,
        ) => {
            const updatedCharacter = action.payload;

            const updateGroupCharacters = (groups: Group[]) => {
                groups.forEach((group) => {
                    group.characters = group.characters.map((existing) =>
                        existing._id === updatedCharacter._id
                            ? {
                                  ...existing,
                                  firstname: updatedCharacter.firstname,
                                  lastname: updatedCharacter.lastname,
                                  surname: updatedCharacter.surname,
                                  userId: updatedCharacter.userId ?? existing.userId,
                              }
                            : existing,
                    );
                });
            };

            updateGroupCharacters(state.activeGroups);
            updateGroupCharacters(state.archivedGroups);
        },
        removeCharacterFromGroup: (
            state,
            action: PayloadAction<{ groupId: string; characterId: string }>,
        ) => {
            const { groupId, characterId } = action.payload;

            const targetGroup =
                state.activeGroups.find((group) => group._id === groupId) ??
                state.archivedGroups.find((group) => group._id === groupId);

            if (!targetGroup) return;

            targetGroup.characters = targetGroup.characters.filter(
                (existing) => existing._id !== characterId,
            );
        },
    },
});

export const {
    fetchGroupsStart,
    fetchGroupsSuccess,
    fetchGroupsFailure,
    loadMoreActiveGroupsStart,
    loadMoreActiveGroupsSuccess,
    loadMoreArchivedGroupsStart,
    loadMoreArchivedGroupsSuccess,
    setOpenGroup,
    clearGroups,
    invalidateCache,
    addCharacterToGroup,
    upsertCharacterInGroups,
    removeCharacterFromGroup,
} = groupSlice.actions;

export const selectGroupsCampaignId = (state: RootState) => state.group.groupsCampaignId;
export const selectGroupsLastFetch = (state: RootState) => state.group.lastFetch;
export const selectActiveGroups = (state: RootState) => state.group.activeGroups;
export const selectArchivedGroups = (state: RootState) => state.group.archivedGroups;
export const selectGroupsLoading = (state: RootState) => state.group.loading;
export const selectGroupsLoadingMoreActive = (state: RootState) => state.group.loadingMoreActive;
export const selectGroupsLoadingMoreArchived = (state: RootState) => state.group.loadingMoreArchived;
export const selectGroupsError = (state: RootState) => state.group.error;
export const selectOpenGroupId = (state: RootState) => state.group.openGroupId;
export const selectActiveGroupsPage = (state: RootState) => state.group.activePage;
export const selectArchivedGroupsPage = (state: RootState) => state.group.archivedPage;
export const selectActiveGroupsHasMore = (state: RootState) => state.group.activeHasMore;
export const selectActiveGroupsTotal = (state: RootState) => state.group.activeTotal;
export const selectArchivedGroupsHasMore = (state: RootState) => state.group.archivedHasMore;
export const selectArchivedGroupsTotal = (state: RootState) => state.group.archivedTotal;

export default groupSlice.reducer;
