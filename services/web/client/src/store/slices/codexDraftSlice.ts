import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { NPC } from '@/types/character';

interface CodexDraftState {
    npcDraft: Partial<NPC> | null;
}

const initialState: CodexDraftState = {
    npcDraft: null,
};

const codexDraftSlice = createSlice({
    name: 'codexDraft',
    initialState,
    reducers: {
        setNpcCodexDraft: (state, action: PayloadAction<Partial<NPC>>) => {
            state.npcDraft = action.payload;
        },
        clearNpcCodexDraft: (state) => {
            state.npcDraft = null;
        },
    },
});

export const {
    setNpcCodexDraft,
    clearNpcCodexDraft,
} = codexDraftSlice.actions;

export const selectNpcCodexDraft = (state: RootState) => state.codexDraft.npcDraft;

export default codexDraftSlice.reducer;
