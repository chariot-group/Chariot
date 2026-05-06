import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { Campaign, CampaignState } from '@/types/campaign';

const initialState: CampaignState = {
    campaigns: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFetch: null,
    currentPage: 1,
    hasMore: true,
    total: 0,
};

const campaignSlice = createSlice({
    name: 'campaign',
    initialState,
    reducers: {
        fetchCampaignsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchCampaignsSuccess: (
            state,
            action: PayloadAction<{ campaigns: Campaign[]; total?: number; pageSize: number }>,
        ) => {
            const { campaigns, total, pageSize } = action.payload;
            state.campaigns = campaigns;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
            state.currentPage = 1;
            if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
                state.total = total;
                state.hasMore = campaigns.length < total;
            } else {
                state.total = campaigns.length;
                state.hasMore = campaigns.length >= pageSize;
            }
        },
        loadMoreCampaignsStart: (state) => {
            state.loadingMore = true;
            state.error = null;
        },
        loadMoreCampaignsSuccess: (
            state,
            action: PayloadAction<{ campaigns: Campaign[]; total?: number; pageSize: number }>,
        ) => {
            const { campaigns: incoming, total, pageSize } = action.payload;
            const existingIds = new Set(state.campaigns.map((c) => c._id));
            const batch = incoming.filter((c) => !existingIds.has(c._id));
            state.campaigns = [...state.campaigns, ...batch];
            state.loadingMore = false;
            state.error = null;
            state.currentPage += 1;
            if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
                state.total = total;
                state.hasMore = state.campaigns.length < total;
            } else {
                state.total = state.campaigns.length;
                state.hasMore = batch.length >= pageSize && batch.length > 0;
            }
        },
        fetchCampaignsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.loadingMore = false;
            state.error = action.payload;
        },
        clearCampaigns: (state) => {
            state.campaigns = [];
            state.lastFetch = null;
            state.error = null;
            state.currentPage = 1;
            state.hasMore = true;
            state.total = 0;
        },
        invalidateCache: (state) => {
            state.lastFetch = null;
        },
        upsertCampaign: (state, action: PayloadAction<Campaign>) => {
            const index = state.campaigns.findIndex(c => c._id === action.payload._id);
            if (index !== -1) {
                state.campaigns[index] = action.payload;
            } else {
                state.campaigns.unshift(action.payload);
                state.total += 1;
            }
        },
    },
});

export const {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    loadMoreCampaignsStart,
    loadMoreCampaignsSuccess,
    fetchCampaignsFailure,
    clearCampaigns,
    invalidateCache,
    upsertCampaign,
} = campaignSlice.actions;

// Selectors
export const selectCampaigns = (state: RootState) => state.campaign.campaigns;
export const selectCampaignsLoading = (state: RootState) => state.campaign.loading;
export const selectCampaignsLoadingMore = (state: RootState) => state.campaign.loadingMore;
export const selectCampaignsError = (state: RootState) => state.campaign.error;
export const selectLastFetch = (state: RootState) => state.campaign.lastFetch;
export const selectCurrentPage = (state: RootState) => state.campaign.currentPage;
export const selectHasMore = (state: RootState) => state.campaign.hasMore;
export const selectTotal = (state: RootState) => state.campaign.total;

// Sélecteur pour obtenir la campagne sélectionnée
export const selectSelectedCampaign = (state: RootState): Campaign | null => {
    const selectedCampaignId = state.campaignContext.selectedCampaignId;
    if (!selectedCampaignId) return null;
    return state.campaign.campaigns.find(c => c._id === selectedCampaignId) || null;
};

export default campaignSlice.reducer;
