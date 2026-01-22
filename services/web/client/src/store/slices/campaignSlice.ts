import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { Campaign, CampaignState } from '@/types/campaign';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialState: CampaignState = {
    campaigns: [],
    loading: false,
    error: null,
    lastFetch: null,
};

const campaignSlice = createSlice({
    name: 'campaign',
    initialState,
    reducers: {
        fetchCampaignsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchCampaignsSuccess: (state, action: PayloadAction<Campaign[]>) => {
            state.campaigns = action.payload;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
        },
        fetchCampaignsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearCampaigns: (state) => {
            state.campaigns = [];
            state.lastFetch = null;
            state.error = null;
        },
        invalidateCache: (state) => {
            state.lastFetch = null;
        },
    },
});

export const {
    fetchCampaignsStart,
    fetchCampaignsSuccess,
    fetchCampaignsFailure,
    clearCampaigns,
    invalidateCache,
} = campaignSlice.actions;

// Selectors
export const selectCampaigns = (state: RootState) => state.campaign.campaigns;
export const selectCampaignsLoading = (state: RootState) => state.campaign.loading;
export const selectCampaignsError = (state: RootState) => state.campaign.error;
export const selectLastFetch = (state: RootState) => state.campaign.lastFetch;

// Sélecteur pour vérifier si le cache est valide
export const selectIsCacheValid = (state: RootState): boolean => {
    const { lastFetch } = state.campaign;
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
};

export default campaignSlice.reducer;
