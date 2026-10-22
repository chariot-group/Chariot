import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { Character, NPC } from '@/types/character';
import { hasGroups, linkedPlayerIdOf } from '@/lib/npcPlayerLink';

interface CharacterState {
    // Characters without group
    charactersWithoutGroup: Character[];
    loadingWithoutGroup: boolean;
    loadingMoreWithoutGroup: boolean;
    errorWithoutGroup: string | null;
    lastFetchWithoutGroup: number | null;
    currentPageWithoutGroup: number;
    hasMoreWithoutGroup: boolean;
    totalWithoutGroup: number;

    /** @see FR-npc-player-link */
    linkedNpcs: NPC[];
    unlinkedNpcsWithoutGroup: NPC[];

    // All characters
    allCharacters: Character[];
    loadingAll: boolean;
    errorAll: string | null;
    lastFetchAll: number | null;
}

/**
 * Conserve l'ordre tout en supprimant les doublons par `_id` (premier vu gagne).
 * Garde-fou contre les fetch/loadMore qui se chevauchent (StrictMode, clics rapides, upsert + page refetch).
 */
const dedupeCharactersById = (characters: Character[]): Character[] => {
    const byId = new Map<string, Character>();
    for (const character of characters) {
        if (!character?._id) continue;
        if (!byId.has(character._id)) byId.set(character._id, character);
    }
    return Array.from(byId.values());
};

const initialState: CharacterState = {
    charactersWithoutGroup: [],
    loadingWithoutGroup: false,
    loadingMoreWithoutGroup: false,
    errorWithoutGroup: null,
    lastFetchWithoutGroup: null,
    currentPageWithoutGroup: 1,
    hasMoreWithoutGroup: true,
    totalWithoutGroup: 0,

    linkedNpcs: [],
    unlinkedNpcsWithoutGroup: [],

    allCharacters: [],
    loadingAll: false,
    errorAll: null,
    lastFetchAll: null,
};

const characterSlice = createSlice({
    name: 'character',
    initialState,
    reducers: {
        // Characters without group - initial fetch
        fetchCharactersWithoutGroupStart: (state) => {
            state.loadingWithoutGroup = true;
            state.errorWithoutGroup = null;
        },
        fetchCharactersWithoutGroupSuccess: (state, action: PayloadAction<{ characters: Character[]; total: number }>) => {
            state.charactersWithoutGroup = dedupeCharactersById(action.payload.characters);
            state.totalWithoutGroup = action.payload.total;
            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < action.payload.total;
            state.loadingWithoutGroup = false;
            state.errorWithoutGroup = null;
            state.lastFetchWithoutGroup = Date.now();
            state.currentPageWithoutGroup = 1;
        },

        // Characters without group - load more (pagination)
        loadMoreCharactersWithoutGroupStart: (state) => {
            state.loadingMoreWithoutGroup = true;
            state.errorWithoutGroup = null;
        },
        loadMoreCharactersWithoutGroupSuccess: (state, action: PayloadAction<{ characters: Character[]; total: number }>) => {
            state.charactersWithoutGroup = dedupeCharactersById([
                ...state.charactersWithoutGroup,
                ...action.payload.characters,
            ]);
            state.totalWithoutGroup = action.payload.total;
            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < action.payload.total;
            state.loadingMoreWithoutGroup = false;
            state.errorWithoutGroup = null;
            state.currentPageWithoutGroup += 1;
        },
        fetchCharactersWithoutGroupFailure: (state, action: PayloadAction<string>) => {
            state.loadingWithoutGroup = false;
            state.loadingMoreWithoutGroup = false;
            state.errorWithoutGroup = action.payload;
        },

        upsertCharacterWithoutGroup: (state, action: PayloadAction<Character>) => {
            const character = action.payload;
            const existingIndex = state.charactersWithoutGroup.findIndex((item) => item._id === character._id);
            const isPlayerCharacter = 'progression' in character;

            if (!isPlayerCharacter) {
                if (existingIndex !== -1) {
                    state.charactersWithoutGroup.splice(existingIndex, 1);
                    state.totalWithoutGroup = Math.max(0, state.totalWithoutGroup - 1);
                    state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < state.totalWithoutGroup;
                }
                return;
            }

            const hasGroupsValue = hasGroups(character);
            if (hasGroupsValue) {
                if (existingIndex !== -1) {
                    state.charactersWithoutGroup.splice(existingIndex, 1);
                    state.totalWithoutGroup = Math.max(0, state.totalWithoutGroup - 1);
                }
            } else if (existingIndex !== -1) {
                state.charactersWithoutGroup[existingIndex] = character;
            } else {
                state.charactersWithoutGroup.unshift(character);
                state.totalWithoutGroup += 1;
            }

            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < state.totalWithoutGroup;
        },

        removeCharacterWithoutGroup: (state, action: PayloadAction<string>) => {
            const characterId = action.payload;
            const existingIndex = state.charactersWithoutGroup.findIndex((item) => item._id === characterId);
            if (existingIndex === -1) return;

            state.charactersWithoutGroup.splice(existingIndex, 1);
            state.totalWithoutGroup = Math.max(0, state.totalWithoutGroup - 1);
            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < state.totalWithoutGroup;
        },

        setLinkedNpcs: (state, action: PayloadAction<NPC[]>) => {
            state.linkedNpcs ??= [];
            state.linkedNpcs = dedupeCharactersById(action.payload) as NPC[];
        },
        setUnlinkedNpcsWithoutGroup: (state, action: PayloadAction<NPC[]>) => {
            state.unlinkedNpcsWithoutGroup ??= [];
            state.linkedNpcs ??= [];
            state.unlinkedNpcsWithoutGroup = dedupeCharactersById(action.payload) as NPC[];
        },
        upsertPlayerSpaceNpc: (state, action: PayloadAction<NPC>) => {
            state.linkedNpcs ??= [];
            state.unlinkedNpcsWithoutGroup ??= [];
            const npc = action.payload;
            if (!npc?._id) return;
            state.linkedNpcs = state.linkedNpcs.filter((item) => item._id !== npc._id);
            state.unlinkedNpcsWithoutGroup = state.unlinkedNpcsWithoutGroup.filter((item) => item._id !== npc._id);

            const linkedId = linkedPlayerIdOf(npc);
            if (linkedId) {
                state.linkedNpcs.unshift(npc);
                return;
            }
            if (!hasGroups(npc)) {
                state.unlinkedNpcsWithoutGroup.unshift(npc);
            }
        },
        removePlayerSpaceNpc: (state, action: PayloadAction<string>) => {
            state.linkedNpcs ??= [];
            state.unlinkedNpcsWithoutGroup ??= [];
            const npcId = action.payload;
            state.linkedNpcs = state.linkedNpcs.filter((item) => item._id !== npcId);
            state.unlinkedNpcsWithoutGroup = state.unlinkedNpcsWithoutGroup.filter((item) => item._id !== npcId);
        },

        // All characters
        fetchAllCharactersStart: (state) => {
            state.loadingAll = true;
            state.errorAll = null;
        },
        fetchAllCharactersSuccess: (state, action: PayloadAction<Character[]>) => {
            state.allCharacters = action.payload;
            state.loadingAll = false;
            state.errorAll = null;
            state.lastFetchAll = Date.now();
        },
        fetchAllCharactersFailure: (state, action: PayloadAction<string>) => {
            state.loadingAll = false;
            state.errorAll = action.payload;
        },

        // Clear and invalidate
        clearCharacters: (state) => {
            state.charactersWithoutGroup = [];
            state.lastFetchWithoutGroup = null;
            state.errorWithoutGroup = null;
            state.currentPageWithoutGroup = 1;
            state.hasMoreWithoutGroup = true;
            state.totalWithoutGroup = 0;
            state.linkedNpcs = [];
            state.unlinkedNpcsWithoutGroup = [];

            state.allCharacters = [];
            state.lastFetchAll = null;
            state.errorAll = null;
        },
        invalidateCharacterCache: (state) => {
            state.lastFetchWithoutGroup = null;
            state.lastFetchAll = null;
        },
    },
});

