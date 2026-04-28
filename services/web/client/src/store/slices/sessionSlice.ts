import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/index';
import type { SessionParticipant, SessionStatus } from '@/services/SessionService';

export interface CurrentSessionState {
    code: string | null;
    campaignId: string | null;
    isInSession: boolean;
    status: SessionStatus | null;
    expiresAt: string | null;
    participants: SessionParticipant[];
    tokensByUser: Record<string, number>;
}

const initialState: CurrentSessionState = {
    code: null,
    campaignId: null,
    isInSession: false,
    status: null,
    expiresAt: null,
    participants: [],
    tokensByUser: {},
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
            state.status = null;
            state.expiresAt = null;
            state.participants = [];
            state.tokensByUser = {};
        },
        setSessionStatus: (state, action: PayloadAction<SessionStatus>) => {
            state.status = action.payload;
        },
        setSessionExpiresAt: (state, action: PayloadAction<string | null>) => {
            state.expiresAt = action.payload;
        },
        setSessionParticipants: (state, action: PayloadAction<SessionParticipant[]>) => {
            state.participants = action.payload;
        },
        setSessionTokensByUser: (state, action: PayloadAction<Record<string, number>>) => {
            state.tokensByUser = action.payload;
        },
    },
});

export const { setCurrentSession, clearCurrentSession, setSessionStatus, setSessionExpiresAt, setSessionParticipants, setSessionTokensByUser } = sessionSlice.actions;

export const selectCurrentSession = (state: RootState) => state.session;
export const selectIsInSession = (state: RootState) => state.session.isInSession;
export const selectSessionCode = (state: RootState) => state.session.code;
export const selectSessionCampaignId = (state: RootState) => state.session.campaignId;
export const selectSessionStatus = (state: RootState) => state.session.status;
export const selectSessionExpiresAt = (state: RootState) => state.session.expiresAt;
export const selectSessionParticipants = (state: RootState) => state.session.participants;
export const selectSessionTokensByUser = (state: RootState) => state.session.tokensByUser;

export default sessionSlice.reducer;
