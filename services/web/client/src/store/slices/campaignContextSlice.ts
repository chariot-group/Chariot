import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface CampaignContextState {
    selectedCampaignId: string | null;
    groupToOpen: string | null;
}

const initialState: CampaignContextState = {
    selectedCampaignId: null,
    groupToOpen: null,
};

const campaignContextSlice = createSlice({
    name: 'campaignContext',
    initialState,
    reducers: {
        setSelectedCampaign: (state, action: PayloadAction<string | null>) => {
            state.selectedCampaignId = action.payload;
        },
        setGroupToOpen: (state, action: PayloadAction<string | null>) => {
            state.groupToOpen = action.payload;
        },
        clearSelectedCampaign: (state) => {
            state.selectedCampaignId = null;
            state.groupToOpen = null;
        },
    },
});

export const {
    setSelectedCampaign,
    setGroupToOpen,
    clearSelectedCampaign,
} = campaignContextSlice.actions;

// Selectors
export const selectSelectedCampaignId = (state: RootState) => state.campaignContext.selectedCampaignId;
export const selectGroupToOpen = (state: RootState) => state.campaignContext.groupToOpen;

export default campaignContextSlice.reducer;