export const {
    fetchCharactersWithoutGroupStart,
    fetchCharactersWithoutGroupSuccess,
    loadMoreCharactersWithoutGroupStart,
    loadMoreCharactersWithoutGroupSuccess,
    fetchCharactersWithoutGroupFailure,
    fetchAllCharactersStart,
    fetchAllCharactersSuccess,
    fetchAllCharactersFailure,
    upsertCharacterWithoutGroup,
    removeCharacterWithoutGroup,
    setLinkedNpcs,
    setUnlinkedNpcsWithoutGroup,
    upsertPlayerSpaceNpc,
    removePlayerSpaceNpc,
    clearCharacters,
    invalidateCharacterCache,
} = characterSlice.actions;

// Selectors - Characters without group
export const selectCharactersWithoutGroup = (state: RootState) => state.character.charactersWithoutGroup;
export const selectCharactersWithoutGroupLoading = (state: RootState) => state.character.loadingWithoutGroup;
export const selectCharactersWithoutGroupLoadingMore = (state: RootState) => state.character.loadingMoreWithoutGroup;
export const selectCharactersWithoutGroupError = (state: RootState) => state.character.errorWithoutGroup;
export const selectCharactersWithoutGroupHasMore = (state: RootState) => state.character.hasMoreWithoutGroup;
export const selectCharactersWithoutGroupTotal = (state: RootState) => state.character.totalWithoutGroup;
export const selectCharactersWithoutGroupCurrentPage = (state: RootState) => state.character.currentPageWithoutGroup;
export const selectCharactersWithoutGroupLastFetch = (state: RootState) => state.character.lastFetchWithoutGroup;
export const selectLinkedNpcs = (state: RootState) => state.character.linkedNpcs;
export const selectUnlinkedNpcsWithoutGroup = (state: RootState) => state.character.unlinkedNpcsWithoutGroup;

// Selectors - All characters
export const selectAllCharacters = (state: RootState) => state.character.allCharacters;
export const selectAllCharactersLoading = (state: RootState) => state.character.loadingAll;
export const selectAllCharactersError = (state: RootState) => state.character.errorAll;

export default characterSlice.reducer;
