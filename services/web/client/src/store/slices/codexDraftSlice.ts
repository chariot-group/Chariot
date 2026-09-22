import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { NPC, Player } from '@/types/character';

interface CodexDraftState {
    npcDraft: Partial<NPC> | null;
    playerDraft: Partial<Player> | null;
}

const initialState: CodexDraftState = {
    npcDraft: null,
    playerDraft: null,
};

const codexDraftSlice = createSlice({
    name: 'codexDraft',
    initialState,
    reducers: {
        setNpcCodexDraft: (state, action: PayloadAction<Partial<NPC>>) => {
            state.npcDraft = action.payload;
            state.playerDraft = null;
        },
        setPlayerCodexDraft: (state, action: PayloadAction<Partial<Player>>) => {
            state.playerDraft = action.payload;
            state.npcDraft = null;
        },
        clearNpcCodexDraft: (state) => {
            state.npcDraft = null;
        },
        clearPlayerCodexDraft: (state) => {
            state.playerDraft = null;
        },
        clearCodexDrafts: (state) => {
            state.npcDraft = null;
            state.playerDraft = null;
        },
    },
});

export const {
    setNpcCodexDraft,
    setPlayerCodexDraft,
    clearNpcCodexDraft,
    clearPlayerCodexDraft,
    clearCodexDrafts,
} = codexDraftSlice.actions;

export const selectNpcCodexDraft = (state: RootState) => state.codexDraft.npcDraft;
export const selectPlayerCodexDraft = (state: RootState) => state.codexDraft.playerDraft;

export default codexDraftSlice.reducer;
