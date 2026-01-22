import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface CampaignContextState {
    selectedCampaignId: string | null;
}

const initialState: CampaignContextState = {
    selectedCampaignId: null,
};

const campaignContextSlice = createSlice({
    name: 'campaignContext',
    initialState,
    reducers: {
        setSelectedCampaign: (state, action: PayloadAction<string | null>) => {
            state.selectedCampaignId = action.payload;
        },
        clearSelectedCampaign: (state) => {
            state.selectedCampaignId = null;
        },
    },
});

export const {
    setSelectedCampaign,
    clearSelectedCampaign,
} = campaignContextSlice.actions;

// Selectors
export const selectSelectedCampaignId = (state: RootState) => state.campaignContext.selectedCampaignId;

export default campaignContextSlice.reducer;
