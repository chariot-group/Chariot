import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/index';

export interface CurrentSessionState {
    code: string | null;
    campaignId: string | null;
    isInSession: boolean;
}

const initialState: CurrentSessionState = {
    code: null,
    campaignId: null,
    isInSession: false,
};

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setCurrentSession: (state, action: PayloadAction<{ code: string; campaignId: string }>) => {
            state.code = action.payload.code;
            state.campaignId = action.payload.campaignId;
            state.isInSession = true;
        },
        clearCurrentSession: (state) => {
            state.code = null;
            state.campaignId = null;
            state.isInSession = false;
        },
    },
});

export const { setCurrentSession, clearCurrentSession } = sessionSlice.actions;

export const selectCurrentSession = (state: RootState) => state.session;
export const selectIsInSession = (state: RootState) => state.session.isInSession;
export const selectSessionCode = (state: RootState) => state.session.code;
export const selectSessionCampaignId = (state: RootState) => state.session.campaignId;

export default sessionSlice.reducer;
